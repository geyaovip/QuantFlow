import { Injectable } from "@nestjs/common";
import {
  Prisma,
  RiskLevel as PrismaRiskLevel,
  StrategyStatus as PrismaStrategyStatus,
} from "@prisma/client";

import type {
  AdminStrategyAction,
  AdminStrategyCreate,
  AdminStrategyDetailResponse,
  AdminStrategyListResponse,
  SignalDetail,
  SignalListItem,
  StrategyDetail,
  StrategyListItem,
  StrategySubscription,
} from "@quantflow/contracts";

import { PrismaService } from "../../prisma/prisma.service.js";
import {
  StrategyInvalidStateError,
  StrategyNotFoundError,
} from "../domain/strategy-errors.js";
import type {
  AuditContext,
  ListSignalsInput,
  ListStrategiesInput,
  PaginatedResult,
  StrategyRepository,
} from "../domain/strategy-repository.js";

const RISK_DISCLOSURE =
  "QuantFlow 不提供投资建议，不承诺任何收益。所有策略信号仅供参考，加密资产价格波动较大，用户需自行承担交易风险。历史表现不代表未来收益。";

type DecimalLike = { toString(): string };

type StrategyVersionRecord = {
  version: number;
  symbols: string[];
  logic: string;
  suitableMarket: string;
  unsuitableMarket: string;
  positionSizing: string;
  stopLossLogic: string;
  takeProfitLogic: string;
  failureModes: string;
  dataSource: string;
};

type StrategyMetricRecord = {
  period: string;
  returnRate: DecimalLike;
  maxDrawdown: DecimalLike;
  winRate: DecimalLike;
  profitLossRatio: DecimalLike;
  tradeCount: number;
  sampleSize: number;
  dataSource: string;
  calculatedAt: Date;
};

type StrategySignalSummaryRecord = {
  id: string;
  direction: string;
  status: string;
  generatedAt: Date;
  validUntil: Date;
};

type StrategyRecord = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  type: string;
  riskLevel: string;
  status: string;
  requiredTier: string;
  supportsPaperTrading: boolean;
  publishedAt: Date | null;
  versions: StrategyVersionRecord[];
  metrics: StrategyMetricRecord[];
  signals: StrategySignalSummaryRecord[];
};

type SignalRecord = {
  id: string;
  strategyId: string;
  strategy: { slug: string; name: string };
  symbol: string;
  direction: string;
  triggerPrice: DecimalLike;
  currentPriceSnapshot: DecimalLike;
  suggestedPositionPct: DecimalLike;
  stopLossPrice: DecimalLike;
  takeProfitPrice: DecimalLike;
  rationale: string;
  status: string;
  riskLevel: string;
  generatedAt: Date;
  validUntil: Date;
};

type SubscriptionRecord = {
  strategyId: string;
  status: string;
  subscribedAt: Date;
  cancelledAt: Date | null;
};

