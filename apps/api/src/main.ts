import "reflect-metadata";

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";
import { loadAppConfig } from "./config/app-config.js";

async function bootstrap() {
  const config = loadAppConfig();
  const app = await NestFactory.create(AppModule, { cors: false });
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({ forbidUnknownValues: true, transform: true }),
  );
  app.enableShutdownHooks();
  await app.listen(config.port, "0.0.0.0");
  Logger.log(`API listening on ${config.port}`, "Bootstrap");
}

void bootstrap();
