import { Module, forwardRef } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AdminAccessService } from "./application/admin-access.service.js";
import { AdminSessionService } from "./application/admin-session.service.js";
import { ADMIN_ACCESS_REPOSITORY } from "./domain/admin-access-repository.js";
import { PrismaAdminAccessRepository } from "./infrastructure/prisma-admin-access-repository.js";
import { AdminAuditController } from "./interfaces/admin-audit.controller.js";

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [AdminAuditController],
  providers: [
    AdminAccessService,
    AdminSessionService,
    PrismaAdminAccessRepository,
    {
      provide: ADMIN_ACCESS_REPOSITORY,
      useExisting: PrismaAdminAccessRepository,
    },
  ],
  exports: [AdminAccessService, AdminSessionService],
})
export class AdminAccessModule {}
