import { Module } from "@nestjs/common";

import { HealthController } from "./modules/health/health.controller.js";
import { SystemController } from "./modules/system/system.controller.js";

@Module({
  controllers: [HealthController, SystemController],
})
export class AppModule {}
