import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

const COINGECKO_IDS: Record<string, string> = {
  BTCUSDT: "bitcoin",
  ETHUSDT: "ethereum",
  SOLUSDT: "solana",
  BNBUSDT: "binancecoin",
};

export function createWorkerPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for worker market refresh.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export async function refreshMarketSnapshots(prisma: PrismaClient) {
  const symbols = await prisma.marketSymbol.findMany({
    where: { status: "active" },
    orderBy: { symbol: "asc" },
  });
  if (!symbols.length) {
    return 0;
  }

  const prices = await fetchCoinGeckoPrices(
    symbols.map((symbol) => symbol.symbol),
  );
  const capturedAt = new Date();
  let written = 0;

  for (const symbol of symbols) {
    const quote = prices.get(symbol.symbol);
    const price =
      quote?.price ?? (await latestSignalPrice(prisma, symbol.symbol));
    if (!price) {
      continue;
    }

    await prisma.marketPriceSnapshot.create({
      data: {
        symbolId: symbol.id,
        price,
        changeRate: quote?.changeRate ?? null,
        source: quote ? "coingecko" : "signal-fallback",
        capturedAt,
      },
    });
    written += 1;
  }

  return written;
}

async function latestSignalPrice(prisma: PrismaClient, symbol: string) {
  const signal = await prisma.strategySignal.findFirst({
    where: { symbol, status: "active" },
    orderBy: { generatedAt: "desc" },
    select: { currentPriceSnapshot: true },
  });
  return signal?.currentPriceSnapshot ?? null;
}

async function fetchCoinGeckoPrices(symbols: string[]) {
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
