import { Controller, Get, Post, Param, Body, Delete } from "@nestjs/common";
import { Role } from "@prisma/client";
import { DevelopersService } from "./developers.service";
import { Roles } from "../auth/roles.decorator";

@Controller("developers")
export class DevelopersController {
  constructor(private readonly developersService: DevelopersService) {}

  @Get()
  @Roles(Role.HEAD, Role.ADMIN)
  async getDevelopers() {
    return this.developersService.findAll();
  }

  @Post()
  @Roles(Role.HEAD)
  async createDeveloper(
    @Body()
    body: {
      firstName: string;
      lastName: string;
      email: string;
      jobTitle: string;
      weeklyCapacityHours?: number;
      skills?: { skillId: string; level: number }[];
    },
  ) {
    return this.developersService.createDeveloper(body);
  }

  @Post(":id/skills")
  @Roles(Role.HEAD)
  async updateSkill(
    @Param("id") developerId: string,
    @Body() body: { skillId: string; level: number },
  ) {
    return this.developersService.setDeveloperSkill(developerId, body.skillId, body.level);
  }

  @Delete(":id")
  @Roles(Role.HEAD, Role.ADMIN)
  async deleteDeveloper(@Param("id") developerId: string) {
    return this.developersService.deactivateDeveloper(developerId);
  }
}

@Controller("skills")
export class SkillsController {
  constructor(private readonly developersService: DevelopersService) {}

  @Get()
  @Roles(Role.HEAD, Role.ADMIN, Role.DEVELOPER, Role.CONSULTANT)
  async getSkills() {
    return this.developersService.getSkillsCatalogue();
  }
}