@Injectable()
export class PrismaStrategyRepository implements StrategyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listActiveStrategies(
    input: ListStrategiesInput,
    userId?: string,
  ): Promise<PaginatedResult<StrategyListItem>> {
    const where = activeStrategyWhere(input.riskLevel);
    const [total, strategies] = await this.prisma.$transaction([
      this.prisma.strategy.count({ where }),
      this.prisma.strategy.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: strategyIncludes,
      }),
    ]);
    const subscriptions = await this.findActiveSubscriptionSet(
      userId,
      strategies.map((strategy) => strategy.id),
    );

    return {
      total,
      items: strategies.map((strategy) =>
        mapStrategyListItem(
          strategy as unknown as StrategyRecord,
          subscriptions.has(strategy.id),
        ),
      ),
    };
  }

  async findActiveStrategy(
    identifier: string,
    userId?: string,
  ): Promise<StrategyDetail | null> {
    const strategy = await this.prisma.strategy.findFirst({
      where: {
        OR: isUuid(identifier)
          ? [{ id: identifier }, { slug: identifier }]
          : [{ slug: identifier }],
        ...activeStrategyWhere(),
      },
      include: strategyIncludes,
    });
    if (!strategy) {
      return null;
    }

    const isSubscribed = await this.hasActiveSubscription(userId, strategy.id);
    return mapStrategyDetail(
      strategy as unknown as StrategyRecord,
      isSubscribed,
    );
  }

  async listActiveSignals(
    input: ListSignalsInput,
  ): Promise<PaginatedResult<SignalListItem>> {
    const where = signalWhere(input.userId, input.direction);
    const [total, signals] = await this.prisma.$transaction([
      this.prisma.strategySignal.count({ where }),
      this.prisma.strategySignal.findMany({
        where,
        orderBy: [{ generatedAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: { strategy: { select: { slug: true, name: true } } },
      }),
    ]);

    return {
      total,
      items: signals.map((signal) => ({
        ...mapSignalItem(signal as unknown as SignalRecord),
        isSubscribed: Boolean(input.userId),
      })),
    };
  }

  async findVisibleSignal(
    signalId: string,
    userId?: string,
  ): Promise<SignalDetail | null> {
    const signal = await this.prisma.strategySignal.findFirst({
      where: {
        id: signalId,
        ...signalWhere(userId),
      },
      include: { strategy: { select: { slug: true, name: true } } },
    });

    return signal
      ? {
          ...mapSignalItem(signal as unknown as SignalRecord),
          isSubscribed: Boolean(userId),
          riskDisclosure: RISK_DISCLOSURE,
        }
      : null;
  }

  async subscribeToStrategy(
    userId: string,
    strategyId: string,
  ): Promise<StrategySubscription> {
    const strategy = await this.prisma.strategy.findFirst({
      where: { id: strategyId, ...activeStrategyWhere() },
      select: { id: true },
    });
    if (!strategy) {
      throw new StrategyNotFoundError();
    }

    const subscription = await this.prisma.userStrategySubscription.upsert({
      where: { userId_strategyId: { userId, strategyId } },
      create: { userId, strategyId, status: "active" },
      update: {
        status: "active",
        cancelledAt: null,
        subscribedAt: new Date(),
      },
    });

    return mapSubscription(subscription);
  }

  async cancelStrategySubscription(
    userId: string,
    strategyId: string,
  ): Promise<StrategySubscription | null> {
    const existing = await this.prisma.userStrategySubscription.findUnique({
      where: { userId_strategyId: { userId, strategyId } },
    });
    if (!existing) {
      return null;
    }

    const subscription = await this.prisma.userStrategySubscription.update({
      where: { userId_strategyId: { userId, strategyId } },
      data: { status: "cancelled", cancelledAt: new Date() },
    });

    return mapSubscription(subscription);
  }

  async countActiveSubscriptions(userId: string): Promise<number> {
    return this.prisma.userStrategySubscription.count({
      where: { userId, status: "active" },
    });
  }

  async listSubscribedStrategies(
    input: ListStrategiesInput,
    userId: string,
  ): Promise<PaginatedResult<StrategyListItem>> {
    const where = {
      ...activeStrategyWhere(input.riskLevel),
      subscriptions: { some: { userId, status: "active" as const } },
    } satisfies Prisma.StrategyWhereInput;
    const [total, strategies] = await this.prisma.$transaction([
      this.prisma.strategy.count({ where }),
      this.prisma.strategy.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: strategyIncludes,
      }),
    ]);

    return {
      total,
      items: strategies.map((strategy) =>
        mapStrategyListItem(strategy as unknown as StrategyRecord, true),
      ),
    };
  }

  async listAdminStrategies(
    input: ListStrategiesInput,
  ): Promise<AdminStrategyListResponse> {
    const [total, strategies] = await this.prisma.$transaction([
      this.prisma.strategy.count({}),
      this.prisma.strategy.findMany({
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: strategyIncludes,
      }),
    ]);

    return {
      data: strategies.map((strategy) =>
        mapStrategyListItem(strategy as unknown as StrategyRecord, false),
      ),
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
      },
    };
  }

  async createAdminStrategy(
    input: AdminStrategyCreate,
    context: AuditContext,
  ): Promise<AdminStrategyDetailResponse> {
    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      const strategy = await tx.strategy.create({
        data: {
          slug: input.slug,
          name: input.name,
          summary: input.summary,
          type: input.type,
          riskLevel: input.riskLevel,
          requiredTier: input.requiredTier,
          status: "draft",
          supportsPaperTrading: true,
          versions: {
            create: {
              version: 1,
              symbols: input.symbols,
              logic: input.logic,
              suitableMarket: input.suitableMarket,
              unsuitableMarket: input.unsuitableMarket,
              positionSizing: input.positionSizing,
              stopLossLogic: input.stopLossLogic,
              takeProfitLogic: input.takeProfitLogic,
              failureModes: input.failureModes,
              dataSource: "admin_manual_v1",
            },
          },
        },
        include: { versions: { take: 1, orderBy: { version: "desc" } } },
      });
      const version = strategy.versions[0];
      if (!version) {
        throw new StrategyInvalidStateError("策略版本创建失败");
      }

      await tx.strategyMetric.create({
        data: {
          strategyId: strategy.id,
          strategyVersionId: version.id,
          period: "ninety_days",
          returnRate: new Prisma.Decimal(0),
          maxDrawdown: new Prisma.Decimal(0),
          winRate: new Prisma.Decimal(0),
          profitLossRatio: new Prisma.Decimal(0),
          tradeCount: 0,
          sampleSize: 0,
          dataSource: "admin_manual_v1",
          calculatedAt: now,
        },
      });
      await writeAudit(tx, "strategy.create", strategy.id, context, null, {
        status: strategy.status,
      });
      return strategy.id;
    });

    return this.getAdminStrategyResponse(result);
  }

  submitStrategyReview(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ) {
    return this.transitionStrategy(
      strategyId,
      ["draft"],
      "pending_review",
      "strategy.submit_review",
      input,
      context,
    );
  }

  approveStrategy(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ) {
    return this.transitionStrategy(
      strategyId,
      ["pending_review"],
      "active",
      "strategy.approve",
      input,
      context,
      { publishedAt: new Date() },
    );
  }

  rejectStrategy(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ) {
    return this.transitionStrategy(
      strategyId,
      ["pending_review"],
      "draft",
      "strategy.reject",
      input,
      context,
    );
  }

  pauseStrategy(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ) {
    return this.transitionStrategy(
      strategyId,
      ["active", "risk_watch"],
      "paused",
      "strategy.pause",
      input,
      context,
    );
  }

  delistStrategy(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ) {
    return this.transitionStrategy(
      strategyId,
      ["draft", "pending_review", "active", "paused", "risk_watch"],
      "delisted",
      "strategy.delist",
      input,
      context,
    );
  }

  private async transitionStrategy(
    strategyId: string,
    allowed: PrismaStrategyStatus[],
    status: PrismaStrategyStatus,
    action: string,
    input: AdminStrategyAction,
    context: AuditContext,
    extraData: Partial<{ publishedAt: Date }> = {},
  ): Promise<AdminStrategyDetailResponse> {
    await this.prisma.$transaction(async (tx) => {
      const strategy = await tx.strategy.findUnique({
        where: { id: strategyId },
        select: { id: true, status: true },
      });
      if (!strategy) {
        throw new StrategyNotFoundError();
      }
      if (!allowed.includes(strategy.status)) {
        throw new StrategyInvalidStateError();
      }

      const updated = await tx.strategy.update({
        where: { id: strategyId },
        data: { status, ...extraData },
        select: { id: true, status: true },
      });
      await writeAudit(
        tx,
        action,
        strategyId,
        { ...context, reason: input.reason },
        { status: strategy.status },
        { status: updated.status },
      );
    });

    return this.getAdminStrategyResponse(strategyId);
  }

  private async getAdminStrategyResponse(
    strategyId: string,
  ): Promise<AdminStrategyDetailResponse> {
    const strategy = await this.prisma.strategy.findFirst({
      where: { id: strategyId },
      include: strategyIncludes,
    });
    if (!strategy) {
      throw new StrategyNotFoundError();
    }

    return {
      data: mapStrategyDetail(strategy as unknown as StrategyRecord, false),
    };
  }

  private async findActiveSubscriptionSet(
    userId: string | undefined,
    strategyIds: string[],
  ) {
    if (!userId || strategyIds.length === 0) {
      return new Set<string>();
    }

    const rows = await this.prisma.userStrategySubscription.findMany({
      where: { userId, strategyId: { in: strategyIds }, status: "active" },
      select: { strategyId: true },
    });
    return new Set(rows.map((row) => row.strategyId));
  }

  private async hasActiveSubscription(
    userId: string | undefined,
    strategyId: string,
  ) {
    if (!userId) {
      return false;
    }

    const count = await this.prisma.userStrategySubscription.count({
      where: { userId, strategyId, status: "active" },
    });
    return count > 0;
  }
}

