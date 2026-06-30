import { describe, expect, it } from "vitest";

import {
  accessibleTiers,
  signalDelayMinutes,
  tierMeetsRequired,
} from "./tier-access.js";

describe("tier-access", () => {
  it("compares membership tiers", () => {
    expect(tierMeetsRequired("free", "free")).toBe(true);
    expect(tierMeetsRequired("free", "plus")).toBe(false);
    expect(tierMeetsRequired("pro", "plus")).toBe(true);
  });

  it("lists accessible tiers", () => {
    expect(accessibleTiers("plus")).toEqual(["free", "plus"]);
  });

  it("applies free signal delay", () => {
    expect(signalDelayMinutes("free")).toBe(15);
    expect(signalDelayMinutes("pro")).toBe(0);
  });
});
