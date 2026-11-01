import { Controller, Get, Post, HttpCode, HttpStatus } from "@nestjs/common";
import { Role } from "@prisma/client";
import { SapB1Service } from "./sapB1.service";
import { Roles } from "../auth/roles.decorator";

@Controller("sap")
export class SapB1Controller {
  constructor(private readonly sapB1Service: SapB1Service) {}

  @Get("status")
  @Roles(Role.HEAD, Role.ADMIN)
  async getStatus() {
    return this.sapB1Service.getDiagnostics();
  }

  @Post("test-connection")
  @Roles(Role.HEAD, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async testConnection() {
    const config = this.sapB1Service.getConfig();
    const isTcpReachable = await this.sapB1Service.testTcpPort(config.serverHost, config.rdpPort, 3000);
    const diag = await this.sapB1Service.getDiagnostics();

    return {
      serverHost: config.serverHost,
      rdpPort: config.rdpPort,
      rdpReachable: isTcpReachable,
      serviceLayerUrl: config.serviceLayerUrl,
      isConfigured: diag.isConfigured,
      authenticated: diag.authenticated || false,
      message: diag.message,
      timestamp: diag.timestamp,
    };
  }
}
