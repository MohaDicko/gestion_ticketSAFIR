import { Controller, Get, Post, Param, Body } from "@nestjs/common";
import { RecommendationService } from "./recommendation.service";

@Controller()
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get("tickets/:id/recommendations")
  async getRecommendations(@Param("id") ticketId: string) {
    return this.recommendationService.getRecommendationsForTicket(ticketId);
  }

  @Post("tickets/:id/assign")
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
