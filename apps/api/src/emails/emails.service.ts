import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TicketsService } from "../tickets/tickets.service";
import { EmailProcessingStatus, EmailDirection, MailProviderKind, SenderKind } from "@prisma/client";

@Injectable()
export class EmailsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketsService: TicketsService,
  ) {}

  async getInbox() {
    return this.prisma.emailMessage.findMany({
      where: {
        direction: EmailDirection.INBOUND,
      },
      include: {
        ticket: {
          select: { id: true, reference: true, title: true, status: true },
        },
      },
      orderBy: { receivedAt: "desc" },
    });
  }

  async qualifyEmailToTicket(
    emailId: string,
    data: {
      typeCode: string;
      priorityCode: string;
      title?: string;
      description?: string;
      clientId?: string;
      projectId?: string;
      estimatedHours?: number;
      requestedDueDate?: string;
      actorId?: string;
    },
  ) {
    const email = await this.prisma.emailMessage.findUnique({ where: { id: emailId } });
    if (!email) {
      throw new NotFoundException("Message e-mail introuvable");
    }

    // Créer le ticket via TicketsService
    const ticket = await this.ticketsService.create({
      title: data.title || email.subject,
      description: data.description || email.bodyText || email.bodyPreview || "",
      typeCode: data.typeCode,
      priorityCode: data.priorityCode,
      clientId: data.clientId,
      projectId: data.projectId,
      estimatedHours: data.estimatedHours,
      requestedDueDate: data.requestedDueDate,
      actorId: data.actorId,
    });

    // Mettre à jour l'e-mail
    await this.prisma.emailMessage.update({
      where: { id: emailId },
      data: {
        processingStatus: EmailProcessingStatus.TICKET_CREATED,
        associatedTicketId: ticket.id,
        processedAt: new Date(),
        processedById: data.actorId,
      },
    });

    return { ticket, emailId };
  }

  async linkEmailToTicket(emailId: string, ticketId: string, actorId?: string) {
    const email = await this.prisma.emailMessage.findUnique({ where: { id: emailId } });
    if (!email) throw new NotFoundException("Message introuvable");

    await this.prisma.emailMessage.update({
      where: { id: emailId },
      data: {
        processingStatus: EmailProcessingStatus.LINKED,
        associatedTicketId: ticketId,
        processedAt: new Date(),
        processedById: actorId,
      },
    });

    // Ajouter un commentaire automatique sur le ticket
    await this.prisma.comment.create({
      data: {
        ticketId,
        content: `E-mail rattaché de ${email.senderEmail} : « ${email.subject} »\n\n${email.bodyPreview || ""}`,
        source: "EMAIL",
        emailMessageId: email.id,
      },
    });

    return { success: true };
  }

  /**
   * Résolution intelligente du type d'expéditeur :
   * 1. Consultants & Collaborateurs Safir (@safirconsulting.net)
   * 2. Contacts clients officiels (domaine entreprise ou fiche client)
   * 3. Personnes extérieures / Nouveaux contacts inconnus (UNKNOWN)
   * 4. Adresses personnelles (détection de vigilance)
   */
  async resolveSender(senderEmail: string): Promise<{ senderKind: SenderKind; isPersonalDomain: boolean; suggestedClientId?: string }> {
    const emailLower = senderEmail.toLowerCase().trim();
    const domain = emailLower.split("@")[1] || "";

    const personalDomains = [
      "gmail.com",
      "yahoo.com",
      "yahoo.fr",
      "hotmail.com",
      "hotmail.fr",
      "outlook.com",
      "live.com",
      "icloud.com",
      "orange.fr",
      "sfr.fr",
      "free.fr",
    ];
    const isPersonalDomain = personalDomains.includes(domain);

    // 1. Domaine Safir Consulting -> Consultant(e) ou Équipe interne
    if (domain === "safirconsulting.net" || domain === "safir.test") {
      const consultant = await this.prisma.consultant.findUnique({ where: { email: emailLower } });
      return {
        senderKind: consultant ? SenderKind.CONSULTANT : SenderKind.INTERNAL_TEAM,
        isPersonalDomain: false,
      };
    }

    // 2. Contact client enregistré
    const contact = await this.prisma.clientContact.findUnique({
      where: { email: emailLower },
      include: { client: true },
    });
    if (contact) {
      return {
        senderKind: SenderKind.CLIENT_CONTACT,
        isPersonalDomain: contact.isPersonalEmail,
        suggestedClientId: contact.clientId,
      };
    }

    // 3. Domaine correspondant à un client existant
    if (!isPersonalDomain && domain) {
      const client = await this.prisma.client.findFirst({
        where: {
          emailDomains: { has: domain },
        },
      });
      if (client) {
        return {
          senderKind: SenderKind.CLIENT_CONTACT,
          isPersonalDomain: false,
          suggestedClientId: client.id,
        };
      }
    }

    // 4. Personne extérieure inconnue / Nouveau prospect / Tiers externe
    return {
      senderKind: SenderKind.UNKNOWN,
      isPersonalDomain,
    };
  }

  async simulateInboundEmail(data: {
    senderEmail: string;
    senderName: string;
    subject: string;
    bodyText: string;
    isPersonalDomain?: boolean;
  }) {
    const mailbox = await this.prisma.mailboxConnection.findFirst();
    if (!mailbox) throw new NotFoundException("Boîte e-mail non configurée");

    const messageId = `SIM-${Date.now()}`;
    const resolved = await this.resolveSender(data.senderEmail);

    return this.prisma.emailMessage.create({
      data: {
        mailboxId: mailbox.id,
        provider: MailProviderKind.MICROSOFT_GRAPH,
        direction: EmailDirection.INBOUND,
        providerMessageId: messageId,
        internetMessageId: `<${messageId}@safir.test>`,
        senderEmail: data.senderEmail,
        senderName: data.senderName,
        senderKind: resolved.senderKind,
        isPersonalDomain: data.isPersonalDomain !== undefined ? data.isPersonalDomain : resolved.isPersonalDomain,
        toRecipients: [mailbox.mailboxAddress],
        subject: data.subject,
        bodyPreview: data.bodyText.substring(0, 160),
        bodyText: data.bodyText,
        receivedAt: new Date(),
        processingStatus: EmailProcessingStatus.PENDING_QUALIFICATION,
      },
    });
  }
}
