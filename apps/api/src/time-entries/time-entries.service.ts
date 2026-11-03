import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Prisma,
  TicketStatus,
  WorkSessionStatus,
  TimesheetStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const timeEntryInclude = Prisma.validator<Prisma.TimeEntryInclude>()({
  assignment: {
    include: {
      ticket: {
        include: { client: true },
      },
    },
  },
  developer: {
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  },
});

type DetailedTimeEntry = Prisma.TimeEntryGetPayload<{
  include: typeof timeEntryInclude;
}>;

type DetailedWorkSession = Prisma.WorkSessionGetPayload<{
  include: typeof timeEntryInclude;
}>;

@Injectable()
export class TimeEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getActive(developerId: string) {
    const entry = await this.prisma.workSession.findFirst({
      where: {
        developerId,
        status: { in: [WorkSessionStatus.RUNNING, WorkSessionStatus.PAUSED] },
      },
      include: timeEntryInclude,
    });

    return entry ? this.formatWorkSession(entry) : null;
  }

  async start(developerId: string, ticketId: string) {
    const active = await this.prisma.workSession.findFirst({
      where: {
        developerId,
        status: { in: [WorkSessionStatus.RUNNING, WorkSessionStatus.PAUSED] },
      },
      select: { id: true },
    });
    if (active) {
      throw new ConflictException("Un chronomètre est déjà actif pour ce développeur");
    }

    const assignment = await this.prisma.assignment.findFirst({
      where: {
        developerId,
        ticketId,
        status: "ACTIVE",
      },
      include: { ticket: true },
      orderBy: { assignedAt: "desc" },
    });
    if (!assignment) {
      throw new NotFoundException("Aucune affectation active trouvée pour ce ticket");
    }
    if (
      assignment.ticket.status !== TicketStatus.ASSIGNED &&
      assignment.ticket.status !== TicketStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        "Le chronomètre ne peut démarrer que sur un ticket affecté et en cours de développement",
      );
    }
    const remainingHours = assignment.remainingHours ?? assignment.allocatedHours;
    const ticketRemainingHours =
      assignment.ticket.remainingEstimatedHours ??
      assignment.ticket.estimatedHours ??
      remainingHours;
    if (Number(remainingHours) <= 0 || Number(ticketRemainingHours) <= 0) {
      throw new BadRequestException("Le budget d'heures de cette affectation est épuisé");
    }

    let entry: DetailedWorkSession;
    const startedAt = new Date();
    try {
      entry = await this.prisma.$transaction(async (tx) => {
        const session = await tx.workSession.create({
          data: {
            assignmentId: assignment.id,
            developerId,
            startedAt,
            status: WorkSessionStatus.RUNNING,
          },
          include: timeEntryInclude,
        });
        if (assignment.ticket.status === TicketStatus.ASSIGNED) {
          await tx.ticket.update({
            where: { id: ticketId },
            data: { status: TicketStatus.IN_PROGRESS, startedAt },
          });
        }
        return session;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Un chronomètre est déjà actif pour ce développeur");
      }
      throw error;
    }

    return this.formatWorkSession(entry);
  }

  async pause(developerId: string, entryId: string) {
    const entry = await this.findActiveEntry(developerId, entryId, WorkSessionStatus.RUNNING);
    const updated = await this.prisma.workSession.update({
      where: { id: entry.id },
      data: {
        status: WorkSessionStatus.PAUSED,
        pausedAt: new Date(),
      },
      include: timeEntryInclude,
    });
    return this.formatWorkSession(updated);
  }

  async resume(developerId: string, entryId: string) {
    const entry = await this.findActiveEntry(developerId, entryId, WorkSessionStatus.PAUSED);
    if (!entry.pausedAt) {
      throw new ConflictException("La pause active ne possède pas d'horodatage");
    }

    const now = new Date();
    const pausedSeconds = Math.max(
      0,
      Math.floor((now.getTime() - entry.pausedAt.getTime()) / 1000),
    );
    const updated = await this.prisma.workSession.update({
      where: { id: entry.id },
      data: {
        status: WorkSessionStatus.RUNNING,
        pausedAt: null,
        pausedDurationSeconds: { increment: pausedSeconds },
      },
      include: timeEntryInclude,
    });
    return this.formatWorkSession(updated);
  }

  async stop(developerId: string, entryId: string, comment?: string) {
    const entry = await this.prisma.workSession.findFirst({
      where: {
        id: entryId,
        developerId,
        status: { in: [WorkSessionStatus.RUNNING, WorkSessionStatus.PAUSED] },
      },
      include: timeEntryInclude,
    });
    if (!entry) {
      throw new NotFoundException("Chronomètre actif introuvable");
    }

    const endedAt = new Date();
    const pausedSeconds =
      entry.pausedDurationSeconds +
      (entry.pausedAt
        ? Math.max(0, Math.floor((endedAt.getTime() - entry.pausedAt.getTime()) / 1000))
        : 0);
    const durationSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - entry.startedAt.getTime()) / 1000) - pausedSeconds,
    );

    if (durationSeconds < 30) {
      await this.prisma.workSession.delete({ where: { id: entry.id } });
      return { ignored: true, durationSeconds };
    }

    const durationHours = Math.round((durationSeconds / 3600) * 100) / 100;
    const completedEntry = await this.prisma.$transaction(async (tx) => {
      const timeEntry = await tx.timeEntry.create({
        data: {
          assignmentId: entry.assignmentId,
          developerId: entry.developerId,
          workDate: this.toDateOnly(entry.startedAt),
          startedAt: entry.startedAt,
          endedAt,
          durationSeconds,
          durationHours,
          comment: comment?.trim() || entry.comment,
        },
        include: timeEntryInclude,
      });
      await tx.workSession.delete({ where: { id: entry.id } });
      const assignmentRemaining =
        entry.assignment.remainingHours ?? entry.assignment.allocatedHours;
      const ticketRemaining =
        entry.assignment.ticket.remainingEstimatedHours ??
        entry.assignment.ticket.estimatedHours ??
        0;
      await tx.assignment.update({
        where: { id: entry.assignmentId },
        data: {
          remainingHours: Math.max(0, Number(assignmentRemaining) - durationHours),
          remainingUpdatedAt: endedAt,
        },
      });
      await tx.ticket.update({
        where: { id: entry.assignment.ticketId },
        data: {
          spentHours: { increment: durationHours },
          remainingEstimatedHours: Math.max(
            0,
            Number(ticketRemaining) - durationHours,
          ),
        },
      });
      return timeEntry;
    });

    return { ignored: false, entry: this.formatEntry(completedEntry) };
  }

  async getReport(developerId: string, periodStartValue: string, periodEndValue: string) {
    const periodStart = this.parseDate(periodStartValue, "date de début");
    const periodEnd = this.parseDate(periodEndValue, "date de fin");
    this.validateRange(periodStart, periodEnd);

    const [entries, timesheet] = await Promise.all([
      this.prisma.timeEntry.findMany({
        where: {
          developerId,
          workDate: { gte: periodStart, lte: periodEnd },
        },
        include: timeEntryInclude,
        orderBy: [{ workDate: "asc" }, { startedAt: "asc" }],
      }),
      this.prisma.timesheet.findUnique({
        where: {
          developerId_periodStart_periodEnd: {
            developerId,
            periodStart,
            periodEnd,
          },
        },
        include: {
          approvedBy: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
    ]);

    return {
      entries: entries.map((entry) => this.formatEntry(entry)),
      timesheet: timesheet
        ? {
            status: timesheet.status,
            submittedAt: timesheet.submittedAt,
            approvedAt: timesheet.approvedAt,
            approvedByName: timesheet.approvedBy
              ? `${timesheet.approvedBy.firstName} ${timesheet.approvedBy.lastName}`
              : null,
          }
        : null,
    };
  }

  async submitTimesheet(
    developerId: string,
    periodStartValue: string,
    periodEndValue: string,
  ) {
    const { periodStart, periodEnd } = this.getValidatedRange(
      periodStartValue,
      periodEndValue,
    );
    await this.ensureEntriesExist(developerId, periodStart, periodEnd);

    const where = {
      developerId_periodStart_periodEnd: {
        developerId,
        periodStart,
        periodEnd,
      },
    };
    const existing = await this.prisma.timesheet.findUnique({ where });
    if (existing?.status === TimesheetStatus.APPROVED) {
      throw new ConflictException("Cette feuille de temps a déjà été approuvée");
    }

    const timesheet = await this.prisma.timesheet.upsert({
      where,
      create: {
        developerId,
        periodStart,
        periodEnd,
        status: TimesheetStatus.SUBMITTED,
      },
      update: {
        status: TimesheetStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });
    return {
      status: timesheet.status,
      submittedAt: timesheet.submittedAt,
      approvedAt: timesheet.approvedAt,
      approvedByName: null,
    };
  }

  async approveTimesheet(
    adminId: string,
    developerId: string,
    periodStartValue: string,
    periodEndValue: string,
  ) {
    const { periodStart, periodEnd } = this.getValidatedRange(
      periodStartValue,
      periodEndValue,
    );
    await this.ensureEntriesExist(developerId, periodStart, periodEnd);

    const where = {
      developerId_periodStart_periodEnd: {
        developerId,
        periodStart,
        periodEnd,
      },
    };
    const now = new Date();
    const timesheet = await this.prisma.timesheet.upsert({
      where,
      create: {
        developerId,
        periodStart,
        periodEnd,
        status: TimesheetStatus.APPROVED,
        approvedAt: now,
        approvedById: adminId,
      },
      update: {
        status: TimesheetStatus.APPROVED,
        approvedAt: now,
        approvedById: adminId,
      },
      include: {
        approvedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });
    return {
      status: timesheet.status,
      submittedAt: timesheet.submittedAt,
      approvedAt: timesheet.approvedAt,
      approvedByName: timesheet.approvedBy
        ? `${timesheet.approvedBy.firstName} ${timesheet.approvedBy.lastName}`
        : null,
    };
  }

  private async findActiveEntry(
    developerId: string,
    entryId: string,
    status: WorkSessionStatus,
  ) {
    const entry = await this.prisma.workSession.findFirst({
      where: { id: entryId, developerId, status },
    });
    if (!entry) {
      throw new NotFoundException("Chronomètre actif introuvable ou état invalide");
    }
    return entry;
  }

  private async ensureEntriesExist(
    developerId: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    const periodEndExclusive = new Date(periodEnd);
    periodEndExclusive.setUTCDate(periodEndExclusive.getUTCDate() + 1);
    const activeSession = await this.prisma.workSession.findFirst({
      where: {
        developerId,
        status: { in: [WorkSessionStatus.RUNNING, WorkSessionStatus.PAUSED] },
        startedAt: { gte: periodStart, lt: periodEndExclusive },
      },
      select: { id: true },
    });
    if (activeSession) {
      throw new BadRequestException(
        "Arrêtez le chronomètre actif avant de transmettre ou valider cette période",
      );
    }

    const count = await this.prisma.timeEntry.count({
      where: {
        developerId,
        workDate: { gte: periodStart, lte: periodEnd },
      },
    });
    if (count === 0) {
      throw new BadRequestException("Aucune session terminée à valider sur cette période");
    }
  }

  private getValidatedRange(startValue: string, endValue: string) {
    const periodStart = this.parseDate(startValue, "date de début");
    const periodEnd = this.parseDate(endValue, "date de fin");
    this.validateRange(periodStart, periodEnd);
    return { periodStart, periodEnd };
  }

  private parseDate(value: string, label: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(`Format invalide pour la ${label}`);
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException(`Date invalide pour la ${label}`);
    }
    return date;
  }

  private validateRange(periodStart: Date, periodEnd: Date) {
    if (periodStart > periodEnd) {
      throw new BadRequestException("La date de début doit précéder la date de fin");
    }
  }

  private toDateOnly(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private formatEntry(entry: DetailedTimeEntry) {
    const developer = entry.developer.user;
    const durationSeconds =
      entry.durationSeconds || Math.round(Number(entry.durationHours) * 3600);
    return {
      id: entry.id,
      ticketId: entry.assignment.ticketId,
      ticketReference: entry.assignment.ticket.reference,
      ticketTitle: entry.assignment.ticket.title,
      clientCompany: entry.assignment.ticket.client?.name || "Safir Consulting",
      developerId: entry.developerId,
      developerName: `${developer.firstName} ${developer.lastName}`,
      developerEmail: developer.email,
      startedAt: entry.startedAt.toISOString(),
      endedAt: entry.endedAt?.toISOString(),
      durationSeconds,
      durationMinutes: Math.round(durationSeconds / 60),
      durationHours: Number(entry.durationHours),
      date: entry.workDate.toISOString().slice(0, 10),
      note: entry.comment,
      status: "COMPLETED" as const,
    };
  }

  private formatWorkSession(entry: DetailedWorkSession) {
    const developer = entry.developer.user;
    return {
      id: entry.id,
      ticketId: entry.assignment.ticketId,
      ticketReference: entry.assignment.ticket.reference,
      ticketTitle: entry.assignment.ticket.title,
      clientCompany: entry.assignment.ticket.client?.name || "Safir Consulting",
      developerId: entry.developerId,
      developerName: `${developer.firstName} ${developer.lastName}`,
      developerEmail: developer.email,
      startedAt: entry.startedAt.toISOString(),
      durationSeconds: 0,
      durationMinutes: 0,
      durationHours: 0,
      date: entry.startedAt.toISOString().slice(0, 10),
      note: entry.comment,
      status: entry.status,
      pausedAt: entry.pausedAt?.toISOString(),
      pausedDurationSeconds: entry.pausedDurationSeconds,
    };
  }
}
