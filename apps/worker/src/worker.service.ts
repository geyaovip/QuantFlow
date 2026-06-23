import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerService.name);
  private interval?: NodeJS.Timeout;

  onModuleInit() {
    this.logger.log(
      "Worker started; market and outbox jobs are not registered yet.",
    );
    this.interval = setInterval(
      () => this.logger.debug("Worker heartbeat"),
      60_000,
    );
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }
}
