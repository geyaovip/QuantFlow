import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type {
  PaperAccountCopy,
  PaperAccountCreate,
  PaperExecuteSignal,
} from "@quantflow/contracts";

import { PrismaService } from "../../prisma/prisma.service.js";
import {
  PaperAccountInvalidStateError,
  PaperAccountNotFoundError,
  PaperExecutionRejectedError,
  PaperMarketDataStaleError,
} from "../domain/paper-errors.js";
import {
  buildPaperFill,
  computeAccountMetrics,
  decimalToString,
  PAPER_ENGINE_V1,
  quantizeMoney,
  quantizePrice,
  quantizeRatio,
} from "../domain/paper-engine.js";
import {
  isMarketSnapshotStale,
  MARKET_SNAPSHOT_SIGNAL_WINDOW_MS,
  resolveMarketPriceFromSnapshot,
} from "../domain/paper-market.js";
import type {
  AuditContext,
  ListPaperAccountsInput,
  ListPaperSubResourceInput,
  PaginatedPaperAccounts,
  PaperRepository,
} from "../domain/paper-repository.js";

const RISK_DISCLOSURE =
  "QuantFlow 不提供投资建议，不承诺任何收益。所有策略信号仅供参考，加密资产价格波动较大，用户需自行承担交易风险。历史表现不代表未来收益。";

const ACTIVE_ACCOUNT_STATUSES = ["running", "paused"] as const;

@Injectable()
export class PrismaPaperRepository implements PaperRepository {
  constructor(private readonly prisma: PrismaService) {}

  countActiveAccounts(userId: string) {
    return this.prisma.paperAccount.count({
      where: {
        userId,
        deletedAt: null,
        status: { in: [...ACTIVE_ACCOUNT_STATUSES] },
      },
    });
  }

