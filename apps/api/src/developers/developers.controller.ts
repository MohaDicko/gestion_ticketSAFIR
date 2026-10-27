import { Controller, Get, Post, Param, Body } from "@nestjs/common";
import { DevelopersService } from "./developers.service";

@Controller("developers")
export class DevelopersController {
  constructor(private readonly developersService: DevelopersService) {}

  @Get()
  async getDevelopers() {
    return this.developersService.findAll();
  }

  @Post(":id/skills")
  async updateSkill(
    @Param("id") developerId: string,
    @Body() body: { skillId: string; level: number },
  ) {
    return this.developersService.setDeveloperSkill(developerId, body.skillId, body.level);
  }
}

@Controller("skills")
export class SkillsController {
  constructor(private readonly developersService: DevelopersService) {}

  @Get()
  async getSkills() {
    return this.developersService.getSkillsCatalogue();
  }
}
