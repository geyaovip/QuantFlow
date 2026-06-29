import { describe, expect, it } from "vitest";

import type {
  SignalDetail,
  SignalListItem,
  StrategyDetail,
  StrategyListItem,
  StrategySubscription,
  UserEntitlements,
} from "@quantflow/contracts";

import {
  StrategyNotFoundError,
  StrategyTierAccessError,
} from "../domain/strategy-errors.js";
import type {
  ListSignalsInput,
  ListStrategiesInput,
  StrategyRepository,
} from "../domain/strategy-repository.js";
import { MembershipService } from "../../membership/application/membership.service.js";
import { StrategyService } from "./strategy.service.js";

const defaultEntitlements: UserEntitlements = {
  tier: "free",
  planName: "Free",
  strategySubscriptionsMax: 3,
  paperAccountsMax: 1,
  historyDays: 30,
};

class MemoryNotificationService {
  async notifyStrategyPausedPaperAccounts() {}
}

class MemoryMembershipService {
  async getEntitlements(): Promise<UserEntitlements> {
    return defaultEntitlements;
  }
}

class MemoryStrategyRepository implements StrategyRepository {
  constructor(
    private readonly strategies: StrategyListItem[],
    private readonly detail: StrategyDetail | null,
    private readonly signals: SignalListItem[],
  ) {}

  async listActiveStrategies(input: ListStrategiesInput) {
    const filtered = input.riskLevel
      ? this.strategies.filter((item) => item.riskLevel === input.riskLevel)
      : this.strategies;
    return {
      total: filtered.length,
      items: filtered.slice(
        (input.page - 1) * input.pageSize,
        input.page * input.pageSize,
      ),
    };
  }

  async findActiveStrategy() {
    return this.detail;
  }

  async listActiveSignals(input: ListSignalsInput) {
    const filtered = input.direction
      ? this.signals.filter((item) => item.direction === input.direction)
      : this.signals;
    return {
      total: filtered.length,
      items: filtered.slice(
        (input.page - 1) * input.pageSize,
        input.page * input.pageSize,
      ),
    };
  }

  async findVisibleSignal(
    signalId?: string,
    userId?: string,
    access?: Pick<ListSignalsInput, "historySince" | "signalVisibleBefore">,
  ): Promise<SignalDetail | null> {
    void signalId;
    void userId;
    void access;
    return this.signals[0]
      ? { ...this.signals[0], riskDisclosure: detail.riskDisclosure }
      : null;
  }

  async subscribeToStrategy(): Promise<StrategySubscription> {
    return {
      strategyId: strategy.id,
      status: "active",
      subscribedAt: "2026-06-26T02:40:00.000Z",
      cancelledAt: null,
    };
  }

  async cancelStrategySubscription(): Promise<StrategySubscription | null> {
    return {
      strategyId: strategy.id,
      status: "cancelled",
      subscribedAt: "2026-06-26T02:40:00.000Z",
      cancelledAt: "2026-06-26T03:40:00.000Z",
    };
  }

  async countActiveSubscriptions() {
    return 0;
  }

  async listSubscribedStrategies(input: ListStrategiesInput) {
    return this.listActiveStrategies(input);
  }

  async listAdminStrategies(input: ListStrategiesInput) {
    return {
      data: (await this.listActiveStrategies(input)).items,
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total: 1,
        totalPages: 1,
      },
    };
  }

  async createAdminStrategy() {
    return { data: detail };
  }

  async submitStrategyReview() {
    return { data: detail };
  }

  async approveStrategy() {
    return { data: detail };
  }

  async rejectStrategy() {
    return { data: detail };
  }

  async pauseStrategy() {
    return { data: detail };
  }

  async delistStrategy() {
    return { data: detail };
  }

  async listAdminSignals() {
    return { total: 1, items: [signal] };
  }

  async cancelAdminSignal() {
    return { ...signal, isSubscribed: false, riskDisclosure: "" };
  }

  async markAdminSignalAbnormal() {
    return { ...signal, isSubscribed: false, riskDisclosure: "" };
  }

  async repushAdminSignal() {
    return { ...signal, isSubscribed: false, riskDisclosure: "" };
  }
}

