import { Controller, Get, Post, Param, Body } from "@nestjs/common";
import { EmailsService } from "./emails.service";

@Controller("emails")
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get("inbox")
  async getInbox() {
    return this.emailsService.getInbox();
  }

  @Post(":id/qualify")
  async qualifyEmail(@Param("id") emailId: string, @Body() body: any) {
    return this.emailsService.qualifyEmailToTicket(emailId, body);
  }

  @Post(":id/link")
  async linkEmail(@Param("id") emailId: string, @Body() body: { ticketId: string; actorId?: string }) {
    return this.emailsService.linkEmailToTicket(emailId, body.ticketId, body.actorId);
  }

  @Post("simulate")
  async simulateInbound(@Body() body: any) {
    return this.emailsService.simulateInboundEmail(body);
  }
}
