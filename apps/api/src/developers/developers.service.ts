import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DevelopersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const devs = await this.prisma.developerProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
            timezone: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
        assignments: {
          where: {
            status: "ACTIVE",
          },
          include: {
            ticket: {
              select: {
                id: true,
                reference: true,
                title: true,
                status: true,
                remainingEstimatedHours: true,
              },
            },
          },
        },
        availabilities: {
          where: {
            approvalStatus: "APPROVED",
            endDateTime: {
              gte: new Date(),
            },
          },
        },
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });

    return devs.map((d) => {
      // Calcul des heures réservées
      const reservedHours = d.assignments.reduce((sum, a) => {
        const remaining = a.remainingHours ? Number(a.remainingHours) : Number(a.allocatedHours);
        return sum + remaining;
      }, 0);

      const netWeeklyHours = Number(d.weeklyCapacityHours || 40);
      const loadPercentage = netWeeklyHours > 0 ? Math.min(100, Math.round((reservedHours / netWeeklyHours) * 100)) : 0;

      return {
        id: d.id,
        userId: d.userId,
        name: `${d.user.firstName} ${d.user.lastName}`,
        email: d.user.email,
        jobTitle: d.jobTitle,
        profileStatus: d.profileStatus,
        netWeeklyHours,
        reservedHours,
        freeHours: Math.max(0, netWeeklyHours - reservedHours),
        loadPercentage,
        skills: d.skills.map((s) => ({
          id: s.skillId,
          name: s.skill.name,
          category: s.skill.category,
          level: s.proficiencyLevel,
          validatedAt: s.validatedAt,
        })),
        activeAssignmentsCount: d.assignments.length,
        hasUpcomingAbsence: d.availabilities.length > 0,
      };
    });
  }

  async getSkillsCatalogue() {
    return this.prisma.skill.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
  }

  async setDeveloperSkill(developerId: string, skillId: string, level: number, validatorId?: string) {
    if (level < 1 || level > 5) {
      throw new Error("Le niveau de compétence doit être compris entre 1 et 5");
    }

    return this.prisma.developerSkill.upsert({
      where: {
        developerId_skillId: {
          developerId,
          skillId,
        },
      },
      update: {
        proficiencyLevel: level,
        validatedAt: new Date(),
        validatedById: validatorId,
        validationSource: "Validation manuelle HEAD",
      },
      create: {
        developerId,
        skillId,
        proficiencyLevel: level,
        validatedAt: new Date(),
        validatedById: validatorId,
        validationSource: "Validation manuelle HEAD",
      },
    });
  }
}