  async listAccounts(userId: string, input: ListPaperAccountsInput) {
    const where = { userId, deletedAt: null };
    const [total, accounts] = await this.prisma.$transaction([
      this.prisma.paperAccount.count({ where }),
      this.prisma.paperAccount.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: { strategy: { select: { name: true } } },
      }),
    ]);

    return {
      total,
      items: accounts.map((account) => mapListItemSummary(account)),
    } satisfies PaginatedPaperAccounts;
  }

  async getAccount(userId: string, accountId: string) {
    const account = await this.findOwnedAccount(userId, accountId);
    return account ? mapDetail(account) : null;
  }

  async createAccount(userId: string, input: PaperAccountCreate) {
    const context = await this.resolveStrategyContext(userId, input);
    const initialBalance = new Prisma.Decimal(input.initialBalance);

    const accountId = await this.prisma.$transaction(async (tx) => {
      const account = await tx.paperAccount.create({
        data: {
          userId,
          strategyId: context.strategy.id,
          strategyVersionId: context.version.id,
          symbol: input.symbol,
          name: input.name,
          initialBalance,
          cashBalance: initialBalance,
          currentEquity: initialBalance,
          peakEquity: initialBalance,
          maxPositionPct: new Prisma.Decimal(input.maxPositionPct),
          maxPositions: input.maxPositions,
          engineVersion: PAPER_ENGINE_V1,
          status: "running",
        },
      });

      await tx.paperPerformancePoint.create({
        data: {
          accountId: account.id,
          equity: initialBalance,
          returnRate: new Prisma.Decimal(0),
          drawdown: new Prisma.Decimal(0),
          positionCount: 0,
        },
      });

      return account.id;
    });

    if (input.signalId) {
      return this.executeSignal(userId, accountId, {
        signalId: input.signalId,
        riskAccepted: true,
      });
    }

    const account = await this.findOwnedAccount(userId, accountId);
    if (!account) {
      throw new PaperAccountNotFoundError();
    }

    return mapDetail(account);
  }

  async pauseAccount(userId: string, accountId: string) {
    const account = await this.requireMutableAccount(userId, accountId);
    if (account.status !== "running") {
      throw new PaperAccountInvalidStateError("仅运行中的模拟盘可以暂停");
    }

    await this.prisma.paperAccount.update({
      where: { id: accountId },
      data: { status: "paused", pausedAt: new Date() },
    });

    return this.requireAccountDetail(userId, accountId);
  }

  async resumeAccount(userId: string, accountId: string) {
    const account = await this.requireMutableAccount(userId, accountId);
    if (account.status !== "paused" && account.status !== "strategy_paused") {
      throw new PaperAccountInvalidStateError("仅已暂停的模拟盘可以恢复");
    }

    await this.assertStrategyRunnable(
      userId,
      account.strategyId,
      account.symbol,
    );

    await this.prisma.paperAccount.update({
      where: { id: accountId },
      data: { status: "running", pausedAt: null },
    });

    return this.requireAccountDetail(userId, accountId);
  }

  async resetAccount(userId: string, accountId: string) {
    const account = await this.requireMutableAccount(userId, accountId);
    if (account.status !== "paused") {
      throw new PaperAccountInvalidStateError("仅已暂停的模拟盘可以重置");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.paperPosition.updateMany({
        where: { accountId, status: "open" },
        data: {
          status: "closed",
          quantity: new Prisma.Decimal(0),
          unrealizedPnl: new Prisma.Decimal(0),
          closedAt: new Date(),
        },
      });

      await tx.paperAccount.update({
        where: { id: accountId },
        data: {
          cashBalance: account.initialBalance,
          currentEquity: account.initialBalance,
          peakEquity: account.initialBalance,
          maxDrawdown: new Prisma.Decimal(0),
          status: "running",
          pausedAt: null,
        },
      });

      await tx.paperPerformancePoint.create({
        data: {
          accountId,
          equity: account.initialBalance,
          returnRate: new Prisma.Decimal(0),
          drawdown: new Prisma.Decimal(0),
          positionCount: 0,
        },
      });

      await tx.paperRiskEvent.create({
        data: {
          accountId,
          type: "account_reset",
          riskLevel: "low",
          message: "模拟盘已重置为初始资金，历史订单与成交记录保留。",
        },
      });
    });

    return this.requireAccountDetail(userId, accountId);
  }

  async endAccount(userId: string, accountId: string) {
    const account = await this.requireMutableAccount(userId, accountId);
    if (account.status !== "running" && account.status !== "paused") {
      throw new PaperAccountInvalidStateError(
        "仅运行中或已暂停的模拟盘可以结束",
      );
    }

    await this.prisma.paperAccount.update({
      where: { id: accountId },
      data: { status: "ended", endedAt: new Date(), pausedAt: null },
    });

    return this.requireAccountDetail(userId, accountId);
  }

  async deleteAccount(userId: string, accountId: string) {
    const account = await this.requireMutableAccount(userId, accountId);
    if (account.status !== "paused" && account.status !== "ended") {
      throw new PaperAccountInvalidStateError(
        "仅已暂停或已结束的模拟盘可以删除",
      );
    }

    await this.prisma.paperAccount.update({
      where: { id: accountId },
      data: { deletedAt: new Date() },
    });
  }

  async copyAccount(
    userId: string,
    accountId: string,
    input: PaperAccountCopy,
  ) {
    const source = await this.requireMutableAccount(userId, accountId);
    const context = await this.resolveStrategyContext(userId, {
      strategyId: source.strategyId,
      symbol: source.symbol,
      name: input.name ?? `${source.name} 副本`,
      initialBalance: decimalToString(source.initialBalance),
      maxPositionPct: decimalToString(source.maxPositionPct),
      maxPositions: source.maxPositions,
      riskDisclosureVersion: "risk-v1",
      riskAccepted: true,
    });

    const initialBalance = source.initialBalance;
    const accountIdNew = await this.prisma.$transaction(async (tx) => {
      const account = await tx.paperAccount.create({
        data: {
          userId,
          strategyId: context.strategy.id,
          strategyVersionId: context.version.id,
          symbol: source.symbol,
          name: input.name ?? `${source.name} 副本`,
          initialBalance,
          cashBalance: initialBalance,
          currentEquity: initialBalance,
          peakEquity: initialBalance,
          maxDrawdown: new Prisma.Decimal(0),
          maxPositionPct: source.maxPositionPct,
          maxPositions: source.maxPositions,
          engineVersion: PAPER_ENGINE_V1,
          status: "running",
        },
      });

      await tx.paperPerformancePoint.create({
        data: {
          accountId: account.id,
          equity: initialBalance,
          returnRate: new Prisma.Decimal(0),
          drawdown: new Prisma.Decimal(0),
          positionCount: 0,
        },
      });

      return account.id;
    });

    return this.requireAccountDetail(userId, accountIdNew);
  }

  async listPositions(
    userId: string,
    accountId: string,
    input: ListPaperSubResourceInput,
  ) {
    await this.assertAccountVisible(userId, accountId);
    const where = { accountId };
    const [total, positions] = await this.prisma.$transaction([
      this.prisma.paperPosition.count({ where }),
      this.prisma.paperPosition.findMany({
        where,
        orderBy: [{ openedAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
    ]);

    return {
      total,
      items: positions.map((position) => ({
        id: position.id,
        symbol: position.symbol,
        side: position.side,
        quantity: decimalToString(position.quantity),
        averagePrice: decimalToString(position.averagePrice),
        markPrice: decimalToString(position.markPrice),
        unrealizedPnl: decimalToString(position.unrealizedPnl),
        status: position.status,
      })),
    };
  }

  async listOrders(
    userId: string,
    accountId: string,
    input: ListPaperSubResourceInput,
  ) {
    await this.assertAccountVisible(userId, accountId);
    const where = { accountId };
    const [total, orders] = await this.prisma.$transaction([
      this.prisma.paperOrder.count({ where }),
      this.prisma.paperOrder.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
    ]);

    return {
      total,
      items: orders.map((order) => ({
        id: order.id,
        signalId: order.signalId,
        side: order.side,
        type: order.type,
        price: order.price ? decimalToString(order.price) : null,
        quantity: decimalToString(order.quantity),
        status: order.status,
        rejectReason: order.rejectReason,
        createdAt: order.createdAt.toISOString(),
      })),
    };
  }

  async listTrades(
    userId: string,
    accountId: string,
    input: ListPaperSubResourceInput,
  ) {
    await this.assertAccountVisible(userId, accountId);
    const where = { accountId };
    const [total, trades] = await this.prisma.$transaction([
      this.prisma.paperTrade.count({ where }),
      this.prisma.paperTrade.findMany({
        where,
        orderBy: [{ executedAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: { order: { select: { side: true } } },
      }),
    ]);

    return {
      total,
      items: trades.map((trade) => ({
        id: trade.id,
        side: trade.order.side,
        price: decimalToString(trade.price),
        quantity: decimalToString(trade.quantity),
        fee: decimalToString(trade.fee),
        realizedPnl: decimalToString(trade.realizedPnl),
        executedAt: trade.executedAt.toISOString(),
      })),
    };
  }

  async listPerformance(
    userId: string,
    accountId: string,
    input: ListPaperSubResourceInput,
  ) {
    await this.assertAccountVisible(userId, accountId);
    const where = { accountId };
    const [total, points] = await this.prisma.$transaction([
      this.prisma.paperPerformancePoint.count({ where }),
      this.prisma.paperPerformancePoint.findMany({
        where,
        orderBy: [{ recordedAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
    ]);

    return {
      total,
      items: points.map((point) => ({
        equity: decimalToString(point.equity),
        returnRate: decimalToString(point.returnRate),
        drawdown: decimalToString(point.drawdown),
        positionCount: point.positionCount,
        recordedAt: point.recordedAt.toISOString(),
      })),
    };
  }

  async listRiskEvents(
    userId: string,
    accountId: string,
    input: ListPaperSubResourceInput,
  ) {
    await this.assertAccountVisible(userId, accountId);
    const where = { accountId };
    const [total, events] = await this.prisma.$transaction([
      this.prisma.paperRiskEvent.count({ where }),
      this.prisma.paperRiskEvent.findMany({
        where,
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
    ]);

    return {
      total,
      items: events.map((event) => ({
        id: event.id,
        type: event.type,
        riskLevel: event.riskLevel,
        message: event.message,
        occurredAt: event.occurredAt.toISOString(),
      })),
    };
  }

  async listAdminAccounts(input: ListPaperAccountsInput) {
    const where = { deletedAt: null };
    const [total, accounts] = await this.prisma.$transaction([
      this.prisma.paperAccount.count({ where }),
      this.prisma.paperAccount.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: {
          strategy: { select: { name: true } },
          user: { select: { email: true } },
        },
      }),
    ]);

    return {
      total,
      items: accounts.map((account) => ({
        ...mapListItemSummary(account),
        userId: account.userId,
        userEmail: account.user.email,
      })),
    };
  }

  async getAdminAccount(accountId: string) {
    const account = await this.prisma.paperAccount.findFirst({
      where: { id: accountId, deletedAt: null },
      include: {
        ...accountIncludes,
        user: { select: { email: true } },
      },
    });
    if (!account) {
      return null;
    }

    return {
      ...mapDetail(account),
      userId: account.userId,
      userEmail: account.user.email,
    };
  }

  async adminPauseAccount(accountId: string, context: AuditContext) {
    return this.runAdminStatusChange(
      accountId,
      context,
      "admin_paper_pause",
      "running",
      { status: "paused", pausedAt: new Date() },
      "仅运行中的模拟盘可以暂停",
    );
  }

  async adminResumeAccount(accountId: string, context: AuditContext) {
    return this.runAdminStatusChange(
      accountId,
      context,
      "admin_paper_resume",
      "paused",
      { status: "running", pausedAt: null },
      "仅已暂停的模拟盘可以恢复",
    );
  }

  async adminMarkAbnormal(accountId: string, context: AuditContext) {
    return this.runAdminStatusChange(
      accountId,
      context,
      "admin_paper_mark_abnormal",
      null,
      { status: "data_error" },
      "",
      (account) =>
        account.status === "data_error"
          ? "模拟盘已处于数据异常状态"
          : account.status === "ended"
            ? "已结束的模拟盘不能标记为数据异常"
            : null,
    );
  }

  async executeSignal(
    userId: string,
    accountId: string,
    input: PaperExecuteSignal,
  ) {
    const account = await this.requireMutableAccount(userId, accountId);
    if (account.status !== "running") {
      throw new PaperAccountInvalidStateError(
        "模拟盘未处于运行中，无法执行信号",
      );
    }

    const signal = await this.prisma.strategySignal.findFirst({
      where: {
        id: input.signalId,
        strategyId: account.strategyId,
        status: "active",
        validUntil: { gt: new Date() },
      },
    });
    if (!signal) {
      throw new PaperExecutionRejectedError("信号不存在、已过期或不可执行");
    }

    const side = mapSignalSide(signal.direction);
    if (!side) {
      throw new PaperExecutionRejectedError("观望信号不执行模拟成交");
    }

    const markPriceResult = await this.resolveMarkPriceForSignal(signal);
    if (!markPriceResult.ok) {
      await this.recordRejectedOrder(
        account.id,
        signal.id,
        side,
        markPriceResult.reason,
      );
      if (
        markPriceResult.reason.includes("行情") ||
        markPriceResult.reason.includes("快照")
      ) {
        throw new PaperMarketDataStaleError(markPriceResult.reason);
      }
      throw new PaperExecutionRejectedError(markPriceResult.reason);
    }

    const markPrice = markPriceResult.price;
    const openPosition = account.positions.find(
      (position) =>
        position.status === "open" && position.symbol === signal.symbol,
    );
    const fill = buildPaperFill({
      side,
      symbol: signal.symbol,
      markPrice,
      triggerPrice: signal.triggerPrice,
      suggestedPositionPct: signal.suggestedPositionPct,
      maxPositionPct: account.maxPositionPct,
      cashBalance: account.cashBalance,
      positionQuantity: openPosition?.quantity ?? new Prisma.Decimal(0),
      averagePrice: openPosition?.averagePrice ?? new Prisma.Decimal(0),
    });

    if (!fill.ok) {
      await this.recordRejectedOrder(account.id, signal.id, side, fill.reason);
      throw new PaperExecutionRejectedError(fill.reason);
    }

    if (
      side === "buy" &&
      account.positions.filter((position) => position.status === "open")
        .length >= account.maxPositions &&
      !openPosition
    ) {
      const reason = "已达到最大持仓数量上限";
      await this.recordRejectedOrder(account.id, signal.id, side, reason);
      throw new PaperExecutionRejectedError(reason);
    }

    await this.prisma.$transaction(async (tx) => {
      const order = await tx.paperOrder.create({
        data: {
          accountId: account.id,
          signalId: signal.id,
          side,
          type: "market",
          price: fill.fillPrice,
          quantity: fill.quantity,
          status: "filled",
          engineSnapshot: {
            engineVersion: PAPER_ENGINE_V1,
            slippageRate: fill.slippageRate.toFixed(),
            feeRate: "0.001",
            markPrice: decimalToString(markPrice),
            marketSnapshotId: markPriceResult.snapshotId,
            capturedAt: markPriceResult.capturedAt.toISOString(),
          },
        },
      });

      await tx.paperTrade.create({
        data: {
          accountId: account.id,
          orderId: order.id,
          price: fill.fillPrice,
          quantity: fill.quantity,
          fee: fill.fee,
          realizedPnl: fill.realizedPnl,
        },
      });

      if (side === "buy") {
        const cashBalance = quantizeMoney(
          account.cashBalance.sub(fill.notional).sub(fill.fee),
        );
        if (openPosition) {
          const totalQuantity = openPosition.quantity.add(fill.quantity);
          const averagePrice = quantizePrice(
            openPosition.quantity
              .mul(openPosition.averagePrice)
              .add(fill.quantity.mul(fill.fillPrice))
              .div(totalQuantity),
          );
          await tx.paperPosition.update({
            where: { id: openPosition.id },
            data: {
              quantity: totalQuantity,
              averagePrice,
              markPrice,
              unrealizedPnl: quantizeMoney(
                totalQuantity.mul(markPrice.sub(averagePrice)),
              ),
            },
          });
          await this.refreshAccountState(tx, account.id, cashBalance);
          return;
        }

        await tx.paperPosition.create({
          data: {
            accountId: account.id,
            symbol: signal.symbol,
            side: "buy",
            quantity: fill.quantity,
            averagePrice: fill.fillPrice,
            markPrice,
            unrealizedPnl: quantizeMoney(
              fill.quantity.mul(markPrice.sub(fill.fillPrice)),
            ),
            status: "open",
          },
        });
        await this.refreshAccountState(tx, account.id, cashBalance);
        return;
      }

      const remaining = openPosition!.quantity.sub(fill.quantity);
      const cashBalance = quantizeMoney(
        account.cashBalance.add(fill.notional).sub(fill.fee),
      );
      if (remaining.lte(0)) {
        await tx.paperPosition.update({
          where: { id: openPosition!.id },
          data: {
            quantity: new Prisma.Decimal(0),
            status: "closed",
            closedAt: new Date(),
            markPrice,
            unrealizedPnl: new Prisma.Decimal(0),
          },
        });
      } else {
        await tx.paperPosition.update({
          where: { id: openPosition!.id },
          data: {
            quantity: remaining,
            markPrice,
            unrealizedPnl: quantizeMoney(
              remaining.mul(markPrice.sub(openPosition!.averagePrice)),
            ),
          },
        });
      }

      await this.refreshAccountState(tx, account.id, cashBalance);
    });

    return this.requireAccountDetail(userId, accountId);
  }

  private async resolveStrategyContext(
    userId: string,
    input: PaperAccountCreate,
  ) {
    const subscription = await this.prisma.userStrategySubscription.findFirst({
      where: {
        userId,
        strategyId: input.strategyId,
        status: "active",
      },
    });
    if (!subscription) {
      throw new PaperExecutionRejectedError("需要先订阅策略信号");
    }

    const strategy = await this.prisma.strategy.findFirst({
      where: {
        id: input.strategyId,
        status: "active",
        deletedAt: null,
        supportsPaperTrading: true,
      },
      include: {
        versions: { orderBy: { version: "desc" }, take: 1 },
      },
    });
    if (!strategy?.versions[0]) {
      throw new PaperAccountNotFoundError();
    }

    if (!strategy.versions[0].symbols.includes(input.symbol)) {
      throw new PaperExecutionRejectedError("该策略不支持所选币种");
    }

    return { strategy, version: strategy.versions[0] };
  }

  private async recordRejectedOrder(
    accountId: string,
    signalId: string,
    side: "buy" | "sell",
    reason: string,
  ) {
    await this.prisma.$transaction([
      this.prisma.paperOrder.create({
        data: {
          accountId,
          signalId,
          side,
          type: "market",
          quantity: new Prisma.Decimal(0),
          status: "rejected",
          rejectReason: reason,
        },
      }),
      this.prisma.paperRiskEvent.create({
        data: {
          accountId,
          type: "execution_rejected",
          riskLevel: "medium",
          message: reason,
        },
      }),
    ]);
  }

  private async refreshAccountState(
    tx: Prisma.TransactionClient,
    accountId: string,
    cashBalance: Prisma.Decimal,
  ) {
    const account = await tx.paperAccount.findUniqueOrThrow({
      where: { id: accountId },
      include: {
        positions: { where: { status: "open" } },
      },
    });

    const metrics = computeAccountMetrics({
      initialBalance: account.initialBalance,
      cashBalance,
      openPositions: account.positions.map((position) => ({
        quantity: position.quantity,
        markPrice: position.markPrice,
      })),
      peakEquity: account.peakEquity,
    });
    const maxDrawdown = Prisma.Decimal.max(
      account.maxDrawdown,
      metrics.drawdown,
    );

    await tx.paperAccount.update({
      where: { id: accountId },
      data: {
        cashBalance,
        currentEquity: metrics.equity,
        peakEquity: metrics.peakEquity,
        maxDrawdown,
      },
    });

    await tx.paperPerformancePoint.create({
      data: {
        accountId,
        equity: metrics.equity,
        returnRate: metrics.returnRate,
        drawdown: metrics.drawdown,
        positionCount: metrics.positionCount,
      },
    });
  }

  private async assertStrategyRunnable(
    userId: string,
    strategyId: string,
    symbol: string,
  ) {
    const subscription = await this.prisma.userStrategySubscription.findFirst({
      where: { userId, strategyId, status: "active" },
    });
    if (!subscription) {
      throw new PaperExecutionRejectedError("需要先订阅策略信号");
    }

    const strategy = await this.prisma.strategy.findFirst({
      where: {
        id: strategyId,
        status: "active",
        deletedAt: null,
        supportsPaperTrading: true,
      },
    });
    if (!strategy) {
      throw new PaperExecutionRejectedError("策略已暂停或不可用于模拟盘");
    }

    const snapshot = await this.prisma.marketSymbol.findUnique({
      where: { symbol },
      include: {
        priceSnapshots: { orderBy: { capturedAt: "desc" }, take: 1 },
      },
    });
    const latest = snapshot?.priceSnapshots[0];
    if (!latest || isMarketSnapshotStale(latest.capturedAt)) {
      throw new PaperMarketDataStaleError();
    }
  }

  private async assertAccountVisible(userId: string, accountId: string) {
    const account = await this.prisma.paperAccount.findFirst({
      where: { id: accountId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!account) {
      throw new PaperAccountNotFoundError();
    }
  }

  private async resolveMarkPriceForSignal(signal: {
    symbol: string;
    generatedAt: Date;
    currentPriceSnapshot: Prisma.Decimal;
  }) {
    const now = new Date();
    const signalAgeMs = now.getTime() - signal.generatedAt.getTime();

    if (signalAgeMs <= MARKET_SNAPSHOT_SIGNAL_WINDOW_MS) {
      const snapshot = await this.recordMarketSnapshot(
        signal.symbol,
        signal.currentPriceSnapshot,
        now,
      );
      return resolveMarketPriceFromSnapshot({
        price: snapshot.price,
        snapshotId: snapshot.id,
        capturedAt: snapshot.capturedAt,
        signalGeneratedAt: signal.generatedAt,
        now,
      });
    }

    const marketSymbol = await this.prisma.marketSymbol.findUnique({
      where: { symbol: signal.symbol },
    });
    if (!marketSymbol) {
      return { ok: false as const, reason: "行情币种未配置" };
    }

    const snapshot = await this.prisma.marketPriceSnapshot.findFirst({
      where: {
        symbolId: marketSymbol.id,
        capturedAt: {
          gte: signal.generatedAt,
          lte: new Date(
            signal.generatedAt.getTime() + MARKET_SNAPSHOT_SIGNAL_WINDOW_MS,
          ),
        },
      },
      orderBy: { capturedAt: "asc" },
    });
    if (!snapshot) {
      return { ok: false as const, reason: "未找到信号后的有效行情快照" };
    }

    return resolveMarketPriceFromSnapshot({
      price: snapshot.price,
      snapshotId: snapshot.id,
      capturedAt: snapshot.capturedAt,
      signalGeneratedAt: signal.generatedAt,
      now,
    });
  }

  private async recordMarketSnapshot(
    symbol: string,
    price: Prisma.Decimal,
    capturedAt: Date,
  ) {
    let marketSymbol = await this.prisma.marketSymbol.findUnique({
      where: { symbol },
    });
    if (!marketSymbol) {
      const base = symbol.replace("USDT", "");
      marketSymbol = await this.prisma.marketSymbol.create({
        data: {
          symbol,
          baseAsset: base,
          quoteAsset: "USDT",
        },
      });
    }

    return this.prisma.marketPriceSnapshot.create({
      data: {
        symbolId: marketSymbol.id,
        price,
        source: "signal-exec",
        capturedAt,
      },
    });
  }

  private async runAdminStatusChange(
    accountId: string,
    context: AuditContext,
    action: string,
    requiredStatus: AccountRecord["status"] | null,
    data: Prisma.PaperAccountUpdateInput,
    invalidMessage: string,
    customInvalid?: (account: {
      status: AccountRecord["status"];
    }) => string | null,
  ) {
    const account = await this.prisma.paperAccount.findFirst({
      where: { id: accountId, deletedAt: null },
      include: {
        strategy: { select: { name: true } },
        user: { select: { email: true } },
      },
    });
    if (!account) {
      throw new PaperAccountNotFoundError();
    }

    const customError = customInvalid?.(account);
    if (customError) {
      throw new PaperAccountInvalidStateError(customError);
    }
    if (requiredStatus && account.status !== requiredStatus) {
      throw new PaperAccountInvalidStateError(invalidMessage);
    }

    const before = { status: account.status, pausedAt: account.pausedAt };
    const after = {
      status: typeof data.status === "string" ? data.status : before.status,
      pausedAt:
        data.pausedAt === null
          ? null
          : data.pausedAt instanceof Date
            ? data.pausedAt
            : before.pausedAt,
    };
    await this.prisma.$transaction(async (tx) => {
      await tx.paperAccount.update({ where: { id: accountId }, data });
      await tx.adminAuditLog.create({
        data: {
          actorAdminId: context.actorAdminId,
          action,
          resourceType: "paper_account",
          resourceId: accountId,
          reason: context.reason,
          before,
          after,
          ip: context.ip,
          userAgent: context.userAgent,
        },
      });
    });

    const updated = await this.prisma.paperAccount.findFirstOrThrow({
      where: { id: accountId },
      include: {
        strategy: { select: { name: true } },
        user: { select: { email: true } },
      },
    });

    return {
      ...mapListItemSummary(updated),
      userId: updated.userId,
      userEmail: updated.user.email,
    };
  }

  private findOwnedAccount(userId: string, accountId: string) {
    return this.prisma.paperAccount.findFirst({
      where: { id: accountId, userId, deletedAt: null },
      include: accountIncludes,
    });
  }

  private async requireMutableAccount(userId: string, accountId: string) {
    const account = await this.findOwnedAccount(userId, accountId);
    if (!account) {
      throw new PaperAccountNotFoundError();
    }
    return account;
  }

  private async requireAccountDetail(userId: string, accountId: string) {
    const account = await this.findOwnedAccount(userId, accountId);
    if (!account) {
      throw new PaperAccountNotFoundError();
    }
    return mapDetail(account);
  }
}

const accountIncludes = {
  strategy: { select: { name: true } },
  positions: { orderBy: { openedAt: "desc" as const } },
  trades: {
    orderBy: { executedAt: "desc" as const },
    take: 20,
    include: { order: { select: { side: true } } },
  },
  performancePoints: {
    orderBy: { recordedAt: "desc" as const },
    take: 30,
  },
  riskEvents: {
    orderBy: { occurredAt: "desc" as const },
    take: 10,
  },
} as const;

type AccountRecord = NonNullable<
  Awaited<ReturnType<PrismaPaperRepository["findOwnedAccount"]>>
>;

function mapListItemSummary(account: {
  id: string;
  name: string;
  symbol: string;
  strategyId: string;
  strategy: { name: string };
  status: AccountRecord["status"];
  initialBalance: Prisma.Decimal;
  currentEquity: Prisma.Decimal;
  peakEquity: Prisma.Decimal;
  maxDrawdown: Prisma.Decimal;
  startedAt: Date;
}) {
  const returnRate = account.initialBalance.lte(0)
    ? new Prisma.Decimal(0)
    : quantizeRatio(
        account.currentEquity
          .sub(account.initialBalance)
          .div(account.initialBalance),
      );

  return {
    id: account.id,
    name: account.name,
    symbol: account.symbol,
    strategyId: account.strategyId,
    strategyName: account.strategy.name,
    status: account.status,
    initialBalance: decimalToString(account.initialBalance),
    currentEquity: decimalToString(account.currentEquity),
    returnRate: decimalToString(returnRate),
    maxDrawdown: decimalToString(account.maxDrawdown),
    startedAt: account.startedAt.toISOString(),
    isSimulated: true as const,
  };
}

function mapDetail(account: AccountRecord) {
  return {
    ...mapListItemSummary(account),
    cashBalance: decimalToString(account.cashBalance),
    maxPositionPct: decimalToString(account.maxPositionPct),
    maxPositions: account.maxPositions,
    engineVersion: account.engineVersion,
    positions: account.positions.map((position) => ({
      id: position.id,
      symbol: position.symbol,
      side: position.side,
      quantity: decimalToString(position.quantity),
      averagePrice: decimalToString(position.averagePrice),
      markPrice: decimalToString(position.markPrice),
      unrealizedPnl: decimalToString(position.unrealizedPnl),
      status: position.status,
    })),
    recentTrades: account.trades.map((trade) => ({
      id: trade.id,
      side: trade.order.side,
      price: decimalToString(trade.price),
      quantity: decimalToString(trade.quantity),
      fee: decimalToString(trade.fee),
      realizedPnl: decimalToString(trade.realizedPnl),
      executedAt: trade.executedAt.toISOString(),
    })),
    performance: account.performancePoints
      .slice()
      .reverse()
      .map((point) => ({
        equity: decimalToString(point.equity),
        returnRate: decimalToString(point.returnRate),
        drawdown: decimalToString(point.drawdown),
        positionCount: point.positionCount,
        recordedAt: point.recordedAt.toISOString(),
      })),
    riskEvents: account.riskEvents.map((event) => ({
      id: event.id,
      type: event.type,
      riskLevel: event.riskLevel,
      message: event.message,
      occurredAt: event.occurredAt.toISOString(),
    })),
    riskDisclosure: RISK_DISCLOSURE,
  };
}

function mapSignalSide(direction: string): "buy" | "sell" | null {
  if (direction === "buy") {
    return "buy";
  }
  if (direction === "sell") {
    return "sell";
  }
  return null;
}
