import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { TicketsService } from "./tickets.service";
import { TicketStatus } from "@prisma/client";
import { Role } from "@prisma/client";
import { sendTicketCreatedNotification } from "../services/emailService";
import { Roles } from "../auth/roles.decorator";

@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  async getTickets(
    @Query("status") status?: TicketStatus,
    @Query("typeId") typeId?: string,
    @Query("clientId") clientId?: string,
    @Query("search") search?: string,
  ) {
    return this.ticketsService.findAll({ status, typeId, clientId, search });
  }

  @Get(":id")
  async getTicket(@Param("id") id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post()
  @Roles(Role.HEAD, Role.ADMIN, Role.DEVELOPER, Role.CONSULTANT)
  @HttpCode(HttpStatus.CREATED)
  async createTicket(@Body() body: any) {
    // 1. Enregistrement réussi du ticket en base de données
    const ticket = await this.ticketsService.create(body);

    // 2. La notification ne doit pas rendre la création du ticket échouée.
    const creatorName = body.creatorName || body.applicantName || "Collaborateur Safir";
    const creatorEmail = body.creatorEmail || body.applicantEmail || process.env.ALIKO_EMAIL || "aliko@safirconsulting.net";
    const recipientEmails = Array.isArray(body.recipientEmails) && body.recipientEmails.length > 0
      ? body.recipientEmails
      : (body.assignedDeveloperEmail ? [body.assignedDeveloperEmail] : [process.env.ALIKO_EMAIL || "aliko@safirconsulting.net"]);

    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    const ticketUrl = body.ticketUrl || `${baseUrl}/tickets/${ticket.id || ticket.reference}`;

    // 3. Envoi de la notification e-mail (sans bloquer en cas de dépassement)
    let emailNotification: { sent: boolean; messageId?: string; recipients: string[]; error?: string } = {
      sent: false,
      recipients: recipientEmails,
    };

    try {
      const emailPromise = sendTicketCreatedNotification({
        creatorName,
        creatorEmail,
        recipientEmails,
        ticketId: ticket.reference || ticket.id,
        ticketTitle: ticket.title,
        ticketDescription: ticket.description,
        ticketUrl,
      });
      const timeoutPromise = new Promise<{ sent: boolean; timeout: true }>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout d'envoi e-mail (2s)")), 2000),
      );
      const result = (await Promise.race([emailPromise, timeoutPromise])) as any;
      emailNotification = {
        sent: true,
        messageId: result?.messageId,
        recipients: recipientEmails,
      };
    } catch (error) {
      emailNotification.error = error instanceof Error ? error.message : "Erreur d'envoi e-mail";
      console.warn(
        `[tickets] Le ticket ${ticket.reference || ticket.id} a été créé, notification e-mail différée :`,
        emailNotification.error,
      );
    }

    // 4. Retour HTTP 201 immédiat
    return { ...ticket, emailNotification };
  }

  @Patch(":id/status")
  @Roles(Role.HEAD, Role.ADMIN, Role.DEVELOPER)
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status: TicketStatus; reason?: string; actorId?: string },
  ) {
    return this.ticketsService.updateStatus(id, body.status, body.actorId, body.reason);
  }

  @Post(":id/blockers")
  @Roles(Role.HEAD, Role.ADMIN, Role.DEVELOPER, Role.CONSULTANT)
  async declareBlocker(
    @Param("id") id: string,
    @Body() body: { reason: string; actorId: string },
  ) {
    return this.ticketsService.declareBlocker(id, body.reason, body.actorId);
  }

  @Patch(":id/blockers/:blockerId/resolve")
  @Roles(Role.HEAD, Role.ADMIN, Role.DEVELOPER, Role.CONSULTANT)
  async resolveBlocker(
    @Param("id") id: string,
    @Param("blockerId") blockerId: string,
    @Body() body: { resolution: string; actorId?: string },
  ) {
    return this.ticketsService.resolveBlocker(id, blockerId, body.resolution, body.actorId || "user-dev");
  }

  @Post(":id/unblock")
  @Roles(Role.HEAD, Role.ADMIN, Role.DEVELOPER, Role.CONSULTANT)
  async unblockTicket(
    @Param("id") id: string,
    @Body() body: { resolution?: string; actorId?: string },
  ) {
    return this.ticketsService.resolveBlockersForTicket(
      id,
      body.resolution || "Blocage levé par le collaborateur",
      body.actorId,
    );
  }

  @Post(":id/assign")
  @Roles(Role.HEAD, Role.ADMIN)
  async assignTicket(
    @Param("id") id: string,
    @Body() body: { developerId: string; allocatedHours?: number; actorId?: string },
  ) {
    return this.ticketsService.assign(id, body.developerId, body.allocatedHours, body.actorId);
  }

  @Post(":id/comments")
  @Roles(Role.HEAD, Role.ADMIN, Role.DEVELOPER, Role.CONSULTANT)
  async addComment(
    @Param("id") id: string,
    @Body()
    body: {
      content: string;
      authorId?: string;
      authorEmail?: string;
      authorRole?: string;
      authorName?: string;
      isBlockerQuestion?: boolean;
      attachment?: any;
    },
  ) {
    return this.ticketsService.addComment(id, body);
  }

  @Delete(":id")
  @Roles(Role.HEAD, Role.ADMIN)
  async removeTicket(@Param("id") id: string) {
    return this.ticketsService.remove(id);
  }
}
