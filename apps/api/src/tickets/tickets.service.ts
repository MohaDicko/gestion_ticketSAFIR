import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TicketStatus, TicketSource } from "@prisma/client";

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReference(prefix: string): Promise<string> {
    const year = new Date().getFullYear();
    let sequence = await this.prisma.ticketSequence.upsert({
      where: {
        prefix_year: { prefix, year },
      },
      update: {
        lastValue: { increment: 1 },
      },
      create: {
        prefix,
        year,
        lastValue: 1,
      },
    });

    let paddedNumber = String(sequence.lastValue).padStart(4, "0");
    let candidate = `${prefix}-${year}-${paddedNumber}`;

    // Sécurité anti-collision si des tickets ont été insérés en seed
    let exists = await this.prisma.ticket.findUnique({ where: { reference: candidate } });
    while (exists) {
      sequence = await this.prisma.ticketSequence.update({
        where: { prefix_year: { prefix, year } },
        data: { lastValue: { increment: 1 } },
      });
      paddedNumber = String(sequence.lastValue).padStart(4, "0");
      candidate = `${prefix}-${year}-${paddedNumber}`;
      exists = await this.prisma.ticket.findUnique({ where: { reference: candidate } });
    }

    return candidate;
  }

  async findAll(filters?: { status?: TicketStatus; typeId?: string; clientId?: string; search?: string }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.typeId) where.typeId = filters.typeId;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { reference: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return this.prisma.ticket.findMany({
      where,
      include: {
        type: true,
        priority: true,
        client: true,
        project: true,
        skillRequirements: {
          include: { skill: true },
        },
        assignments: {
          where: { status: "ACTIVE" },
          include: {
            developer: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { priority: { rank: "asc" } },
        { createdAt: "desc" },
      ],
    });
  }

  async findOne(idOrRef: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrRef);
    const ticket = await this.prisma.ticket.findFirst({
      where: isUuid ? { id: idOrRef } : { reference: idOrRef },
      include: {
        type: true,
        priority: true,
        client: true,
        project: true,
        clientContact: true,
        consultant: true,
        skillRequirements: {
          include: { skill: true },
        },
        acceptanceCriteria: {
          orderBy: { sortOrder: "asc" },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
        blockers: {
          orderBy: { startedAt: "desc" },
        },
        assignments: {
          include: {
            developer: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket introuvable`);
    }

    return ticket;
  }

  async create(data: {
    title: string;
    description: string;
    typeCode: string;
    priorityCode: string;
    clientId?: string;
    projectId?: string;
    estimatedHours?: number;
    requestedDueDate?: string;
    requiredSkillIds?: { skillId: string; minimumLevel: number }[];
    acceptanceCriteria?: string[];
    actorId?: string;
  }) {
    const type = await this.prisma.ticketType.findUniqueOrThrow({
      where: { code: data.typeCode },
    });

    const priority = await this.prisma.priority.findUniqueOrThrow({
      where: { code: data.priorityCode },
    });

    const reference = await this.generateReference(type.referencePrefix);

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          reference,
          title: data.title,
          description: data.description,
          typeId: type.id,
          priorityId: priority.id,
          status: TicketStatus.RECEIVED,
          source: TicketSource.FORM,
          clientId: data.clientId,
          projectId: data.projectId,
          estimatedHours: data.estimatedHours,
          remainingEstimatedHours: data.estimatedHours,
          requestedDueDate: data.requestedDueDate ? new Date(data.requestedDueDate) : undefined,
          createdById: data.actorId,
        },
      });

      // Compétences requises
      if (data.requiredSkillIds && data.requiredSkillIds.length > 0) {
        for (const req of data.requiredSkillIds) {
          await tx.ticketSkillRequirement.create({
            data: {
              ticketId: ticket.id,
              skillId: req.skillId,
              minimumLevel: req.minimumLevel,
              isMandatory: true,
            },
          });
        }
      }

      // Critères d'acceptation
      if (data.acceptanceCriteria && data.acceptanceCriteria.length > 0) {
        let order = 1;
        for (const desc of data.acceptanceCriteria) {
          if (desc.trim()) {
            await tx.acceptanceCriterion.create({
              data: {
                ticketId: ticket.id,
                description: desc.trim(),
                sortOrder: order++,
              },
            });
          }
        }
      }

      // Historique
      await tx.ticketStatusHistory.create({
        data: {
          ticketId: ticket.id,
          toStatus: TicketStatus.RECEIVED,
          actorId: data.actorId,
          reason: "Création du ticket",
        },
      });

      return ticket;
    });
  }

  async updateStatus(ticketId: string, targetStatus: TicketStatus, actorId?: string, reason?: string) {
    const ticket = await this.findOne(ticketId);

    // Validation des transitions autorisées (Machine à états du cahier des charges)
    this.validateTransition(ticket.status, targetStatus);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: targetStatus,
          statusBeforeBlock: targetStatus === TicketStatus.BLOCKED ? ticket.status : ticket.statusBeforeBlock,
          startedAt: targetStatus === TicketStatus.IN_PROGRESS && !ticket.startedAt ? new Date() : ticket.startedAt,
          deliveredAt: targetStatus === TicketStatus.DELIVERED ? new Date() : ticket.deliveredAt,
          closedAt: targetStatus === TicketStatus.CLOSED ? new Date() : ticket.closedAt,
        },
      });

      await tx.ticketStatusHistory.create({
        data: {
          ticketId,
          fromStatus: ticket.status,
          toStatus: targetStatus,
          actorId,
          reason,
        },
      });

      return updated;
    });
  }

  async declareBlocker(ticketId: string, reason: string, actorId: string) {
    const ticket = await this.findOne(ticketId);
    if (ticket.status === TicketStatus.BLOCKED) {
      throw new BadRequestException("Ce ticket est déjà bloqué");
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.ticketBlocker.create({
        data: {
          ticketId,
          reason,
          declaredById: actorId,
        },
      });

      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.BLOCKED,
          statusBeforeBlock: ticket.status,
        },
      });

      await tx.ticketStatusHistory.create({
        data: {
          ticketId,
          fromStatus: ticket.status,
          toStatus: TicketStatus.BLOCKED,
          actorId,
          reason: `Blocage déclaré : ${reason}`,
        },
      });

      return updated;
    });
  }

  async resolveBlocker(ticketId: string, blockerId: string, resolution: string, actorId: string) {
    const ticket = await this.findOne(ticketId);
    const returnStatus = ticket.statusBeforeBlock || TicketStatus.IN_PROGRESS;

    return this.prisma.$transaction(async (tx) => {
      await tx.ticketBlocker.update({
        where: { id: blockerId },
        data: {
          resolvedAt: new Date(),
          resolution,
        },
      });

      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: returnStatus,
          statusBeforeBlock: null,
        },
      });

      await tx.ticketStatusHistory.create({
        data: {
          ticketId,
          fromStatus: TicketStatus.BLOCKED,
          toStatus: returnStatus,
          actorId,
          reason: `Blocage levé : ${resolution}`,
        },
      });

      return updated;
    });
  }

  private validateTransition(current: TicketStatus, target: TicketStatus) {
    if (current === target) return;

    // Définition des transitions valides selon business-rules.md
    const allowedMap: Record<TicketStatus, TicketStatus[]> = {
      RECEIVED: [TicketStatus.TO_QUALIFY, TicketStatus.REJECTED],
      TO_QUALIFY: [TicketStatus.READY, TicketStatus.REJECTED, TicketStatus.RECEIVED],
      READY: [TicketStatus.ASSIGNED, TicketStatus.TO_QUALIFY],
      ASSIGNED: [TicketStatus.IN_PROGRESS, TicketStatus.READY],
      IN_PROGRESS: [TicketStatus.IN_REVIEW, TicketStatus.IN_TESTING, TicketStatus.BLOCKED, TicketStatus.DELIVERED],
      BLOCKED: [TicketStatus.IN_PROGRESS, TicketStatus.IN_REVIEW, TicketStatus.IN_TESTING],
      IN_REVIEW: [TicketStatus.IN_PROGRESS, TicketStatus.IN_TESTING, TicketStatus.BLOCKED, TicketStatus.DELIVERED],
      IN_TESTING: [TicketStatus.IN_PROGRESS, TicketStatus.IN_REVIEW, TicketStatus.BLOCKED, TicketStatus.DELIVERED],
      DELIVERED: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
      CLOSED: [],
      REJECTED: [TicketStatus.TO_QUALIFY],
    };

    const allowed = allowedMap[current] || [];
    if (!allowed.includes(target)) {
      throw new BadRequestException(`Transition non autorisée de ${current} vers ${target}`);
    }
  }
}
