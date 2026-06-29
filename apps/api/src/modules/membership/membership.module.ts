import { Module, forwardRef } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { NotificationModule } from "../notification/notification.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { MembershipService } from "./application/membership.service.js";
import { RiskAcceptanceService } from "./application/risk-acceptance.service.js";
import { MEMBERSHIP_REPOSITORY } from "./domain/membership-repository.js";
import { PlisioClient } from "./infrastructure/plisio-client.js";
import { PrismaMembershipRepository } from "./infrastructure/prisma-membership-repository.js";
import { MembershipController } from "./interfaces/membership.controller.js";

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule), NotificationModule],
  controllers: [MembershipController],
  providers: [
    MembershipService,
    RiskAcceptanceService,
    PlisioClient,
    PrismaMembershipRepository,
    {
      provide: MEMBERSHIP_REPOSITORY,
      useExisting: PrismaMembershipRepository,
    },
  ],
  exports: [MembershipService, RiskAcceptanceService],
})
export class MembershipModule {}
