import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  MARKET_SNAPSHOT_MAX_AGE_MS,
  MARKET_SNAPSHOT_SIGNAL_WINDOW_MS,
  resolveMarketPriceFromSnapshot,
  validateMarketSnapshot,
} from "./paper-market.js";

describe("paper-market", () => {
  it("accepts snapshot within signal window and age limit", () => {
    const signalGeneratedAt = new Date("2026-06-26T10:00:00.000Z");
    const capturedAt = new Date("2026-06-26T10:00:30.000Z");
    const now = new Date("2026-06-26T10:01:00.000Z");

    const result = validateMarketSnapshot(capturedAt, signalGeneratedAt, now);
    expect(result.ok).toBe(true);
  });

  it("rejects snapshot older than max age", () => {
    const signalGeneratedAt = new Date("2026-06-26T10:00:00.000Z");
    const capturedAt = new Date("2026-06-26T10:00:10.000Z");
    const now = new Date(capturedAt.getTime() + MARKET_SNAPSHOT_MAX_AGE_MS + 1);

    const result = validateMarketSnapshot(capturedAt, signalGeneratedAt, now);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("过期");
    }
  });

  it("rejects snapshot outside signal window", () => {
    const signalGeneratedAt = new Date("2026-06-26T10:00:00.000Z");
    const capturedAt = new Date(
      signalGeneratedAt.getTime() + MARKET_SNAPSHOT_SIGNAL_WINDOW_MS + 1,
    );
    const now = capturedAt;

    const result = resolveMarketPriceFromSnapshot({
      price: new Prisma.Decimal("65000"),
      snapshotId: "snap-1",
      capturedAt,
      signalGeneratedAt,
      now,
    });
    expect(result.ok).toBe(false);
  });
});
