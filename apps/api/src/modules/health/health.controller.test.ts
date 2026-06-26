import { ServiceUnavailableException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { HealthController } from "./health.controller.js";

describe("HealthController", () => {
  it("reports the API as healthy", () => {
    const prisma = { $queryRaw: vi.fn() };
    const result = new HealthController(prisma as never).getHealth();
    expect(result.service).toBe("quantflow-api");
    expect(result.status).toBe("ok");
  });

  it("reports readiness when the database responds", async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
    };
    const result = await new HealthController(prisma as never).getReadiness();
    expect(result.status).toBe("ready");
    expect(result.checks.database).toBe("ok");
  });

  it("fails readiness when the database is unavailable", async () => {
    const prisma = { $queryRaw: vi.fn().mockRejectedValue(new Error("down")) };
    await expect(
      new HealthController(prisma as never).getReadiness(),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
