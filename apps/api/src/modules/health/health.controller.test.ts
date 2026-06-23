import { describe, expect, it } from "vitest";

import { HealthController } from "./health.controller.js";

describe("HealthController", () => {
  it("reports the API as healthy", () => {
    const result = new HealthController().getHealth();
    expect(result.service).toBe("quantflow-api");
    expect(result.status).toBe("ok");
  });
});
