import { Controller, Get, Post, Param, Body } from "@nestjs/common";
import { Role } from "@prisma/client";
import { EmailsService } from "./emails.service";
import { Roles } from "../auth/roles.decorator";

@Controller("emails")
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get("inbox")
  @Roles(Role.HEAD, Role.ADMIN, Role.CONSULTANT)
  async getInbox() {
    return this.emailsService.getInbox();
  }

  @Post(":id/qualify")
  @Roles(Role.HEAD, Role.ADMIN)
  async qualifyEmail(@Param("id") emailId: string, @Body() body: any) {
    return this.emailsService.qualifyEmailToTicket(emailId, body);
  }

  @Post(":id/link")
  @Roles(Role.HEAD, Role.ADMIN)
  async linkEmail(@Param("id") emailId: string, @Body() body: { ticketId: string; actorId?: string }) {
    return this.emailsService.linkEmailToTicket(emailId, body.ticketId, body.actorId);
  }

  @Post("simulate")
  @Roles(Role.HEAD, Role.ADMIN)
  async simulateInbound(@Body() body: any) {
    return this.emailsService.simulateInboundEmail(body);
  }
}
