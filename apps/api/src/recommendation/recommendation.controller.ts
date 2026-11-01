import { Controller, Get, Post, Param, Body } from "@nestjs/common";
import { Role } from "@prisma/client";
import { RecommendationService } from "./recommendation.service";
import { Roles } from "../auth/roles.decorator";

@Controller()
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get("tickets/:id/recommendations")
  @Roles(Role.HEAD, Role.ADMIN, Role.DEVELOPER)
  async getRecommendations(@Param("id") ticketId: string) {
    return this.recommendationService.getRecommendationsForTicket(ticketId);
  }

  @Post("tickets/:id/assign")
  @Roles(Role.HEAD, Role.ADMIN)
  async assignTicket(
    @Param("id") ticketId: string,
    @Body()
    body: {
      developerId: string;
      allocatedHours: number;
      assignedById: string;
      isOverride?: boolean;
      overrideReason?: string;
    },
  ) {
    return this.recommendationService.assignTicket(
      ticketId,
      body.developerId,
      body.allocatedHours,
      body.assignedById,
      body.isOverride,
      body.overrideReason,
    );
  }
}
