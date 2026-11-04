import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AssignmentStatus, TicketStatus, TicketSource, Role } from "@prisma/client";

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
        blockers: {
          orderBy: { startedAt: "desc" },
        },
        comments: {
          include: {
            author: {
              select: { firstName: true, lastName: true, email: true, roles: true },
            },
          },
          orderBy: { createdAt: "asc" },
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
    let ticket = await this.prisma.ticket.findFirst({
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
          include: {
            author: {
              select: { firstName: true, lastName: true, email: true, roles: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Support des identifiants mock / client (ex: tix-1, tix-2, etc.)
    if (!ticket && typeof idOrRef === "string" && idOrRef.startsWith("tix-")) {
      const fallbackRefs: Record<string, string> = {
        "tix-1": "ADD-2026-0001",
        "tix-2": "INT-2026-0002",
        "tix-3": "REP-2026-0003",
        "tix-4": "BUG-2026-0004",
        "tix-5": "ADD-2026-0005",
        "tix-6": "EVO-2026-0006",
      };
      const mappedRef = fallbackRefs[idOrRef];
      if (mappedRef) {
        ticket = await this.prisma.ticket.findFirst({
          where: { reference: mappedRef },
          include: {
            type: true,
            priority: true,
            client: true,
            project: true,
            clientContact: true,
            consultant: true,
            skillRequirements: { include: { skill: true } },
            acceptanceCriteria: { orderBy: { sortOrder: "asc" } },
            statusHistory: { orderBy: { createdAt: "desc" } },
            blockers: { orderBy: { startedAt: "desc" } },
            assignments: {
              include: {
                developer: {
                  include: {
                    user: { select: { firstName: true, lastName: true, email: true } },
                  },
                },
              },
            },
            comments: {
              include: {
                author: {
                  select: { firstName: true, lastName: true, email: true, roles: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        });
      }
    }

    if (!ticket) {
      throw new NotFoundException(`Ticket introuvable`);
    }

    return ticket;
  }

  private async resolveActorUuid(actorId?: string): Promise<string | undefined> {
    if (!actorId) return undefined;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actorId);
    if (isUuid) return actorId;

    if (!this.prisma.user?.findFirst) return undefined;
    const clean = actorId.replace(/^(user-|dev-)/, "").toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: clean, mode: "insensitive" } },
          { firstName: { contains: clean, mode: "insensitive" } },
          { lastName: { contains: clean, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    if (user) return user.id;

    const fallbackUser = await this.prisma.user.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    return fallbackUser?.id;
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
    assignedDeveloperId?: string;
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
          status: data.assignedDeveloperId ? TicketStatus.ASSIGNED : TicketStatus.RECEIVED,
          source: TicketSource.FORM,
          clientId: data.clientId,
          projectId: data.projectId,
          estimatedHours: data.estimatedHours,
          remainingEstimatedHours: data.estimatedHours,
          requestedDueDate: data.requestedDueDate ? new Date(data.requestedDueDate) : undefined,
          createdById: data.actorId,
          plannedStartDate: data.assignedDeveloperId ? new Date() : undefined,
        },
      });

      if (data.assignedDeveloperId) {
        if (!data.actorId) {
          throw new BadRequestException("Un créateur est requis pour affecter un ticket");
        }

        let developer: any = null;
        if (typeof (tx.developerProfile as any)?.findUnique === "function") {
          developer = await (tx.developerProfile as any).findUnique({
            where: { id: data.assignedDeveloperId },
            include: { user: true },
          }).catch(() => null);
        }
        if (!developer && typeof (tx.developerProfile as any)?.findFirst === "function") {
          const cleanDev = data.assignedDeveloperId.replace(/^dev-/, "").replace(/^user-/, "").toLowerCase();
          developer = await (tx.developerProfile as any).findFirst({
            where: {
              OR: [
                { id: data.assignedDeveloperId },
                { userId: data.assignedDeveloperId },
                { user: { email: { contains: cleanDev, mode: "insensitive" } } },
                { user: { lastName: { contains: cleanDev, mode: "insensitive" } } },
                { user: { firstName: { contains: cleanDev, mode: "insensitive" } } },
              ],
            },
            include: { user: true },
          });
        }

        if (!developer || !developer.user?.isActive) {
          throw new BadRequestException("Développeur introuvable ou inactif");
        }

        const allocatedHours = data.estimatedHours || 0;
        const plannedStartDate = new Date();
        const plannedEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const assignment = await tx.assignment.create({
          data: {
            ticketId: ticket.id,
            developerId: developer.id,
            allocatedHours,
            remainingHours: allocatedHours,
            status: AssignmentStatus.ACTIVE,
            assignedById: data.actorId,
            plannedStartDate,
            plannedEndDate,
          },
        });

        await tx.outboxJob.create({
          data: {
            type: "mail.send.assignment",
            idempotencyKey: `assignment-mail-${assignment.id}`,
            payload: {
              assignmentId: assignment.id,
              ticketReference: ticket.reference,
              ticketTitle: ticket.title,
              recipientEmail: developer.user.email,
              recipientName: `${developer.user.firstName} ${developer.user.lastName}`,
              allocatedHours,
            },
          },
        });
      }

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
          toStatus: data.assignedDeveloperId ? TicketStatus.ASSIGNED : TicketStatus.RECEIVED,
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
        where: { id: ticket.id },
        data: {
          status: targetStatus,
          statusBeforeBlock: targetStatus === TicketStatus.BLOCKED ? ticket.status : ticket.statusBeforeBlock,
          startedAt: targetStatus === TicketStatus.IN_PROGRESS && !ticket.startedAt ? new Date() : ticket.startedAt,
          deliveredAt: targetStatus === TicketStatus.DELIVERED ? new Date() : ticket.deliveredAt,
          closedAt: targetStatus === TicketStatus.CLOSED ? new Date() : ticket.closedAt,
        },
      });

      if (tx.ticketStatusHistory?.create) {
        await tx.ticketStatusHistory.create({
          data: {
            ticketId: ticket.id,
            fromStatus: ticket.status,
            toStatus: targetStatus,
            actorId,
            reason,
          },
        });
      }

      return updated;
    });
  }

  async declareBlocker(ticketId: string, reason: string, actorId?: string) {
    const ticket = await this.findOne(ticketId);
    if (ticket.status === TicketStatus.BLOCKED) {
      throw new BadRequestException("Ce ticket est déjà bloqué");
    }

    const declaredById = actorId || (ticket as any).assignments?.[0]?.developer?.userId || "user-dev";

    return this.prisma.$transaction(async (tx: any) => {
      // Clôturer toute session de travail active sur ce ticket et consigner le temps travaillé
      if (tx.workSession?.findMany) {
        const activeSessions = await tx.workSession.findMany({
          where: {
            assignment: { ticketId: ticket.id },
            endedAt: null,
          },
          include: { assignment: true },
        });

        for (const session of activeSessions) {
          const endedAt = new Date();
          const durationSeconds = Math.max(
            5,
            Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000) - (session.pausedDurationSeconds || 0),
          );
          const durationHours = Math.max(0.01, Math.round((durationSeconds / 3600) * 100) / 100);

          await tx.workSession.update({
            where: { id: session.id },
            data: { endedAt, status: "STOPPED" },
          });

          if (tx.timeEntry?.create) {
            await tx.timeEntry.create({
              data: {
                assignmentId: session.assignmentId,
                developerId: session.developerId,
                startedAt: session.startedAt,
                endedAt,
                durationHours,
                durationSeconds,
                workDate: new Date(Date.UTC(session.startedAt.getUTCFullYear(), session.startedAt.getUTCMonth(), session.startedAt.getUTCDate())),
                comment: `Arrêt sur blocage : ${reason}`,
              },
            });
          }
        }
      }

      await tx.ticketBlocker.create({
        data: {
          ticketId: ticket.id,
          reason,
          declaredById,
        },
      });

      const updated = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: TicketStatus.BLOCKED,
          statusBeforeBlock: ticket.status,
        },
      });

      if (tx.ticketStatusHistory?.create) {
        await tx.ticketStatusHistory.create({
          data: {
            ticketId: ticket.id,
            fromStatus: ticket.status,
            toStatus: TicketStatus.BLOCKED,
            actorId,
            reason: `Blocage déclaré : ${reason}`,
          },
        });
      }

      return updated;
    });
  }

  async resolveBlockersForTicket(ticketId: string, resolution: string, actorId?: string) {
    const ticket = await this.findOne(ticketId);
    const returnStatus = ticket.statusBeforeBlock || TicketStatus.IN_PROGRESS;

    return this.prisma.$transaction(async (tx: any) => {
      await tx.ticketBlocker.updateMany({
        where: { ticketId: ticket.id, resolvedAt: null },
        data: {
          resolvedAt: new Date(),
          resolution,
        },
      });

      const updated = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: returnStatus,
          statusBeforeBlock: null,
        },
      });

      if (tx.ticketStatusHistory?.create) {
        await tx.ticketStatusHistory.create({
          data: {
            ticketId: ticket.id,
            fromStatus: TicketStatus.BLOCKED,
            toStatus: returnStatus,
            actorId,
            reason: `Blocage levé : ${resolution}`,
          },
        });
      }

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
        where: { id: ticket.id },
        data: {
          status: returnStatus,
          statusBeforeBlock: null,
        },
      });

      if (tx.ticketStatusHistory?.create) {
        await tx.ticketStatusHistory.create({
          data: {
            ticketId: ticket.id,
            fromStatus: TicketStatus.BLOCKED,
            toStatus: returnStatus,
            actorId,
            reason: `Blocage levé : ${resolution}`,
          },
        });
      }

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

  async remove(idOrRef: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrRef);
    const ticket = await this.prisma.ticket.findFirst({
      where: isUuid ? { id: idOrRef } : { reference: idOrRef },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket introuvable: ${idOrRef}`);
    }

    const ticketId = ticket.id;

    await this.prisma.$transaction(async (tx) => {
      await tx.assignment.deleteMany({ where: { ticketId } });
      await tx.ticketStatusHistory.deleteMany({ where: { ticketId } });
      await tx.ticketDependency.deleteMany({ where: { OR: [{ ticketId }, { dependsOnTicketId: ticketId }] } });
      await tx.ticketSkillRequirement.deleteMany({ where: { ticketId } });
      await tx.ticketBlocker.deleteMany({ where: { ticketId } });
      await tx.acceptanceCriterion.deleteMany({ where: { ticketId } });
      await tx.comment.deleteMany({ where: { ticketId } });
      await tx.attachment.deleteMany({ where: { ticketId } });
      await tx.emailMessage.updateMany({
        where: { associatedTicketId: ticketId },
        data: { associatedTicketId: null },
      });
      await tx.ticket.delete({ where: { id: ticketId } });
    });

    return { success: true, deletedTicketId: ticketId, reference: ticket.reference };
  }

  async assign(ticketIdOrRef: string, developerId: string, allocatedHours?: number, actorId?: string) {
    const ticket = await this.findOne(ticketIdOrRef);

    const isDevUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(developerId);
    const cleanDev = developerId.replace(/^dev-/, "").replace(/^user-/, "").toLowerCase();
    const developer = await this.prisma.developerProfile.findFirst({
      where: isDevUuid
        ? { id: developerId }
        : {
            OR: [
              { id: developerId },
              { userId: developerId },
              { user: { email: { contains: cleanDev, mode: "insensitive" } } },
              { user: { lastName: { contains: cleanDev, mode: "insensitive" } } },
              { user: { firstName: { contains: cleanDev, mode: "insensitive" } } },
            ],
          },
      include: { user: true },
    });

    if (!developer) {
      throw new NotFoundException(`Développeur introuvable: ${developerId}`);
    }

    const defaultAdmin = await this.prisma.user.findFirst({
      where: { roles: { has: Role.HEAD } },
      select: { id: true },
    });
    const effectiveActorId = actorId || defaultAdmin?.id || developer.userId;

    const hours = allocatedHours || Number(ticket.remainingEstimatedHours) || Number(ticket.estimatedHours) || 8;
    const plannedStartDate = new Date();
    const plannedEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      // Clôturer les affectations actives précédentes
      await tx.assignment.updateMany({
        where: { ticketId: ticket.id, status: AssignmentStatus.ACTIVE },
        data: {
          status: AssignmentStatus.RELEASED,
          releasedAt: new Date(),
          releaseReason: "Réaffectation par l'Administrateur",
        },
      });

      // Créer la nouvelle affectation active
      const assignment = await tx.assignment.create({
        data: {
          ticketId: ticket.id,
          developerId: developer.id,
          allocatedHours: hours,
          remainingHours: hours,
          status: AssignmentStatus.ACTIVE,
          assignedById: effectiveActorId,
          plannedStartDate,
          plannedEndDate,
        },
        include: {
          developer: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      });

      // Mettre à jour le statut du ticket à ASSIGNED s'il était RECEIVED
      const nextStatus = ticket.status === TicketStatus.RECEIVED ? TicketStatus.ASSIGNED : ticket.status;
      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: nextStatus,
          plannedStartDate: ticket.plannedStartDate || plannedStartDate,
        },
      });

      return assignment;
    });
  }

  async addComment(
    ticketIdOrRef: string,
    data: {
      content: string;
      authorId?: string;
      authorEmail?: string;
      authorRole?: string;
      authorName?: string;
      isBlockerQuestion?: boolean;
      attachment?: any;
    },
  ) {
    const ticket = await this.findOne(ticketIdOrRef);
    if (!data.content?.trim()) {
      throw new BadRequestException("Le contenu du message ne peut pas être vide");
    }

    const safeAuthorId = await this.resolveActorUuid(data.authorId);

    const comment = await this.prisma.comment.create({
      data: {
        ticketId: ticket.id,
        authorId: safeAuthorId,
        authorEmail: data.authorEmail || undefined,
        content: data.content.trim(),
        visibility: "INTERNAL",
        source: "APP",
      },
      include: {
        author: {
          select: { firstName: true, lastName: true, email: true, roles: true },
        },
      },
    });

    return {
      id: comment.id,
      ticketId: ticket.id,
      content: comment.content,
      createdAt: comment.createdAt,
      authorEmail: comment.authorEmail,
      author: comment.author
        ? {
            firstName: comment.author.firstName,
            lastName: comment.author.lastName,
            email: comment.author.email,
            roles: comment.author.roles,
          }
        : undefined,
    };
  }
}
