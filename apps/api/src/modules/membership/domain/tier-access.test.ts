import { describe, expect, it } from "vitest";

import {
  accessibleTiers,
  signalDelayMinutes,
  tierMeetsRequired,
} from "./tier-access.js";

describe("tier-access", () => {
  it("compares membership tiers", () => {
    expect(tierMeetsRequired("free", "free")).toBe(true);
    expect(tierMeetsRequired("free", "pro")).toBe(false);
    expect(tierMeetsRequired("premium", "pro")).toBe(true);
  });

  it("lists accessible tiers", () => {
    expect(accessibleTiers("pro")).toEqual(["free", "pro"]);
  });

  it("applies free signal delay", () => {
    expect(signalDelayMinutes("free")).toBe(15);
    expect(signalDelayMinutes("pro")).toBe(0);
  });
});
