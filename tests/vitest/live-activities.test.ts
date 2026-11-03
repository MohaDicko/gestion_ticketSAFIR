import { describe, expect, it, vi } from "vitest";
import { WorkSessionStatus } from "@prisma/client";
import { TimeEntriesService } from "../../apps/api/src/time-entries/time-entries.service";

describe("supervision temps réel des développeurs (Live Activities)", () => {
  it("retourne l'état de supervision en direct pour les développeurs actifs et disponibles", async () => {
    const fakeDevs = [
      {
        id: "dev-uuid-1",
        user: { firstName: "Mohamed", lastName: "Dicko", email: "mohamed.dicko@safirconsulting.net" },
      },
      {
        id: "dev-uuid-2",
        user: { firstName: "Hassane", lastName: "Bocoum", email: "hassane.bocoum@safirconsulting.net" },
      },
    ];

    const fakeSession = {
      id: "session-1",
      developerId: "dev-uuid-1",
      status: WorkSessionStatus.RUNNING,
      startedAt: new Date(Date.now() - 125 * 1000), // 125s ago
      pausedAt: null,
      pausedDurationSeconds: 0,
      comment: "Développement spécifique B1",
      assignment: {
        ticket: {
          id: "ticket-uuid-1",
          reference: "ADD-2026-0001",
          title: "Connecteur SAP B1",
          client: { name: "Safir Consulting" },
          blockers: [],
        },
      },
    };

    const prisma = {
      developerProfile: {
        findMany: vi.fn().mockResolvedValue(fakeDevs),
      },
      workSession: {
        findMany: vi.fn().mockResolvedValue([fakeSession]),
      },
    };

    const service = new TimeEntriesService(prisma as never);
    const live = await service.getLiveActivities();

    expect(live["dev-uuid-1"]).toBeDefined();
    expect(live["dev-uuid-1"].status).toBe("WORKING");
    expect(live["dev-uuid-1"].activeTicketReference).toBe("ADD-2026-0001");
    expect(live["dev-uuid-1"].elapsedSeconds).toBeGreaterThanOrEqual(120);

    expect(live["dev-uuid-2"]).toBeDefined();
    expect(live["dev-uuid-2"].status).toBe("AVAILABLE");
    expect(live["dev-uuid-2"].elapsedSeconds).toBe(0);
  });
});
