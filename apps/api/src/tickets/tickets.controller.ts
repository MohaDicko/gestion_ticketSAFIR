import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus, Req, ForbiddenException } from "@nestjs/common";
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

    // 2. Détermination exhaustive de TOUS les acteurs concernés :
    // - L'Administrateur (Direction CoE DEV)
    // - Le Demandeur / Consultant
    // - Le ou les Développeurs assignés ou ciblés
    const adminEmail = process.env.ALIKO_EMAIL || "aliko.getheme@safirconsulting.net";
    const superAdminEmail = "superadmin@safirconsulting.net";
    const creatorName = body.creatorName || body.applicantName || "Collaborateur Safir";
    const creatorEmail = body.creatorEmail || body.applicantEmail || adminEmail;

    const allRecipients = new Set<string>();
    // Si des destinataires explicites sont fournis (ex: liste complète construite par le frontend ou tests)
    if (Array.isArray(body.recipientEmails) && body.recipientEmails.length > 0) {
      body.recipientEmails.forEach((email: string) => {
        if (email && typeof email === "string" && email.trim()) allRecipients.add(email.trim());
      });
    } else {
      // Sinon diffusion automatique exhaustive à tous les acteurs :
      // 1. Administrateurs (Direction CoE DEV & Admin opérationnel)
      allRecipients.add(adminEmail);
      allRecipients.add(superAdminEmail);

      // 2. Demandeur / Consultant
      if (creatorEmail) allRecipients.add(creatorEmail);

      // 3. Développeur(s) assigné(s) ou concerné(s)
      if (body.assignedDeveloperEmail) {
        allRecipients.add(body.assignedDeveloperEmail);
      } else if (body.assignedDeveloperId) {
        const devIdLower = String(body.assignedDeveloperId).toLowerCase();
        if (devIdLower.includes("dicko") || devIdLower.includes("moha") || devIdLower === "012337d8-fe1a-4c5b-9b01-78b9c9f29529") {
          allRecipients.add("mohamed.dicko@safirconsulting.com");
        } else if (devIdLower.includes("anoop")) {
          allRecipients.add("anoop.pandimukkula@safirconsulting.net");
        } else if (devIdLower.includes("hassane")) {
          allRecipients.add("hassane.bocoum@safirconsulting.net");
        }
      }
    }

    const recipientEmails = Array.from(allRecipients);

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
  @Roles(Role.HEAD, Role.ADMIN, Role.DEVELOPER, Role.CONSULTANT)
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status: TicketStatus; reason?: string; actorId?: string },
    @Req() req?: { user?: { roles?: string[] } },
  ) {
    const roles = req?.user?.roles || [];
    const isConsultantOnly =
      roles.includes(Role.CONSULTANT) &&
      !roles.some((r) => r === Role.HEAD || r === Role.ADMIN || r === Role.DEVELOPER);
    if (isConsultantOnly) {
      // Le demandeur ne peut que valider (CLOSED) ou rejeter (IN_PROGRESS) une livraison en recette.
      const ticket = await this.ticketsService.findOne(id);
      const allowedTarget = body.status === TicketStatus.CLOSED || body.status === TicketStatus.IN_PROGRESS;
      if (ticket.status !== TicketStatus.DELIVERED || !allowedTarget) {
        throw new ForbiddenException("Le demandeur ne peut que valider ou rejeter un ticket livré en recette");
      }
    }
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
