import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHealth() {
    return {
      service: "quantflow-api",
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("ready")
  async getReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        service: "quantflow-api",
        status: "ready",
        checks: { database: "ok" },
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        service: "quantflow-api",
        status: "not_ready",
        checks: { database: "failed" },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get("live")
  getLiveness() {
    return {
      service: "quantflow-api",
      status: "live",
      timestamp: new Date().toISOString(),
    };
  }
}
