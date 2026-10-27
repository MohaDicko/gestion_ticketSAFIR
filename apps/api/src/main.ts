import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, Logger } from "@nestjs/common";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const logger = new Logger("TicketManagerAPI");
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api/v1");
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  });

  const port = process.env.PORT_API || 4000;
  await app.listen(port, "0.0.0.0");
  logger.log(`🚀 Ticket Manager API démarrée sur http://localhost:${port}/api/v1`);
  logger.log(`🩺 Health check disponible sur http://localhost:${port}/api/v1/health`);
}

bootstrap();
