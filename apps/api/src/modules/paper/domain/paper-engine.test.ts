import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  buildPaperFill,
  computeAccountMetrics,
  isPriceDeviationExceeded,
} from "./paper-engine.js";

describe("paper-engine-v1", () => {
  it("rejects fills when price deviates more than 2%", () => {
    expect(
      isPriceDeviationExceeded(
        new Prisma.Decimal("65000"),
        new Prisma.Decimal("60000"),
      ),
    ).toBe(true);
  });

  it("builds a buy fill with fee and slippage", () => {
    const result = buildPaperFill({
      side: "buy",
      symbol: "BTCUSDT",
      markPrice: new Prisma.Decimal("64000"),
      triggerPrice: new Prisma.Decimal("63900"),
      suggestedPositionPct: new Prisma.Decimal("0.1"),
      maxPositionPct: new Prisma.Decimal("0.1"),
      cashBalance: new Prisma.Decimal("10000"),
      positionQuantity: new Prisma.Decimal(0),
      averagePrice: new Prisma.Decimal(0),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.quantity.gt(0)).toBe(true);
      expect(result.fee.gt(0)).toBe(true);
      expect(result.fillPrice.gt(new Prisma.Decimal("64000"))).toBe(true);
    }
  });

  it("computes equity, return and drawdown", () => {
    const metrics = computeAccountMetrics({
      initialBalance: new Prisma.Decimal("10000"),
      cashBalance: new Prisma.Decimal("9000"),
      openPositions: [
        {
          quantity: new Prisma.Decimal("0.01"),
          markPrice: new Prisma.Decimal("65000"),
        },
      ],
      peakEquity: new Prisma.Decimal("10100"),
    });

    expect(metrics.equity.gt(new Prisma.Decimal("9000"))).toBe(true);
    expect(metrics.drawdown.gte(0)).toBe(true);
    expect(metrics.positionCount).toBe(1);
  });
});
