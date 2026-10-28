import { Controller, Get, Post, Body } from "@nestjs/common";
import { ConsultantsService } from "./consultants.service";

@Controller("consultants")
export class ConsultantsController {
  constructor(private readonly consultantsService: ConsultantsService) {}

  @Get()
  async getConsultants() {
    return this.consultantsService.findAll();
  }

  @Post()
  async createConsultant(
    @Body()
    body: {
      firstName: string;
      lastName: string;
      email: string;
      organization?: string;
      passwordPlain?: string;
      isInternal?: boolean;
    },
  ) {
    return this.consultantsService.create(body);
  }
}
