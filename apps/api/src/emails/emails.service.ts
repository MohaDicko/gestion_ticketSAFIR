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

    return this.prisma.emailMessage.create({
      data: {
        mailboxId: mailbox.id,
        provider: MailProviderKind.MICROSOFT_GRAPH,
        direction: EmailDirection.INBOUND,
        providerMessageId: messageId,
        internetMessageId: `<${messageId}@safir.test>`,
        senderEmail: data.senderEmail,
        senderName: data.senderName,
        senderKind: data.isPersonalDomain ? SenderKind.CLIENT_CONTACT : SenderKind.INTERNAL_TEAM,
        isPersonalDomain: !!data.isPersonalDomain,
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
