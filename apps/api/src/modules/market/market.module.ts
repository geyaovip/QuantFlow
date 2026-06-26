import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module.js";
import { MarketService } from "./application/market.service.js";
import { MarketController } from "./interfaces/market.controller.js";

@Module({
  imports: [PrismaModule],
  controllers: [MarketController],
  providers: [MarketService],
  exports: [MarketService],
})
export class MarketModule {}
