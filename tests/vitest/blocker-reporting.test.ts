import { describe, expect, it, vi } from "vitest";
import { TicketsService } from "../../apps/api/src/tickets/tickets.service";

describe("Signalement de blocage développeur", () => {
  it("persiste le blocage et le statut BLOCKED pour visibilité administrateur", async () => {
    const tx = {
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
        }),
      },
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    };
    const service = new TicketsService(prisma as never);

    const result = await service.declareBlocker("ticket-1", "Accès SAP indisponible", "developer-1");

    expect(tx.ticketBlocker.create).toHaveBeenCalledWith({
      data: {
        ticketId: "ticket-1",
        reason: "Accès SAP indisponible",
        declaredById: "developer-1",
      },
    });
    expect(tx.ticket.update).toHaveBeenCalledWith({
      where: { id: "ticket-1" },
      data: { status: "BLOCKED", statusBeforeBlock: "IN_PROGRESS" },
    });
    expect(tx.ticketStatusHistory.create).toHaveBeenCalled();
    expect(result.status).toBe("BLOCKED");
  });
});
