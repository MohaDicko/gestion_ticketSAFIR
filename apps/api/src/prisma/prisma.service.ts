import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = process.env.DIRECT_URL && !process.env.VERCEL ? process.env.DIRECT_URL : process.env.DATABASE_URL;
    super(url ? { datasources: { db: { url } } } : undefined);
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("Connecté avec succès à la base PostgreSQL 16");
    } catch (err: any) {
      this.logger.warn(`Connexion PostgreSQL non disponible au démarrage : ${err?.message || err}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
