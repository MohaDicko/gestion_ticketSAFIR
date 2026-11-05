import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendTicketCreatedNotification, emailTransporter } from "../../apps/api/src/services/emailService";

describe("Module d'envoi d'e-mails réels lors de la création d'un ticket", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("doit envoyer une notification avec les champs from, replyTo, to, subject et le template HTML requis", async () => {
    const sendMailSpy = vi.spyOn(emailTransporter, "sendMail").mockResolvedValue({
      messageId: "<test-msg-123@safirconsulting.net>",
    } as any);

    const ticketData = {
      creatorName: "Mélissa Diakité",
      creatorEmail: "melissa.diakite@safirconsulting.net",
      recipientEmails: ["anoop.pandimukkula@safirconsulting.net", "aliko@safirconsulting.net"],
      ticketId: "ADD-2026-0042",
      ticketTitle: "Interface Flux EDI SAP B1 - Connecteur Douanes",
      ticketDescription: "Développement d'un connecteur XML/EDI pour la déclaration en douane automatisée.",
      ticketUrl: "http://localhost:3000/tickets/ADD-2026-0042",
    };

    const result = await sendTicketCreatedNotification(ticketData);

    expect(sendMailSpy).toHaveBeenCalledTimes(1);
    const callArgs = sendMailSpy.mock.calls[0][0];

    // 1. Champ from : Nom du créateur avec le compte SMTP authentifié
    expect(callArgs.from).toContain("Mélissa Diakité");

    // 2. Champ replyTo : Email direct du créateur (anti-SPF/DKIM break)
    expect(callArgs.replyTo).toBe("melissa.diakite@safirconsulting.net");

    // 3. Champ to : Concaténation des destinataires
    expect(callArgs.to).toBe("anoop.pandimukkula@safirconsulting.net, aliko@safirconsulting.net");

    // 4. Objet du mail
    expect(callArgs.subject).toContain("ADD-2026-0042");
    expect(callArgs.subject).toContain("Interface Flux EDI SAP B1 - Connecteur Douanes");

    // 5. Template HTML
    expect(callArgs.html).toContain("Safir Consulting — Plateforme SAP Tandem");
    expect(callArgs.html).toContain("ADD-2026-0042");
    expect(callArgs.html).toContain("href=\"http://localhost:3000/tickets/ADD-2026-0042\"");
    expect(callArgs.html).toContain("Mélissa Diakité");

    expect(result.messageId).toBe("<test-msg-123@safirconsulting.net>");
  });

  it("doit ignorer l'envoi si aucun destinataire n'est fourni", async () => {
    const sendMailSpy = vi.spyOn(emailTransporter, "sendMail");

    const result = await sendTicketCreatedNotification({
      creatorName: "Anoop",
      creatorEmail: "anoop@safir.net",
      recipientEmails: [],
      ticketId: "TIX-001",
      ticketTitle: "Test sans destinataire",
      ticketDescription: "Description",
      ticketUrl: "http://localhost:3000/tickets/TIX-001",
    });

    expect(sendMailSpy).not.toHaveBeenCalled();
    expect(result.skipped).toBe(true);
  });

  it("doit lever une exception proprement sans masquer l'erreur si sendMail échoue", async () => {
    vi.spyOn(emailTransporter, "sendMail").mockRejectedValue(new Error("SMTP Connection refused"));

    await expect(
      sendTicketCreatedNotification({
        creatorName: "Getheme Aliko",
        creatorEmail: "aliko@safirconsulting.net",
        recipientEmails: ["dest@safirconsulting.net"],
        ticketId: "TIX-ERR",
        ticketTitle: "Erreur réseau",
        ticketDescription: "Description",
        ticketUrl: "http://localhost:3000/tickets/TIX-ERR",
      })
    ).rejects.toThrow("SMTP Connection refused");
  });

  it("doit refuser explicitement une clé SMTP utilisée comme clé API Brevo", async () => {
    vi.stubEnv("BREVO_API_KEY", "xsmtpsib-invalid-for-rest-api");

    await expect(
      sendTicketCreatedNotification({
        creatorName: "Getheme Aliko",
        creatorEmail: "aliko@safirconsulting.net",
        recipientEmails: ["dest@safirconsulting.net"],
        ticketId: "TIX-KEY",
        ticketTitle: "Clé Brevo invalide",
        ticketDescription: "Description",
        ticketUrl: "http://localhost:3000/tickets/TIX-KEY",
      }),
    ).rejects.toThrow("clé SMTP Brevo");
  });
});
