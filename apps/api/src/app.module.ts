import { Module } from "@nestjs/common";

import { AdminAccessModule } from "./modules/admin-access/admin-access.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { GovernanceModule } from "./modules/governance/governance.module.js";
import { HealthController } from "./modules/health/health.controller.js";
import { MembershipModule } from "./modules/membership/membership.module.js";
import { MarketModule } from "./modules/market/market.module.js";
import { NotificationModule } from "./modules/notification/notification.module.js";
import { PaperModule } from "./modules/paper/paper.module.js";
import { StrategyModule } from "./modules/strategy/strategy.module.js";
import { SystemController } from "./modules/system/system.controller.js";

@Module({
  imports: [
    AuthModule,
    AdminAccessModule,
    MembershipModule,
    NotificationModule,
    GovernanceModule,
    StrategyModule,
    PaperModule,
    MarketModule,
  ],
  controllers: [HealthController, SystemController],
})
export class AppModule {}
