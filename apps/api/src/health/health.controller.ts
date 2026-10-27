import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    let dbStatus = "down";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = "up";
    } catch {
      dbStatus = "disconnected";
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "Ticket Manager API",
      database: dbStatus,
      version: "1.0.0",
    };
  }
}
