import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TicketStatus, AssignmentStatus } from "@prisma/client";

export interface CandidateRecommendation {
  developerId: string;
  developerName: string;
  jobTitle: string;
  email: string;
  isEligible: boolean;
  rejectionReasons: string[];
  totalScore: number;
  breakdown: {
    skillsScore: number; // /45
    capacityScore: number; // /30
    deadlineScore: number; // /15
    continuityScore: number; // /10
  };
  details: {
    matchedSkillsCount: number;
    requiredSkillsCount: number;
    currentLoadPercent: number;
    freeHoursWeekly: number;
    hasClientHistory: boolean;
  };
}

@Injectable()
export class RecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecommendationsForTicket(ticketId: string): Promise<CandidateRecommendation[]> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        skillRequirements: {
          include: { skill: true },
        },
        client: true,
        project: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket non trouvé`);
    }

    const devs = await this.prisma.developerProfile.findMany({
      include: {
        user: true,
        skills: {
          include: { skill: true },
        },
        assignments: {
          where: { status: "ACTIVE" },
          include: { ticket: true },
        },
        exclusions: {
          where: {
            OR: [
              { ticketId: ticket.id },
              { clientId: ticket.clientId || undefined },
            ],
          },
        },
      },
    });

    const recommendations: CandidateRecommendation[] = [];

    for (const dev of devs) {
      const reasons: string[] = [];
      let isEligible = true;

      // Exclusion explicite
      if (dev.exclusions.length > 0) {
        isEligible = false;
        reasons.push(`Exclusion active : ${dev.exclusions[0].reason}`);
      }

      // Vérification compétences obligatoires
      let matchedSkills = 0;
      let skillsScoreSum = 0;
      const totalReq = ticket.skillRequirements.length;

      for (const req of ticket.skillRequirements) {
        const devSkill = dev.skills.find((s) => s.skillId === req.skillId);
        if (!devSkill || devSkill.proficiencyLevel < req.minimumLevel) {
          if (req.isMandatory) {
            isEligible = false;
            reasons.push(
              `Niveau insuffisant sur ${req.skill.name} (Niveau actuel : ${devSkill?.proficiencyLevel || 0}, requis : ${req.minimumLevel})`,
            );
          }
        } else {
          matchedSkills++;
          // Ratio de maîtrise
          const ratio = Math.min(1.25, devSkill.proficiencyLevel / req.minimumLevel);
          skillsScoreSum += ratio;
        }
      }

      // Calcul de charge
      const reservedHours = dev.assignments.reduce((sum, a) => {
        return sum + Number(a.remainingHours || a.allocatedHours);
      }, 0);
      const weeklyMax = Number(dev.weeklyCapacityHours || 40);
      const loadPercent = Math.min(100, Math.round((reservedHours / weeklyMax) * 100));
      const freeHours = Math.max(0, weeklyMax - reservedHours);

      // 1. Score Compétences (Max 45)
      let skillsScore = 0;
      if (totalReq > 0) {
        skillsScore = Math.round((skillsScoreSum / totalReq) * 45);
      } else {
        skillsScore = 40; // Valeur par défaut si aucun prérequis strict
      }
      skillsScore = Math.min(45, skillsScore);

      // 2. Score Capacité disponible (Max 30)
      let capacityScore = 0;
      if (loadPercent <= 50) capacityScore = 30;
      else if (loadPercent <= 75) capacityScore = 22;
      else if (loadPercent <= 90) capacityScore = 14;
      else if (loadPercent < 100) capacityScore = 6;
      else capacityScore = 0;

      // 3. Score Échéance (Max 15)
      let deadlineScore = 15;
      if (loadPercent > 85 && ticket.estimatedHours && Number(ticket.estimatedHours) > freeHours) {
        deadlineScore = 8;
      }

      // 4. Score Continuité Projet / Client (Max 10)
      const hasHistory = dev.assignments.some(
        (a) => a.ticket.clientId === ticket.clientId || a.ticket.projectId === ticket.projectId,
      );
      const continuityScore = hasHistory ? 10 : 0;

      const totalScore = isEligible ? skillsScore + capacityScore + deadlineScore + continuityScore : 0;

      recommendations.push({
        developerId: dev.id,
        developerName: `${dev.user.firstName} ${dev.user.lastName}`,
        jobTitle: dev.jobTitle || "Développeur",
        email: dev.user.email,
        isEligible,
        rejectionReasons: reasons,
        totalScore,
        breakdown: {
          skillsScore,
          capacityScore,
          deadlineScore,
          continuityScore,
        },
        details: {
          matchedSkillsCount: matchedSkills,
          requiredSkillsCount: totalReq,
          currentLoadPercent: loadPercent,
          freeHoursWeekly: freeHours,
          hasClientHistory: hasHistory,
        },
      });
    }

    // Tri : éligibles en tête, puis meilleur score
    return recommendations.sort((a, b) => {
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      return b.totalScore - a.totalScore;
    });
  }

  async assignTicket(
    ticketId: string,
    developerId: string,
    allocatedHours: number,
    assignedById: string,
    isOverride = false,
    overrideReason?: string,
  ) {
    const ticket = await this.prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
    const dev = await this.prisma.developerProfile.findUniqueOrThrow({
      where: { id: developerId },
      include: { user: true },
    });

    const recommendations = await this.getRecommendationsForTicket(ticketId);
    const candidateRec = recommendations.find((r) => r.developerId === developerId);

    const plannedStartDate = new Date();
    const plannedEndDate = ticket.committedDueDate || new Date(Date.now() + 7 * 24 * 3600 * 1000);

    return this.prisma.$transaction(async (tx) => {
      // 1. Créer l'affectation
      const assignment = await tx.assignment.create({
        data: {
          ticketId,
          developerId,
          allocatedHours,
          remainingHours: allocatedHours,
          status: AssignmentStatus.ACTIVE,
          assignedById,
          plannedStartDate,
          plannedEndDate,
          isOverride,
          overrideReason,
          recommendationSnapshot: candidateRec as any,
        },
      });

      // 2. Mettre à jour le ticket vers ASSIGNED
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.ASSIGNED,
          plannedStartDate,
        },
      });

      // 3. Enregistrer l'historique
      await tx.ticketStatusHistory.create({
        data: {
          ticketId,
          fromStatus: ticket.status,
          toStatus: TicketStatus.ASSIGNED,
          actorId: assignedById,
          reason: `Affecté à ${dev.user.firstName} ${dev.user.lastName} (${allocatedHours}h prévues)`,
        },
      });

      // 4. Créer le job Outbox pour envoi d'e-mail automatique Outlook M365 au développeur
      await tx.outboxJob.create({
        data: {
          type: "mail.send.assignment",
          idempotencyKey: `assignment-mail-${assignment.id}`,
          payload: {
            assignmentId: assignment.id,
            ticketReference: ticket.reference,
            ticketTitle: ticket.title,
            recipientEmail: dev.user.email,
            recipientName: `${dev.user.firstName} ${dev.user.lastName}`,
            allocatedHours,
          },
        },
      });

      return assignment;
    });
  }
}