const strategyIncludes = {
  versions: { orderBy: { version: "desc" as const }, take: 1 },
  metrics: {
    where: { period: "ninety_days" as const },
    orderBy: { calculatedAt: "desc" as const },
    take: 1,
  },
  signals: {
    where: { status: "active" as const },
    orderBy: { generatedAt: "desc" as const },
    take: 1,
  },
};

function activeStrategyWhere(riskLevel?: string) {
  return {
    status: "active" as const,
    deletedAt: null,
    ...(riskLevel ? { riskLevel: riskLevel as PrismaRiskLevel } : {}),
    metrics: { some: { period: "ninety_days" as const } },
    versions: { some: {} },
  } satisfies Prisma.StrategyWhereInput;
}

function signalWhere(userId?: string, direction?: string) {
  return {
    status: "active" as const,
    ...(direction ? { direction: direction as "buy" | "sell" | "watch" } : {}),
    strategy: {
      status: "active" as const,
      deletedAt: null,
      ...(userId
        ? { subscriptions: { some: { userId, status: "active" as const } } }
        : {}),
    },
  } satisfies Prisma.StrategySignalWhereInput;
}

function mapStrategyListItem(
  strategy: StrategyRecord,
  isSubscribed: boolean,
): StrategyListItem {
  const version = strategy.versions[0];
  const metric = strategy.metrics[0];
  if (!version || !metric) {
    throw new Error(`strategy ${strategy.slug} is missing version or metric`);
  }

  return {
    id: strategy.id,
    slug: strategy.slug,
    name: strategy.name,
    summary: strategy.summary,
    type: strategy.type as StrategyListItem["type"],
    symbols: version.symbols,
    riskLevel: strategy.riskLevel as StrategyListItem["riskLevel"],
    status: strategy.status as StrategyListItem["status"],
    requiredTier: strategy.requiredTier as StrategyListItem["requiredTier"],
    supportsPaperTrading: strategy.supportsPaperTrading,
    metric: mapMetric(metric),
    currentSignal: strategy.signals[0]
      ? mapSignalSummary(strategy.signals[0])
      : null,
    publishedAt: strategy.publishedAt?.toISOString() ?? null,
    isSubscribed,
    subscriptionStatus: isSubscribed ? "active" : null,
  };
}