const strategy: StrategyListItem = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "btc-trend",
  name: "BTC 趋势过滤",
  summary: "观察趋势环境下的模拟信号。",
  type: "trend",
  symbols: ["BTCUSDT"],
  riskLevel: "medium",
  status: "active",
  requiredTier: "free",
  supportsPaperTrading: true,
  metric: {
    period: "ninety_days",
    returnRate: "0.128",
    maxDrawdown: "-0.064",
    winRate: "0.582",
    profitLossRatio: "1.46",
    tradeCount: 67,
    sampleSize: 67,
    dataSource: "test",
    calculatedAt: "2026-06-26T02:40:00.000Z",
  },
  currentSignal: {
    id: "11111111-1111-4111-8111-111111111114",
    direction: "watch",
    status: "active",
    generatedAt: "2026-06-26T02:40:00.000Z",
    validUntil: "2026-06-27T02:40:00.000Z",
  },
  publishedAt: "2026-06-26T02:40:00.000Z",
};

const signal: SignalListItem = {
  id: "11111111-1111-4111-8111-111111111114",
  strategyId: strategy.id,
  strategySlug: strategy.slug,
  strategyName: strategy.name,
  symbol: "BTCUSDT",
  direction: "watch",
  triggerPrice: "64250",
  currentPriceSnapshot: "64580",
  suggestedPositionPct: "0.1",
  stopLossPrice: "61100",
  takeProfitPrice: "68200",
  rationale: "仅用于模拟观察。",
  status: "active",
  riskLevel: "medium",
  generatedAt: "2026-06-26T02:40:00.000Z",
  validUntil: "2026-06-27T02:40:00.000Z",
};

const detail: StrategyDetail = {
  ...strategy,
  version: 1,
  logic: "趋势过滤逻辑",
  suitableMarket: "趋势清晰",
  unsuitableMarket: "震荡反复",
  positionSizing: "单信号不超过 10%",
  stopLossLogic: "跌破阈值",
  takeProfitLogic: "动能衰减",
  failureModes: "突发行情可能失效",
  dataSource: "test",
  riskDisclosure: "QuantFlow 不提供投资建议，不承诺任何收益。",
  canSubscribe: true,
  metrics: [strategy.metric],
  recentSignals: [signal],
};

describe("StrategyService", () => {
  const membershipService =
    new MemoryMembershipService() as unknown as MembershipService;

  function createService(repository: MemoryStrategyRepository) {
    return new StrategyService(
      repository,
      membershipService,
      { record: async () => undefined } as never,
      new MemoryNotificationService() as never,
    );
  }

  it("lists active strategies with normalized pagination", async () => {
    const service = createService(
      new MemoryStrategyRepository([strategy], detail, [signal]),
    );

    await expect(
      service.listStrategies({ pageSize: 1000 }),
    ).resolves.toMatchObject({
      data: [strategy],
      pagination: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    });
  });

  it("returns strategy details or a not found error", async () => {
    const service = createService(
      new MemoryStrategyRepository([strategy], detail, [signal]),
    );
    const missingService = createService(
      new MemoryStrategyRepository([], null, []),
    );

    await expect(service.getStrategy("btc-trend")).resolves.toMatchObject({
      data: { slug: "btc-trend", riskDisclosure: detail.riskDisclosure },
    });
    await expect(missingService.getStrategy("missing")).rejects.toBeInstanceOf(
      StrategyNotFoundError,
    );
  });

  it("lists active signals without trading actions", async () => {
    const service = createService(
      new MemoryStrategyRepository([strategy], detail, [signal]),
    );

    await expect(service.listSignals({ page: 1 })).resolves.toMatchObject({
      data: [{ strategySlug: "btc-trend", status: "active" }],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
  });

  it("filters signals by direction", async () => {
    const sellSignal = { ...signal, id: "222", direction: "sell" as const };
    const service = createService(
      new MemoryStrategyRepository([strategy], detail, [signal, sellSignal]),
    );

    await expect(
      service.listSignals({ direction: "sell" }),
    ).resolves.toMatchObject({
      data: [{ direction: "sell" }],
      pagination: { total: 1 },
    });
  });

  it("blocks strategy details when membership tier is insufficient", async () => {
    const proStrategy = { ...strategy, requiredTier: "pro" as const };
    const proDetail = { ...detail, requiredTier: "pro" as const };
    const service = createService(
      new MemoryStrategyRepository([proStrategy], proDetail, [signal]),
    );

    await expect(service.getStrategy("btc-trend")).rejects.toBeInstanceOf(
      StrategyTierAccessError,
    );
  });
});
