import { Module, forwardRef } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { MembershipModule } from "../membership/membership.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { PaperService } from "./application/paper.service.js";
import { PAPER_REPOSITORY } from "./domain/paper-repository.js";
import { PrismaPaperRepository } from "./infrastructure/prisma-paper-repository.js";
import { PaperController } from "./interfaces/paper.controller.js";

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule), MembershipModule],
  controllers: [PaperController],
  providers: [
    PaperService,
    PrismaPaperRepository,
    { provide: PAPER_REPOSITORY, useExisting: PrismaPaperRepository },
  ],
})
export class PaperModule {}
