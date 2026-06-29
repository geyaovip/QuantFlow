import { expect, test } from "@playwright/test";

const apiURL = process.env.E2E_API_URL ?? "http://127.0.0.1:3002";

test.describe("API smoke", () => {
  test("health endpoint responds", async ({ request }) => {
    const response = await request.get(`${apiURL}/api/v1/health`);
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { status: string; service: string };
    expect(body.service).toBe("quantflow-api");
    expect(body.status).toBe("ok");
  });

  test("readiness endpoint responds when database is available", async ({
    request,
  }) => {
    const response = await request.get(`${apiURL}/api/v1/health/ready`);
    expect(response.status()).toBeLessThan(500);
    const body = (await response.json()) as {
      status: string;
      checks?: { database: string };
    };
    if (response.ok()) {
      expect(body.status).toBe("ready");
      expect(body.checks?.database).toBe("ok");
    }
  });

  test("feature flags keep live trading disabled", async ({ request }) => {
    const response = await request.get(`${apiURL}/api/v1/system/feature-flags`);
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as Record<string, boolean>;
    expect(body.enableExchangeConnection).toBe(false);
    expect(body.enableSemiAutoTrading).toBe(false);
    expect(body.enableAutoTrading).toBe(false);
  });
});
