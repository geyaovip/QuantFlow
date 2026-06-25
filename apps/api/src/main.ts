import "reflect-metadata";

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";
import { loadAppConfig } from "./config/app-config.js";

async function bootstrap() {
  const config = loadAppConfig();
  const app = await NestFactory.create(AppModule, { cors: false });
  app.enableCors({
    origin(
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) {
      if (!origin || config.auth.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed by QuantFlow CORS policy."));
    },
    credentials: true,
  });
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({ forbidUnknownValues: true, transform: true }),
  );
  app.enableShutdownHooks();
  await app.listen(config.port, "0.0.0.0");
  Logger.log(`API listening on ${config.port}`, "Bootstrap");
}

void bootstrap();
