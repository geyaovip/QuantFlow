import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { StrategyService } from "./application/strategy.service.js";
import { STRATEGY_REPOSITORY } from "./domain/strategy-repository.js";
import { PrismaStrategyRepository } from "./infrastructure/prisma-strategy-repository.js";
import { StrategyController } from "./interfaces/strategy.controller.js";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [StrategyController],
  providers: [
    StrategyService,
    PrismaStrategyRepository,
    { provide: STRATEGY_REPOSITORY, useExisting: PrismaStrategyRepository },
  ],
})
export class StrategyModule {}
