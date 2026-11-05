import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

const DEFAULT_DATABASE_URL =
  "postgresql://postgres.pplkjavvvgeyunrweuuc:qKLnh%40AqN*.keh4@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const DEFAULT_DIRECT_URL =
  "postgresql://postgres.pplkjavvvgeyunrweuuc:qKLnh%40AqN*.keh4@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = DEFAULT_DATABASE_URL;
    }
    if (!process.env.DIRECT_URL) {
      process.env.DIRECT_URL = DEFAULT_DIRECT_URL;
    }
    const url =
      (process.env.DIRECT_URL && !process.env.VERCEL ? process.env.DIRECT_URL : process.env.DATABASE_URL) ||
      DEFAULT_DATABASE_URL;
    super({ datasources: { db: { url } } });
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
