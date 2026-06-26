import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type {
  MarketSymbolDetailResponse,
  MarketSymbolListResponse,
} from "@quantflow/contracts";

import { PrismaService } from "../../prisma/prisma.service.js";
import {
  fetchCoinGeckoPrices,
  isMarketSnapshotStale,
} from "../domain/market-snapshot.js";

@Injectable()
export class MarketService {
  constructor(private readonly prisma: PrismaService) {}

  async listSymbols(): Promise<MarketSymbolListResponse> {
    const symbols = await this.prisma.marketSymbol.findMany({
      where: { status: "active" },
      orderBy: { symbol: "asc" },
      include: {
        priceSnapshots: {
          orderBy: { capturedAt: "desc" },
          take: 1,
        },
      },
    });

    return {
      data: symbols.map((symbol) =>
        mapSnapshot(symbol.symbol, symbol.priceSnapshots[0]),
      ),
    };
  }

  async getSymbol(symbol: string): Promise<MarketSymbolDetailResponse | null> {
    const record = await this.prisma.marketSymbol.findFirst({
      where: { symbol, status: "active" },
      include: {
        priceSnapshots: {
          orderBy: { capturedAt: "desc" },
          take: 1,
        },
      },
    });
    if (!record) {
      return null;
    }

    return {
      data: mapSnapshot(record.symbol, record.priceSnapshots[0]),
    };
  }

  async refreshSnapshots() {
    const symbols = await this.prisma.marketSymbol.findMany({
      where: { status: "active" },
      orderBy: { symbol: "asc" },
    });
    if (!symbols.length) {
      return 0;
    }

    const symbolCodes = symbols.map((symbol) => symbol.symbol);
    let prices = new Map<
      string,
      { price: Prisma.Decimal; changeRate: Prisma.Decimal | null }
    >();

    try {
      prices = await fetchCoinGeckoPrices(symbolCodes);
    } catch {
      prices = new Map();
    }

    const capturedAt = new Date();
    let written = 0;

    for (const symbol of symbols) {
      const quote = prices.get(symbol.symbol);
      const price =
        quote?.price ?? (await this.latestSignalPrice(symbol.symbol));
      if (!price) {
        continue;
      }

      await this.prisma.marketPriceSnapshot.create({
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

  private async latestSignalPrice(symbol: string) {
    const signal = await this.prisma.strategySignal.findFirst({
      where: { symbol, status: "active" },
      orderBy: { generatedAt: "desc" },
      select: { currentPriceSnapshot: true },
    });
    return signal?.currentPriceSnapshot ?? null;
  }
}

function mapSnapshot(
  symbol: string,
  snapshot?: {
    price: Prisma.Decimal;
    changeRate: Prisma.Decimal | null;
    source: string;
    capturedAt: Date;
  },
) {
  if (!snapshot) {
    return {
      symbol,
      price: null,
      changeRate: null,
      source: null,
      capturedAt: null,
      isStale: true,
    };
  }

  return {
    symbol,
    price: snapshot.price.toFixed(),
    changeRate: snapshot.changeRate?.toFixed() ?? null,
    source: snapshot.source,
    capturedAt: snapshot.capturedAt.toISOString(),
    isStale: isMarketSnapshotStale(snapshot.capturedAt),
  };
}
