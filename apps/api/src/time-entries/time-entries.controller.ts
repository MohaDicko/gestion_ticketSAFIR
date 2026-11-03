import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Param,
} from "@nestjs/common";
import { Request } from "express";
import { Role } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { TimeEntriesService } from "./time-entries.service";

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    roles: Role[];
    developerProfile?: { id: string } | null;
  };
};

@Controller("time-entries")
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Get("active")
  @Roles(Role.DEVELOPER)
  async getActive(@Req() req: AuthenticatedRequest) {
    return this.timeEntriesService.getActive(this.getDeveloperId(req));
  }

  @Get("report")
  @Roles(Role.HEAD, Role.ADMIN, Role.DEVELOPER)
  async getReport(
    @Req() req: AuthenticatedRequest,
    @Query("developerId") requestedDeveloperId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    if (!from || !to) {
      throw new BadRequestException("Les dates de début et de fin sont requises");
    }

    const user = this.getUser(req);
    const isAdmin = user.roles.some((role) => role === Role.HEAD || role === Role.ADMIN);
    if (isAdmin && requestedDeveloperId) {
      this.requireUuid(requestedDeveloperId, "identifiant du développeur");
    }
    const developerId = isAdmin
      ? requestedDeveloperId
      : user.developerProfile?.id;
    if (!developerId) {
      throw new BadRequestException("Le développeur du rapport est introuvable");
    }

    return this.timeEntriesService.getReport(developerId, from, to);
  }

  @Post("start")
  @Roles(Role.DEVELOPER)
  async start(
    @Req() req: AuthenticatedRequest,
    @Body() body: { ticketId?: string },
  ) {
    if (!body?.ticketId) {
      throw new BadRequestException("Le ticket est requis pour démarrer le chronomètre");
    }
    return this.timeEntriesService.start(
      this.getDeveloperId(req),
      this.requireUuid(body.ticketId, "identifiant du ticket"),
    );
  }

  @Post(":entryId/pause")
  @Roles(Role.DEVELOPER)
  async pause(
    @Req() req: AuthenticatedRequest,
    @Param("entryId") entryId: string,
  ) {
    return this.timeEntriesService.pause(
      this.getDeveloperId(req),
      this.requireUuid(entryId, "identifiant de session"),
    );
  }

  @Post(":entryId/resume")
  @Roles(Role.DEVELOPER)
  async resume(
    @Req() req: AuthenticatedRequest,
    @Param("entryId") entryId: string,
  ) {
    return this.timeEntriesService.resume(
      this.getDeveloperId(req),
      this.requireUuid(entryId, "identifiant de session"),
    );
  }

  @Post(":entryId/stop")
  @Roles(Role.DEVELOPER)
  async stop(
    @Req() req: AuthenticatedRequest,
    @Param("entryId") entryId: string,
    @Body() body: { comment?: string },
  ) {
    return this.timeEntriesService.stop(
      this.getDeveloperId(req),
      this.requireUuid(entryId, "identifiant de session"),
      body?.comment,
    );
  }

  @Post("submit")
  @Roles(Role.DEVELOPER)
  async submit(
    @Req() req: AuthenticatedRequest,
    @Body() body: { from?: string; to?: string },
  ) {
    if (!body?.from || !body.to) {
      throw new BadRequestException("Les dates de début et de fin sont requises");
    }
    return this.timeEntriesService.submitTimesheet(
      this.getDeveloperId(req),
      body.from,
      body.to,
    );
  }

  @Post("approve")
  @Roles(Role.HEAD, Role.ADMIN)
  async approve(
    @Req() req: AuthenticatedRequest,
    @Body() body: { developerId?: string; from?: string; to?: string },
  ) {
    if (!body?.developerId || !body.from || !body.to) {
      throw new BadRequestException(
        "Le développeur et les dates de la période sont requis",
      );
    }
    return this.timeEntriesService.approveTimesheet(
      this.getUser(req).id,
      this.requireUuid(body.developerId, "identifiant du développeur"),
      body.from,
      body.to,
    );
  }

  private getDeveloperId(req: AuthenticatedRequest) {
    const developerId = this.getUser(req).developerProfile?.id;
    if (!developerId) {
      throw new BadRequestException("Aucun profil développeur n'est associé au compte");
    }
    return developerId;
  }

  private getUser(req: AuthenticatedRequest) {
    if (!req.user) {
      throw new BadRequestException("Authentification requise");
    }
    return req.user;
  }

  private requireUuid(value: string, label: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      throw new BadRequestException(`Format invalide pour l'${label}`);
    }
    return value;
  }
}
