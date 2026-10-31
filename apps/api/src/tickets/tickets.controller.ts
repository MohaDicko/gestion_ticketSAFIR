import { Controller, Get, Post, Patch, Param, Body, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { TicketsService } from "./tickets.service";
import { TicketStatus } from "@prisma/client";
import { sendTicketCreatedNotification } from "../services/emailService";

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
  @HttpCode(HttpStatus.CREATED)
  async createTicket(@Body() body: any) {
    // 1. Enregistrement réussi du ticket en base de données
    const ticket = await this.ticketsService.create(body);

    // 2. Déclenchement de la notification par e-mail en tâche de fond (non bloquante)
    const creatorName = body.creatorName || body.applicantName || "Collaborateur Safir";
    const creatorEmail = body.creatorEmail || body.applicantEmail || process.env.ALIKO_EMAIL || "aliko@safirconsulting.net";
    const recipientEmails = Array.isArray(body.recipientEmails) && body.recipientEmails.length > 0
      ? body.recipientEmails
      : (body.assignedDeveloperEmail ? [body.assignedDeveloperEmail] : [process.env.ALIKO_EMAIL || "aliko@safirconsulting.net"]);

    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    const ticketUrl = body.ticketUrl || `${baseUrl}/tickets/${ticket.id || ticket.reference}`;

    sendTicketCreatedNotification({
      creatorName,
      creatorEmail,
      recipientEmails,
      ticketId: ticket.reference || ticket.id,
      ticketTitle: ticket.title,
      ticketDescription: ticket.description,
      ticketUrl,
    }).catch((err) => {
      // Gestion d'erreur sans faire planter la création du ticket (log console propre)
      console.error(`[TicketsController] Échec de l'envoi de la notification e-mail pour le ticket ${ticket.id}:`, err?.message || err);
    });

    // 3. Retour HTTP 201 immédiat au client sans subir la latence réseau SMTP
    return ticket;
  }

  @Patch(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status: TicketStatus; reason?: string; actorId?: string },
  ) {
    return this.ticketsService.updateStatus(id, body.status, body.actorId, body.reason);
  }

  @Post(":id/blockers")
  async declareBlocker(
    @Param("id") id: string,
    @Body() body: { reason: string; actorId: string },
  ) {
    return this.ticketsService.declareBlocker(id, body.reason, body.actorId);
  }

  @Patch(":id/blockers/:blockerId/resolve")
  async resolveBlocker(
    @Param("id") id: string,
    @Param("blockerId") blockerId: string,
    @Body() body: { resolution: string; actorId: string },
  ) {
    return this.ticketsService.resolveBlocker(id, blockerId, body.resolution, body.actorId);
  }
}
