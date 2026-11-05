import { describe, expect, it, vi } from "vitest";
import { TicketsService } from "../../apps/api/src/tickets/tickets.service";
import { TimeEntriesService } from "../../apps/api/src/time-entries/time-entries.service";

describe("Workflow Blocage & Reprise avec Cumul du Temps de Travail", () => {
  it("arrête la session et enregistre le temps travaillé lors d'un signalement de blocage", async () => {
    const sessionStartedAt = new Date(Date.now() - 30 * 60 * 1000); // il y a 30 minutes
    const tx = {
      workSession: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "session-active-1",
            assignmentId: "assign-1",
            developerId: "dev-uuid-1",
            startedAt: sessionStartedAt,
            pausedDurationSeconds: 0,
            assignment: { ticketId: "ticket-1" },
          },
        ]),
        delete: vi.fn().mockResolvedValue({ id: "session-active-1" }),
      },
      timeEntry: {
        create: vi.fn().mockResolvedValue({ id: "entry-saved-1" }),
      },
      ticketBlocker: { create: vi.fn().mockResolvedValue({ id: "blocker-1" }) },
      ticket: { update: vi.fn().mockResolvedValue({ id: "ticket-1", status: "BLOCKED" }) },
      ticketStatusHistory: { create: vi.fn().mockResolvedValue(undefined) },
    };

    const prisma = {
      ticket: {
        findFirst: vi.fn().mockResolvedValue({
          id: "ticket-1",
          status: "IN_PROGRESS",
          statusBeforeBlock: null,
          assignments: [{ developer: { userId: "user-dev-1" } }],
        }),
      },
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx as never)),
    };

    const ticketsService = new TicketsService(prisma as never);
    const result = await ticketsService.declareBlocker(
      "ticket-1",
      "Attente validation schéma B1 Service Layer",
      "user-dev-1",
    );

    // 1. La session a été clôturée
    expect(tx.workSession.delete).toHaveBeenCalledWith({ where: { id: "session-active-1" } });

    // 2. Le temps travaillé a été consigné dans TimeEntry (~30 min = 0.5h)
    expect(tx.timeEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          developerId: "dev-uuid-1",
          durationHours: 0.5,
          comment: expect.stringContaining("Arrêt sur blocage"),
        }),
      }),
    );

    // 3. Le ticket est marqué BLOCKED
    expect(result.status).toBe("BLOCKED");
  });

  it("lève le blocage et réactive le ticket en IN_PROGRESS pour redémarrage du compteur", async () => {
    const tx = {
      ticketBlocker: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      ticket: { update: vi.fn().mockResolvedValue({ id: "ticket-1", status: "IN_PROGRESS" }) },
      ticketStatusHistory: { create: vi.fn().mockResolvedValue(undefined) },
    };

    const prisma = {
      ticket: {
        findFirst: vi.fn().mockResolvedValue({
          id: "ticket-1",
          status: "BLOCKED",
          statusBeforeBlock: "IN_PROGRESS",
        }),
      },
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx as never)),
    };

    const ticketsService = new TicketsService(prisma as never);
    const result = await ticketsService.resolveBlockersForTicket(
      "ticket-1",
      "Schéma validé par le client — reprise immédiate",
      "user-dev-1",
    );

    expect(tx.ticketBlocker.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ticketId: "ticket-1", resolvedAt: null },
      }),
    );
    expect(result.status).toBe("IN_PROGRESS");
  });

  it("additionne cumulativement les temps des sessions successives (ancien + nouveau)", async () => {
    // Session 1 (avant blocage) : 45 min = 0.75h
    // Session 2 (après levée de blocage) : 30 min = 0.50h
    // Cumul attendu : 1.25h
    const mockEntries = [
      {
        id: "entry-session-1",
        developerId: "dev-uuid-1",
        workDate: new Date("2026-11-03T00:00:00.000Z"),
        startedAt: new Date("2026-11-03T09:00:00.000Z"),
        endedAt: new Date("2026-11-03T09:45:00.000Z"),
        durationHours: 0.75,
        durationSeconds: 2700,
        comment: "Arrêt sur blocage technique SAP",
        developer: {
          user: { firstName: "Mohamed", lastName: "Dicko", email: "mohamed.dicko@safirconsulting.net" },
        },
        assignment: {
          ticketId: "ticket-1",
          ticket: {
            id: "ticket-1",
            reference: "ADD-2026-0001",
            title: "Addon Validation SAP B1",
            status: "IN_PROGRESS",
            client: { name: "Safir Consulting" },
          },
        },
      },
      {
        id: "entry-session-2",
        developerId: "dev-uuid-1",
        workDate: new Date("2026-11-03T00:00:00.000Z"),
        startedAt: new Date("2026-11-03T11:00:00.000Z"),
        endedAt: new Date("2026-11-03T11:30:00.000Z"),
        durationHours: 0.5,
        durationSeconds: 1800,
        comment: "Reprise après déblocage",
        developer: {
          user: { firstName: "Mohamed", lastName: "Dicko", email: "mohamed.dicko@safirconsulting.net" },
        },
        assignment: {
          ticketId: "ticket-1",
          ticket: {
            id: "ticket-1",
            reference: "ADD-2026-0001",
            title: "Addon Validation SAP B1",
            status: "IN_PROGRESS",
            client: { name: "Safir Consulting" },
          },
        },
      },
    ];

    const prisma = {
      developerProfile: { findFirst: vi.fn().mockResolvedValue(null) },
      timeEntry: { findMany: vi.fn().mockResolvedValue(mockEntries) },
      timesheet: { findUnique: vi.fn().mockResolvedValue(null) },
    };

    const service = new TimeEntriesService(prisma as never);
    const report = await service.getReport("dev-uuid-1", "2026-11-03", "2026-11-03");

    expect(report.entries).toHaveLength(2);
    expect(report.totalHours).toBe(1.25); // 0.75 + 0.50

    const ticketSummary = report.ticketBreakdown?.find((t) => t.ticketReference === "ADD-2026-0001");
    expect(ticketSummary).toBeDefined();
    expect(ticketSummary?.totalHours).toBe(1.25);
    expect(ticketSummary?.sessionsCount).toBe(2);
  });
});

