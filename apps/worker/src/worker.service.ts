import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import type { PrismaClient } from "@prisma/client";

import {
  createWorkerPrisma,
  refreshMarketSnapshots,
} from "./market-refresh.js";

const REFRESH_INTERVAL_MS = 60_000;

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerService.name);
  private interval?: NodeJS.Timeout;
  private prisma?: PrismaClient;

  async onModuleInit() {
    this.prisma = createWorkerPrisma();
    await this.prisma.$connect();
    this.logger.log("Worker started; market snapshot refresh registered.");
    await this.runRefresh();
    this.interval = setInterval(() => {
      void this.runRefresh();
    }, REFRESH_INTERVAL_MS);
  }

  async onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    await this.prisma?.$disconnect();
  }

  private async runRefresh() {
    if (!this.prisma) {
      return;
    }

    try {
      const written = await refreshMarketSnapshots(this.prisma);
      this.logger.log(`Refreshed ${written} market snapshots.`);
    } catch (error) {
      this.logger.error(
        "Market snapshot refresh failed.",
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
