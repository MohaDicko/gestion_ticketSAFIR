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
import { SapB1Service } from "./services/sapB1.service";
import { SapB1Controller } from "./services/sapB1.controller";
import { APP_GUARD } from "@nestjs/core";
import { SessionGuard } from "./auth/session.guard";
import { RolesGuard } from "./auth/roles.guard";
import { TimeEntriesController } from "./time-entries/time-entries.controller";
import { TimeEntriesService } from "./time-entries/time-entries.service";

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
    SapB1Controller,
    TimeEntriesController,
  ],
  providers: [
    AuthService,
    DevelopersService,
    TicketsService,
    RecommendationService,
    EmailsService,
    ConsultantsService,
    SapB1Service,
    TimeEntriesService,
    {
      provide: APP_GUARD,
      useClass: SessionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
