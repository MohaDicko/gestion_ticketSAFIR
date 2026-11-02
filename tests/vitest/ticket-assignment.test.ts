import { describe, expect, it, vi } from "vitest";
import { TicketsService } from "../../apps/api/src/tickets/tickets.service";

describe("Affectation lors de la création d'un ticket", () => {
  it("persiste l'affectation et crée le job de notification du développeur", async () => {
    const tx = {
      ticket: {
        create: vi.fn().mockResolvedValue({
          id: "ticket-1",
          reference: "BUG-2026-0001",
          title: "Incident SAP",
        }),
      },
      developerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: "developer-1",
          user: {
            firstName: "Anoop",
            lastName: "Pandimukkula",
            email: "anoop@safirconsulting.net",
            isActive: true,
          },
        }),
      },
      assignment: {
        create: vi.fn().mockResolvedValue({ id: "assignment-1" }),
      },
      ticketStatusHistory: {
        create: vi.fn(),
      },
      outboxJob: {
        create: vi.fn(),
      },
    };
    const prisma = {
      ticketType: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "type-1", referencePrefix: "BUG" }) },
      priority: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "priority-1" }) },
      ticketSequence: { upsert: vi.fn().mockResolvedValue({ lastValue: 1 }) },
      ticket: { findUnique: vi.fn().mockResolvedValue(null) },
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    };

    const service = new TicketsService(prisma as never);
    await service.create({
      title: "Incident SAP",
      description: "Erreur de traitement",
      typeCode: "BUG",
      priorityCode: "HIGH",
      estimatedHours: 16,
      actorId: "admin-1",
      assignedDeveloperId: "developer-1",
    });

    expect(tx.assignment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ticketId: "ticket-1",
          developerId: "developer-1",
          assignedById: "admin-1",
          remainingHours: 16,
        }),
      })
    );
    expect(tx.outboxJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "mail.send.assignment",
          payload: expect.objectContaining({
            recipientEmail: "anoop@safirconsulting.net",
          }),
        }),
      })
    );
  });
});
