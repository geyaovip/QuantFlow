import { Module } from "@nestjs/common";

import { AuthModule } from "./modules/auth/auth.module.js";
import { HealthController } from "./modules/health/health.controller.js";
import { SystemController } from "./modules/system/system.controller.js";

@Module({
  imports: [AuthModule],
  controllers: [HealthController, SystemController],
})
export class AppModule {}
