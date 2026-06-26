import { Prisma } from "@prisma/client";

export const MARKET_SNAPSHOT_MAX_AGE_MS = 120_000;

const COINGECKO_IDS: Record<string, string> = {
  BTCUSDT: "bitcoin",
  ETHUSDT: "ethereum",
  SOLUSDT: "solana",
  BNBUSDT: "binancecoin",
};

export function isMarketSnapshotStale(capturedAt: Date, now = new Date()) {
  return now.getTime() - capturedAt.getTime() > MARKET_SNAPSHOT_MAX_AGE_MS;
}

export async function fetchCoinGeckoPrices(symbols: string[]) {
  const ids = symbols
    .map((symbol) => COINGECKO_IDS[symbol])
    .filter(Boolean)
    .join(",");
  if (!ids) {
    return new Map<
      string,
      { price: Prisma.Decimal; changeRate: Prisma.Decimal | null }
    >();
  }

  const apiKey = process.env.COINGECKO_API_KEY?.trim();
  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", ids);
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_24hr_change", "true");

  const response = await fetch(url, {
    headers: apiKey ? { "x-cg-demo-api-key": apiKey } : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`CoinGecko request failed: ${response.status}`);
  }

  const payload = (await response.json()) as Record<
    string,
    { usd?: number; usd_24h_change?: number }
  >;
  const prices = new Map<
    string,
    { price: Prisma.Decimal; changeRate: Prisma.Decimal | null }
  >();

  for (const symbol of symbols) {
    const id = COINGECKO_IDS[symbol];
    const quote = id ? payload[id] : undefined;
    if (!quote?.usd) {
      continue;
    }
    prices.set(symbol, {
      price: new Prisma.Decimal(quote.usd),
      changeRate:
        typeof quote.usd_24h_change === "number"
          ? new Prisma.Decimal(quote.usd_24h_change).div(100)
          : null,
    });
  }

  return prices;
}
