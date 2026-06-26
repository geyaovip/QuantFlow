import { Prisma } from "@prisma/client";

export const PAPER_ENGINE_V1 = "paper-engine-v1";
export const PAPER_FEE_RATE = new Prisma.Decimal("0.001");
export const MAX_PRICE_DEVIATION = new Prisma.Decimal("0.02");

const SLIPPAGE_BY_SYMBOL: Record<string, Prisma.Decimal> = {
  BTCUSDT: new Prisma.Decimal("0.0005"),
  ETHUSDT: new Prisma.Decimal("0.0005"),
  SOLUSDT: new Prisma.Decimal("0.001"),
  BNBUSDT: new Prisma.Decimal("0.0005"),
};

const DEFAULT_SLIPPAGE = new Prisma.Decimal("0.0005");
const EIGHT_DP = 8;
const RATIO_DP = 8;

export type PaperFillInput = {
  side: "buy" | "sell";
  symbol: string;
  markPrice: Prisma.Decimal;
  triggerPrice: Prisma.Decimal;
  suggestedPositionPct: Prisma.Decimal;
  maxPositionPct: Prisma.Decimal;
  cashBalance: Prisma.Decimal;
  positionQuantity: Prisma.Decimal;
  averagePrice: Prisma.Decimal;
};

export type PaperFillResult =
  | {
      ok: true;
      fillPrice: Prisma.Decimal;
      quantity: Prisma.Decimal;
      fee: Prisma.Decimal;
      notional: Prisma.Decimal;
      slippageRate: Prisma.Decimal;
      realizedPnl: Prisma.Decimal;
    }
  | {
      ok: false;
      reason: string;
    };

export function slippageRateForSymbol(symbol: string) {
  return SLIPPAGE_BY_SYMBOL[symbol] ?? DEFAULT_SLIPPAGE;
}

export function isPriceDeviationExceeded(
  markPrice: Prisma.Decimal,
  triggerPrice: Prisma.Decimal,
) {
  if (triggerPrice.lte(0)) {
    return true;
  }

  const deviation = markPrice.sub(triggerPrice).abs().div(triggerPrice);
  return deviation.gt(MAX_PRICE_DEVIATION);
}

export function buildPaperFill(input: PaperFillInput): PaperFillResult {
  if (isPriceDeviationExceeded(input.markPrice, input.triggerPrice)) {
    return {
      ok: false,
      reason: "当前价格相对触发价偏离超过 2%，暂不执行模拟成交",
    };
  }

  const slippageRate = slippageRateForSymbol(input.symbol);
  const fillPrice =
    input.side === "buy"
      ? quantizePrice(
          input.markPrice.mul(new Prisma.Decimal(1).add(slippageRate)),
        )
      : quantizePrice(
          input.markPrice.mul(new Prisma.Decimal(1).sub(slippageRate)),
        );

  if (fillPrice.lte(0)) {
    return { ok: false, reason: "模拟成交价无效" };
  }

  if (input.side === "buy") {
    const positionPct = Prisma.Decimal.min(
      input.suggestedPositionPct,
      input.maxPositionPct,
    );
    const notional = quantizeMoney(input.cashBalance.mul(positionPct));
    if (notional.lte(0)) {
      return { ok: false, reason: "模拟资金不足，无法买入" };
    }

    const quantity = quantizeQuantity(notional.div(fillPrice));
    const fee = quantizeMoney(notional.mul(PAPER_FEE_RATE));
    const totalCost = notional.add(fee);
    if (totalCost.gt(input.cashBalance)) {
      return { ok: false, reason: "模拟资金不足以覆盖买入和手续费" };
    }

    return {
      ok: true,
      fillPrice,
      quantity,
      fee,
      notional,
      slippageRate,
      realizedPnl: new Prisma.Decimal(0),
    };
  }

  if (input.positionQuantity.lte(0)) {
    return { ok: false, reason: "当前没有可卖出的模拟持仓" };
  }

  const quantity = input.positionQuantity;
  const notional = quantizeMoney(quantity.mul(fillPrice));
  const fee = quantizeMoney(notional.mul(PAPER_FEE_RATE));
  const costBasis = quantizeMoney(quantity.mul(input.averagePrice));
  const realizedPnl = quantizeMoney(notional.sub(fee).sub(costBasis));

  return {
    ok: true,
    fillPrice,
    quantity,
    fee,
    notional,
    slippageRate,
    realizedPnl,
  };
}

export function computeAccountMetrics(input: {
  initialBalance: Prisma.Decimal;
  cashBalance: Prisma.Decimal;
  openPositions: Array<{
    quantity: Prisma.Decimal;
    markPrice: Prisma.Decimal;
  }>;
  peakEquity: Prisma.Decimal;
}) {
  const positionValue = input.openPositions.reduce(
    (sum, position) => sum.add(position.quantity.mul(position.markPrice)),
    new Prisma.Decimal(0),
  );
  const estimatedExitFee = input.openPositions.reduce(
    (sum, position) =>
      sum.add(
        quantizeMoney(
          position.quantity.mul(position.markPrice).mul(PAPER_FEE_RATE),
        ),
      ),
    new Prisma.Decimal(0),
  );
  const equity = quantizeMoney(
    input.cashBalance.add(positionValue).sub(estimatedExitFee),
  );
  const peakEquity = Prisma.Decimal.max(input.peakEquity, equity);
  const returnRate = input.initialBalance.lte(0)
    ? new Prisma.Decimal(0)
    : quantizeRatio(equity.sub(input.initialBalance).div(input.initialBalance));
  const drawdown = peakEquity.lte(0)
    ? new Prisma.Decimal(0)
    : quantizeRatio(peakEquity.sub(equity).div(peakEquity));

  return {
    equity,
    peakEquity,
    returnRate,
    drawdown,
    positionCount: input.openPositions.length,
  };
}

export function quantizeMoney(value: Prisma.Decimal) {
  return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

export function quantizePrice(value: Prisma.Decimal) {
  return value.toDecimalPlaces(EIGHT_DP, Prisma.Decimal.ROUND_HALF_UP);
}

export function quantizeQuantity(value: Prisma.Decimal) {
  return value.toDecimalPlaces(EIGHT_DP, Prisma.Decimal.ROUND_HALF_UP);
}

export function quantizeRatio(value: Prisma.Decimal) {
  return value.toDecimalPlaces(RATIO_DP, Prisma.Decimal.ROUND_HALF_UP);
}

export function decimalToString(value: Prisma.Decimal) {
  return value.toFixed();
}
