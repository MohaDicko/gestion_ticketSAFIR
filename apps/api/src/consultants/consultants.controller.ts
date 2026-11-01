import { Controller, Get, Post, Body } from "@nestjs/common";
import { Role } from "@prisma/client";
import { ConsultantsService } from "./consultants.service";
import { Roles } from "../auth/roles.decorator";

@Controller("consultants")
export class ConsultantsController {
  constructor(private readonly consultantsService: ConsultantsService) {}

  @Get()
  @Roles(Role.HEAD, Role.ADMIN)
  async getConsultants() {
    return this.consultantsService.findAll();
  }

  @Post()
  @Roles(Role.HEAD)
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
