import { Module, forwardRef } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { NotificationService } from "./application/notification.service.js";
import { NOTIFICATION_REPOSITORY } from "./domain/notification-repository.js";
import { PrismaNotificationRepository } from "./infrastructure/prisma-notification-repository.js";
import { NotificationController } from "./interfaces/notification.controller.js";

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    PrismaNotificationRepository,
    {
      provide: NOTIFICATION_REPOSITORY,
      useExisting: PrismaNotificationRepository,
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
