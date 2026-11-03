import { describe, expect, it, vi } from "vitest";
import { TimeEntriesService } from "../../apps/api/src/time-entries/time-entries.service";
import { getReportDateRange } from "../../apps/web/src/lib/report-period";

describe("Rapports d'Activité Développeur & Détails par Ticket", () => {
  const referenceDate = new Date(2026, 10, 3, 14, 0, 0); // 3 Nov 2026

  it("génère fidèlement toutes les plages de dates demandées par le développeur", () => {
    // Journalier
    const daily = getReportDateRange("DAILY", "", "", referenceDate);
    expect(daily.from).toBe("2026-11-03");
    expect(daily.to).toBe("2026-11-03");

    // Hebdomadaire
    const weekly = getReportDateRange("WEEKLY", "", "", referenceDate);
    expect(weekly.from).toBe("2026-11-02");
    expect(weekly.to).toBe("2026-11-08");

    // Mensuel
    const monthly = getReportDateRange("MONTHLY", "", "", referenceDate);
    expect(monthly.from).toBe("2026-11-01");
    expect(monthly.to).toBe("2026-11-30");

    // Trimestriel
    const quarterly = getReportDateRange("QUARTERLY", "", "", referenceDate);
    expect(quarterly.from).toBe("2026-10-01");
    expect(quarterly.to).toBe("2026-12-31");

    // Semestriel
    const semester = getReportDateRange("SEMESTER", "", "", referenceDate);
    expect(semester.from).toBe("2026-07-01");
    expect(semester.to).toBe("2026-12-31");

    // Annuel
    const yearly = getReportDateRange("YEARLY", "", "", referenceDate);
    expect(yearly.from).toBe("2026-01-01");
    expect(yearly.to).toBe("2026-12-31");

    // Personnalisé
    const custom = getReportDateRange("CUSTOM", "2026-10-14", "2026-11-14", referenceDate);
    expect(custom.from).toBe("2026-10-14");
    expect(custom.to).toBe("2026-11-14");
  });

  it("agrège et calcule la synthèse détaillée par ticket avec heures et sessions", async () => {
    const mockEntries = [
      {
        id: "entry-1",
        developerId: "dev-uuid-1",
        workDate: new Date("2026-11-03T00:00:00.000Z"),
        startedAt: new Date("2026-11-03T09:00:00.000Z"),
        endedAt: new Date("2026-11-03T11:00:00.000Z"),
        durationHours: 2,
        durationSeconds: 7200,
        comment: "Développement Addon Validation Achats",
        developer: {
          user: { firstName: "Mohamed", lastName: "Dicko", email: "mohamed.dicko@safirconsulting.net" },
        },
        assignment: {
          ticketId: "ticket-1",
          ticket: {
            id: "ticket-1",
            reference: "ADD-2026-0001",
            title: "Addon Validation Commandes Fournisseurs SAP B1",
            status: "IN_PROGRESS",
            client: { name: "Safir Consulting" },
          },
        },
      },
      {
        id: "entry-2",
        developerId: "dev-uuid-1",
        workDate: new Date("2026-11-03T00:00:00.000Z"),
        startedAt: new Date("2026-11-03T14:00:00.000Z"),
        endedAt: new Date("2026-11-03T15:30:00.000Z"),
        durationHours: 1.5,
        durationSeconds: 5400,
        comment: "Tests unitaires et recette Service Layer",
        developer: {
          user: { firstName: "Mohamed", lastName: "Dicko", email: "mohamed.dicko@safirconsulting.net" },
        },
        assignment: {
          ticketId: "ticket-1",
          ticket: {
            id: "ticket-1",
            reference: "ADD-2026-0001",
            title: "Addon Validation Commandes Fournisseurs SAP B1",
            status: "IN_PROGRESS",
            client: { name: "Safir Consulting" },
          },
        },
      },
      {
        id: "entry-3",
        developerId: "dev-uuid-1",
        workDate: new Date("2026-11-03T00:00:00.000Z"),
        startedAt: new Date("2026-11-03T16:00:00.000Z"),
        endedAt: new Date("2026-11-03T17:00:00.000Z"),
        durationHours: 1,
        durationSeconds: 3600,
        comment: "Correction anomalie CDS Views",
        developer: {
          user: { firstName: "Mohamed", lastName: "Dicko", email: "mohamed.dicko@safirconsulting.net" },
        },
        assignment: {
          ticketId: "ticket-2",
          ticket: {
            id: "ticket-2",
            reference: "BUG-2026-0004",
            title: "Correction anomalie lettrage comptable",
            status: "BLOCKED",
            client: { name: "Client Alpha" },
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

    expect(report.entries).toHaveLength(3);
    expect(report.totalHours).toBe(4.5);
    expect(report.totalDurationSeconds).toBe(16200);

    // Vérification de la synthèse par ticket
    expect(report.ticketBreakdown).toHaveLength(2);

    const ticket1 = report.ticketBreakdown?.find((t) => t.ticketReference === "ADD-2026-0001");
    expect(ticket1).toBeDefined();
    expect(ticket1?.totalHours).toBe(3.5);
    expect(ticket1?.sessionsCount).toBe(2);
    expect(ticket1?.clientCompany).toBe("Safir Consulting");

    const ticket2 = report.ticketBreakdown?.find((t) => t.ticketReference === "BUG-2026-0004");
    expect(ticket2).toBeDefined();
    expect(ticket2?.totalHours).toBe(1);
    expect(ticket2?.sessionsCount).toBe(1);
    expect(ticket2?.clientCompany).toBe("Client Alpha");
  });
});

