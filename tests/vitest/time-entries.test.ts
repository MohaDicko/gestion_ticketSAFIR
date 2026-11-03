import { afterEach, describe, expect, it, vi } from "vitest";
import { TimesheetStatus, WorkSessionStatus } from "@prisma/client";
import { TimeEntriesService } from "../../apps/api/src/time-entries/time-entries.service";

const makeEntry = (overrides: Record<string, unknown> = {}) => ({
  id: "entry-1",
  assignmentId: "assignment-1",
  developerId: "developer-1",
  workDate: new Date("2026-11-03T00:00:00.000Z"),
  durationHours: 0,
  durationSeconds: 0,
  comment: null,
  startedAt: new Date("2026-11-03T10:00:00.000Z"),
  endedAt: null,
  pausedAt: null,
  pausedDurationSeconds: 0,
  status: WorkSessionStatus.RUNNING,
  createdAt: new Date("2026-11-03T10:00:00.000Z"),
  assignment: {
    id: "assignment-1",
    ticketId: "ticket-1",
    remainingHours: 10,
    allocatedHours: 10,
    ticket: {
      reference: "TKT-001",
      title: "Mise à jour SAP",
      remainingEstimatedHours: 10,
      estimatedHours: 10,
      client: { name: "Safir" },
    },
  },
  developer: {
    user: {
      firstName: "Awa",
      lastName: "Diallo",
      email: "awa@example.com",
    },
  },
  ...overrides,
});

afterEach(() => {
  vi.useRealTimers();
});

describe("suivi du temps et feuilles d'heures", () => {
  it("cumule une pause sur le serveur avant de reprendre le chronomètre", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-03T10:00:30.000Z"));
    const entry = makeEntry({
      status: WorkSessionStatus.PAUSED,
      pausedAt: new Date("2026-11-03T10:00:00.000Z"),
    });
    const prisma = {
      workSession: {
        findFirst: vi.fn().mockResolvedValue(entry),
        update: vi.fn().mockResolvedValue({
          ...entry,
          status: WorkSessionStatus.RUNNING,
          pausedAt: null,
          pausedDurationSeconds: 30,
        }),
      },
    };

    const service = new TimeEntriesService(prisma as never);
    const resumed = await service.resume("developer-1", "entry-1");

    expect(resumed).toMatchObject({
      status: WorkSessionStatus.RUNNING,
      pausedAt: undefined,
      pausedDurationSeconds: 30,
    });
    expect(prisma.workSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: WorkSessionStatus.RUNNING,
          pausedDurationSeconds: { increment: 30 },
        }),
      }),
    );
  });

  it("arrête le chronomètre en soustrayant les pauses et enregistre la durée", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-03T10:01:00.000Z"));
    const entry = makeEntry({
      startedAt: new Date("2026-11-03T10:00:01.000Z"),
      pausedDurationSeconds: 9,
    });
    const tx = {
      workSession: {
        findFirst: vi.fn().mockResolvedValue(entry),
        delete: vi.fn(),
      },
      timeEntry: {
        create: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ ...entry, ...data }),
        ),
      },
      assignment: { update: vi.fn() },
      ticket: { update: vi.fn() },
    };
    const prisma = {
      ...tx,
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    };

    const service = new TimeEntriesService(prisma as never);
    const result = await service.stop("developer-1", "entry-1");

    expect(result).toMatchObject({
      ignored: false,
      entry: {
        id: "entry-1",
        ticketReference: "TKT-001",
        developerName: "Awa Diallo",
        durationSeconds: 50,
        durationMinutes: 1,
        durationHours: 0.01,
      },
    });
    expect(prisma.timeEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          durationSeconds: 50,
          durationHours: 0.01,
        }),
      }),
    );
    expect(prisma.workSession.delete).toHaveBeenCalledWith({
      where: { id: "entry-1" },
    });
    expect(prisma.assignment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ remainingHours: 9.99 }),
      }),
    );
    expect(prisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket-1" },
        data: expect.objectContaining({
          spentHours: { increment: 0.01 },
          remainingEstimatedHours: 9.99,
        }),
      }),
    );
  });

  it("retourne les sessions de la période et le nom de l'administrateur validateur", async () => {
    const prisma = {
      timeEntry: {
        findMany: vi.fn().mockResolvedValue([makeEntry({
          durationSeconds: 1800,
          durationHours: 0.5,
          endedAt: new Date("2026-11-03T10:30:00.000Z"),
        })]),
      },
      timesheet: {
        findUnique: vi.fn().mockResolvedValue({
          status: TimesheetStatus.APPROVED,
          submittedAt: new Date("2026-11-03T11:00:00.000Z"),
          approvedAt: new Date("2026-11-03T12:00:00.000Z"),
          approvedBy: { firstName: "Moussa", lastName: "Traoré" },
        }),
      },
    };

    const service = new TimeEntriesService(prisma as never);
    const report = await service.getReport("developer-1", "2026-11-01", "2026-11-30");

    expect(report.entries).toHaveLength(1);
    expect(report.entries[0]).toMatchObject({
      durationHours: 0.5,
      date: "2026-11-03",
      developerEmail: "awa@example.com",
    });
    expect(report.timesheet).toMatchObject({
      status: TimesheetStatus.APPROVED,
      approvedByName: "Moussa Traoré",
    });
    expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          developerId: "developer-1",
          workDate: {
            gte: new Date("2026-11-01T00:00:00.000Z"),
            lte: new Date("2026-11-30T00:00:00.000Z"),
          },
        }),
      }),
    );
  });

  it("enregistre quel administrateur a approuvé la feuille", async () => {
    const prisma = {
      workSession: { findFirst: vi.fn().mockResolvedValue(null) },
      timeEntry: { count: vi.fn().mockResolvedValue(1) },
      timesheet: {
        upsert: vi.fn().mockResolvedValue({
          status: TimesheetStatus.APPROVED,
          submittedAt: new Date("2026-11-03T11:00:00.000Z"),
          approvedAt: new Date("2026-11-03T12:00:00.000Z"),
          approvedBy: { firstName: "Moussa", lastName: "Traoré" },
        }),
      },
    };

    const service = new TimeEntriesService(prisma as never);
    const result = await service.approveTimesheet(
      "admin-1",
      "developer-1",
      "2026-11-01",
      "2026-11-30",
    );

    expect(result.approvedByName).toBe("Moussa Traoré");
    expect(prisma.timesheet.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          developerId: "developer-1",
          approvedById: "admin-1",
          status: TimesheetStatus.APPROVED,
        }),
        update: expect.objectContaining({ approvedById: "admin-1" }),
      }),
    );
  });
});