function mapStrategyDetail(
  strategy: StrategyRecord,
  isSubscribed: boolean,
): StrategyDetail {
  const version = strategy.versions[0];
  if (!version) {
    throw new Error(`strategy ${strategy.slug} is missing version`);
  }

  return {
    ...mapStrategyListItem(strategy, isSubscribed),
    version: version.version,
    logic: version.logic,
    suitableMarket: version.suitableMarket,
    unsuitableMarket: version.unsuitableMarket,
    positionSizing: version.positionSizing,
    stopLossLogic: version.stopLossLogic,
    takeProfitLogic: version.takeProfitLogic,
    failureModes: version.failureModes,
    dataSource: version.dataSource,
    riskDisclosure: RISK_DISCLOSURE,
    canSubscribe: strategy.status === "active",
  };
}

function mapMetric(metric: StrategyMetricRecord): StrategyListItem["metric"] {
  return {
    period: metric.period as StrategyListItem["metric"]["period"],
    returnRate: metric.returnRate.toString(),
    maxDrawdown: metric.maxDrawdown.toString(),
    winRate: metric.winRate.toString(),
    profitLossRatio: metric.profitLossRatio.toString(),
    tradeCount: metric.tradeCount,
    sampleSize: metric.sampleSize,
    dataSource: metric.dataSource,
    calculatedAt: metric.calculatedAt.toISOString(),
  };
}

function mapSignalSummary(
  signal: StrategySignalSummaryRecord,
): StrategyListItem["currentSignal"] {
  return {
    id: signal.id,
    direction: signal.direction as NonNullable<
      StrategyListItem["currentSignal"]
    >["direction"],
    status: signal.status as NonNullable<
      StrategyListItem["currentSignal"]
    >["status"],
    generatedAt: signal.generatedAt.toISOString(),
    validUntil: signal.validUntil.toISOString(),
  };
}

function mapSignalItem(signal: SignalRecord): SignalListItem {
  return {
    id: signal.id,
    strategyId: signal.strategyId,
    strategySlug: signal.strategy.slug,
    strategyName: signal.strategy.name,
    symbol: signal.symbol,
    direction: signal.direction as SignalListItem["direction"],
    triggerPrice: signal.triggerPrice.toString(),
    currentPriceSnapshot: signal.currentPriceSnapshot.toString(),
    suggestedPositionPct: signal.suggestedPositionPct.toString(),
    stopLossPrice: signal.stopLossPrice.toString(),
    takeProfitPrice: signal.takeProfitPrice.toString(),
    rationale: signal.rationale,
    status: signal.status as SignalListItem["status"],
    riskLevel: signal.riskLevel as SignalListItem["riskLevel"],
    generatedAt: signal.generatedAt.toISOString(),
    validUntil: signal.validUntil.toISOString(),
  };
}

function mapSubscription(
  subscription: SubscriptionRecord,
): StrategySubscription {
  return {
    strategyId: subscription.strategyId,
    status: subscription.status as StrategySubscription["status"],
    subscribedAt: subscription.subscribedAt.toISOString(),
    cancelledAt: subscription.cancelledAt?.toISOString() ?? null,
  };
}

async function writeAudit(
  tx: Prisma.TransactionClient,
  action: string,
  strategyId: string,
  context: AuditContext,
  before: Prisma.InputJsonValue | null,
  after: Prisma.InputJsonValue | null,
) {
  await tx.adminAuditLog.create({
    data: {
      actorAdminId: context.actorAdminId,
      action,
      resourceType: "strategy",
      resourceId: strategyId,
      strategyId,
      reason: context.reason,
      before: before ?? undefined,
      after: after ?? undefined,
      ip: context.ip,
      userAgent: context.userAgent,
    },
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
