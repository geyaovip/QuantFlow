import { Prisma } from "@prisma/client";

export const MARKET_SNAPSHOT_MAX_AGE_MS = 120_000;
export const MARKET_SNAPSHOT_SIGNAL_WINDOW_MS = 60_000;

export type ResolvedMarketPrice =
  | {
      ok: true;
      price: Prisma.Decimal;
      snapshotId: string;
      capturedAt: Date;
    }
  | {
      ok: false;
      reason: string;
    };

export function validateMarketSnapshot(
  capturedAt: Date,
  signalGeneratedAt: Date,
  now = new Date(),
): ResolvedMarketPrice | { ok: false; reason: string } {
  const snapshotAgeMs = now.getTime() - capturedAt.getTime();
  if (snapshotAgeMs > MARKET_SNAPSHOT_MAX_AGE_MS) {
    return { ok: false, reason: "行情快照已过期，暂不执行模拟成交" };
  }

  const signalDeltaMs = capturedAt.getTime() - signalGeneratedAt.getTime();
  if (signalDeltaMs < 0 || signalDeltaMs > MARKET_SNAPSHOT_SIGNAL_WINDOW_MS) {
    return {
      ok: false,
      reason: "行情快照不在信号生成后的有效窗口内",
    };
  }

  return {
    ok: true,
    price: new Prisma.Decimal(0),
    snapshotId: "",
    capturedAt,
  };
}

export function resolveMarketPriceFromSnapshot(input: {
  price: Prisma.Decimal;
  snapshotId: string;
  capturedAt: Date;
  signalGeneratedAt: Date;
  now?: Date;
}): ResolvedMarketPrice {
  const validation = validateMarketSnapshot(
    input.capturedAt,
    input.signalGeneratedAt,
    input.now,
  );
  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    price: input.price,
    snapshotId: input.snapshotId,
    capturedAt: input.capturedAt,
  };
}
