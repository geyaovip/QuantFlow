import { Module, forwardRef } from "@nestjs/common";

import { AdminAccessModule } from "../admin-access/admin-access.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { NotificationModule } from "../notification/notification.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { GovernanceService } from "./application/governance.service.js";
import { GOVERNANCE_REPOSITORY } from "./domain/governance-repository.js";
import { PrismaGovernanceRepository } from "./infrastructure/prisma-governance-repository.js";
import { GovernanceController } from "./interfaces/governance.controller.js";

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    forwardRef(() => AuthModule),
    forwardRef(() => AdminAccessModule),
  ],
  controllers: [GovernanceController],
  providers: [
    GovernanceService,
    PrismaGovernanceRepository,
    { provide: GOVERNANCE_REPOSITORY, useExisting: PrismaGovernanceRepository },
  ],
  exports: [GovernanceService],
})
export class GovernanceModule {}
