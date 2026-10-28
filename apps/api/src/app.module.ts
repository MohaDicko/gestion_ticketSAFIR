import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthController } from "./health/health.controller";
import { AuthService } from "./auth/auth.service";
import { AuthController } from "./auth/auth.controller";
import { DevelopersService } from "./developers/developers.service";
import { DevelopersController, SkillsController } from "./developers/developers.controller";
import { TicketsService } from "./tickets/tickets.service";
import { TicketsController } from "./tickets/tickets.controller";
import { RecommendationService } from "./recommendation/recommendation.service";
import { RecommendationController } from "./recommendation/recommendation.controller";
import { EmailsService } from "./emails/emails.service";
import { EmailsController } from "./emails/emails.controller";
import { ConsultantsService } from "./consultants/consultants.service";
import { ConsultantsController } from "./consultants/consultants.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
  ],
  controllers: [
    HealthController,
    AuthController,
    DevelopersController,
    SkillsController,
    TicketsController,
    RecommendationController,
    EmailsController,
    ConsultantsController,
  ],
  providers: [
    AuthService,
    DevelopersService,
    TicketsService,
    RecommendationService,
    EmailsService,
    ConsultantsService,
  ],
})
export class AppModule {}
