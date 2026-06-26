import { Module } from "@nestjs/common";

import { AuthModule } from "./modules/auth/auth.module.js";
import { HealthController } from "./modules/health/health.controller.js";
import { MembershipModule } from "./modules/membership/membership.module.js";
import { StrategyModule } from "./modules/strategy/strategy.module.js";
import { SystemController } from "./modules/system/system.controller.js";

@Module({
  imports: [AuthModule, MembershipModule, StrategyModule],
  controllers: [HealthController, SystemController],
})
export class AppModule {}
