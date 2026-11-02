import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../apps/api/src/services/emailService", () => ({
  sendTicketCreatedNotification: vi.fn(),
}));

import { sendTicketCreatedNotification } from "../../apps/api/src/services/emailService";
import { TicketsController } from "../../apps/api/src/tickets/tickets.controller";

describe("Création de ticket avec notification e-mail en échec", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne le ticket créé au lieu de répondre 500", async () => {
    vi.mocked(sendTicketCreatedNotification).mockRejectedValueOnce(
      new Error("Brevo a refusé l'envoi (401)"),
    );

    const ticket = {
      id: "ticket-id",
      reference: "ADD-2026-0001",
      title: "Test notification",
      description: "Description",
    };
    const ticketsService = {
      create: vi.fn().mockResolvedValue(ticket),
    };
    const controller = new TicketsController(ticketsService as never);

    const response = await controller.createTicket({
      title: ticket.title,
      description: ticket.description,
      typeCode: "ADDON",
      priorityCode: "HIGH",
      creatorName: "Aliko Getheme",
      creatorEmail: "aliko.getheme@safirconsulting.net",
      recipientEmails: ["developer@safirconsulting.net"],
    });

    expect(response).toMatchObject({
      ...ticket,
      emailNotification: {
        sent: false,
        recipients: ["developer@safirconsulting.net"],
        error: "Brevo a refusé l'envoi (401)",
      },
    });
    expect(response).toBeDefined();

    expect(ticketsService.create).toHaveBeenCalledOnce();
    expect(sendTicketCreatedNotification).toHaveBeenCalledOnce();
  });
});
