import { describe, expect, it } from "vitest";

import { loadAppConfig } from "./app-config.js";

describe("loadAppConfig", () => {
  it("defaults every future capability to disabled", () => {
    const config = loadAppConfig({ NODE_ENV: "test" });
    expect(Object.values(config.featureFlags).every((value) => !value)).toBe(
      true,
    );
  });

  it("allows production payments without enabling trading", () => {
    const config = loadAppConfig({
      ENABLE_PRODUCTION_PAYMENTS: "true",
      NODE_ENV: "test",
    });
    expect(config.featureFlags.enableProductionPayments).toBe(true);
    expect(config.featureFlags.enableAutoTrading).toBe(false);
  });

  it("rejects attempts to enable real trading", () => {
    expect(() => loadAppConfig({ ENABLE_AUTO_TRADING: "true" })).toThrow();
  });

  it("rejects ENABLE_E2E_AUTH outside test", () => {
    expect(() =>
      loadAppConfig({ NODE_ENV: "production", ENABLE_E2E_AUTH: "true" }),
    ).toThrow(/ENABLE_E2E_AUTH/);
  });

  it("requires production auth secrets", () => {
    expect(() => loadAppConfig({ NODE_ENV: "production" })).toThrow(
      /Missing production auth config/,
    );
  });
});
