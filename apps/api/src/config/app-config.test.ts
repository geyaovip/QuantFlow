import { describe, expect, it } from "vitest";

import { loadAppConfig } from "./app-config.js";

describe("loadAppConfig", () => {
  it("defaults every future capability to disabled", () => {
    const config = loadAppConfig({ NODE_ENV: "test" });
    expect(Object.values(config.featureFlags).every((value) => !value)).toBe(
      true,
    );
  });

  it("rejects attempts to enable real trading", () => {
    expect(() => loadAppConfig({ ENABLE_AUTO_TRADING: "true" })).toThrow();
  });

  it("requires production auth secrets", () => {
    expect(() => loadAppConfig({ NODE_ENV: "production" })).toThrow(
      /Missing production auth config/,
    );
  });
});
