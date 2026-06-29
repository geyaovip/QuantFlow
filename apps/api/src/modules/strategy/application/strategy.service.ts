import { Inject, Injectable, forwardRef } from "@nestjs/common";

import type {
  AdminStrategyAction,
  AdminStrategyCreate,
  AdminStrategyDetailResponse,
  AdminStrategyListResponse,
  SignalDetailResponse,
  SignalListResponse,
  StrategySubscribe,
  StrategySubscriptionListResponse,
  StrategySubscriptionResponse,
  StrategyDetail,
  StrategyDetailResponse,
  StrategyListResponse,
  UserEntitlements,
} from "@quantflow/contracts";

import {
  signalDelayMinutes,
  tierMeetsRequired,
} from "../../membership/domain/tier-access.js";
import { MembershipService } from "../../membership/application/membership.service.js";
import { RiskAcceptanceService } from "../../membership/application/risk-acceptance.service.js";
import { NotificationService } from "../../notification/application/notification.service.js";
import {
  SignalNotFoundError,
  StrategyNotFoundError,
  StrategyRiskNotAcceptedError,
  StrategySubscriptionLimitError,
  StrategyTierAccessError,
} from "../domain/strategy-errors.js";
import {
  STRATEGY_REPOSITORY,
  type AuditContext,
  type ListSignalsInput,
  type ListStrategiesInput,
  type StrategyRepository,
} from "../domain/strategy-repository.js";

export const USER_DEFAULT_PAGE_SIZE = 20;
export const API_MAX_PAGE_SIZE = 100;

const ANONYMOUS_ENTITLEMENTS: UserEntitlements = {
  tier: "free",
  planName: "Free",
  strategySubscriptionsMax: 0,
  paperAccountsMax: 0,
  historyDays: 30,
};

@Injectable()
export class StrategyService {
  constructor(
    @Inject(STRATEGY_REPOSITORY)
    private readonly repository: StrategyRepository,
    @Inject(forwardRef(() => MembershipService))
    private readonly membershipService: MembershipService,
    private readonly riskAcceptanceService: RiskAcceptanceService,
    private readonly notificationService: NotificationService,
  ) {}

  async listStrategies(
    input: Partial<ListStrategiesInput>,
    userId?: string,
  ): Promise<StrategyListResponse> {
    const entitlements = await this.resolveEntitlements(userId);
    const page = normalizePage(input.page);
    const pageSize = normalizePageSize(input.pageSize);
    const result = await this.repository.listActiveStrategies(
      {
        page,
        pageSize,
        riskLevel: input.riskLevel,
        type: input.type,
        symbol: input.symbol,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
        period: input.period,
        maxTier: entitlements.tier,
        paperEnabled: input.paperEnabled,
        access: input.access,
        maxDrawdownLte: input.maxDrawdownLte,
      },
      userId,
    );

    return {
      data: result.items,
      pagination: buildPagination(page, pageSize, result.total),
    };
  }

  async getStrategy(
    identifier: string,
    userId?: string,
  ): Promise<StrategyDetailResponse> {
    const entitlements = await this.resolveEntitlements(userId);
    const strategy = await this.repository.findActiveStrategy(
      identifier,
      userId,
    );
    if (!strategy) {
      throw new StrategyNotFoundError();
    }
    if (!tierMeetsRequired(entitlements.tier, strategy.requiredTier)) {
      throw new StrategyTierAccessError(strategy.requiredTier);
    }

    return { data: applyDetailAccess(strategy, entitlements) };
  }

  async listSignals(
    input: Partial<ListSignalsInput>,
    userId?: string,
  ): Promise<SignalListResponse> {
    const entitlements = await this.resolveEntitlements(userId);
    const page = normalizePage(input.page);
    const pageSize = normalizePageSize(input.pageSize);
    const result = await this.repository.listActiveSignals({
      page,
      pageSize,
      userId,
      direction: input.direction,
      status: input.status,
      usedInPaper: input.usedInPaper,
      ...buildSignalAccess(entitlements),
    });

    return {
      data: result.items,
      pagination: buildPagination(page, pageSize, result.total),
    };
  }

  async getSignal(
    signalId: string,
    userId?: string,
  ): Promise<SignalDetailResponse> {
    const entitlements = await this.resolveEntitlements(userId);
    const signal = await this.repository.findVisibleSignal(signalId, userId, {
      ...buildSignalAccess(entitlements),
    });
    if (!signal) {
      throw new SignalNotFoundError();
    }

    return { data: signal };
  }

  async subscribeToStrategy(
    userId: string,
    strategyId: string,
    input: StrategySubscribe,
  ): Promise<StrategySubscriptionResponse> {
    if (!input.riskAccepted) {
      throw new StrategyRiskNotAcceptedError();
    }

    const entitlements = await this.membershipService.getEntitlements(userId);
    const strategy = await this.repository.findActiveStrategy(
      strategyId,
      userId,
    );
    if (!strategy) {
      throw new StrategyNotFoundError();
    }
    if (!tierMeetsRequired(entitlements.tier, strategy.requiredTier)) {
      throw new StrategyTierAccessError(strategy.requiredTier);
    }

    const activeCount = await this.repository.countActiveSubscriptions(userId);
    if (
      activeCount >= entitlements.strategySubscriptionsMax &&
      !strategy.isSubscribed
    ) {
      throw new StrategySubscriptionLimitError();
    }

    return {
      data: await this.repository
        .subscribeToStrategy(userId, strategyId)
        .then(async (subscription) => {
          await this.riskAcceptanceService.record(userId, "strategy_subscribe");
          return subscription;
        }),
    };
  }

  async cancelStrategySubscription(
    userId: string,
    strategyId: string,
  ): Promise<StrategySubscriptionResponse> {
    const subscription = await this.repository.cancelStrategySubscription(
      userId,
      strategyId,
    );
    if (!subscription) {
      throw new StrategyNotFoundError();
    }

    return { data: subscription };
  }

  async listSubscribedStrategies(
    input: Partial<ListStrategiesInput>,
    userId: string,
  ): Promise<StrategySubscriptionListResponse> {
    const page = normalizePage(input.page);
    const pageSize = normalizePageSize(input.pageSize);
    const result = await this.repository.listSubscribedStrategies(
      {
        page,
        pageSize,
        riskLevel: input.riskLevel,
      },
      userId,
    );

    return {
      data: result.items,
      pagination: buildPagination(page, pageSize, result.total),
    };
  }

  async listAdminStrategies(
    input: Partial<ListStrategiesInput>,
  ): Promise<AdminStrategyListResponse> {
    const page = normalizePage(input.page);
    const pageSize = normalizePageSize(input.pageSize);
    return this.repository.listAdminStrategies({ page, pageSize });
  }

  createAdminStrategy(
    input: AdminStrategyCreate,
    context: AuditContext,
  ): Promise<AdminStrategyDetailResponse> {
    return this.repository.createAdminStrategy(input, context);
  }

  submitStrategyReview(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ) {
    return this.repository.submitStrategyReview(strategyId, input, context);
  }

  approveStrategy(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ) {
    return this.repository.approveStrategy(strategyId, input, context);
  }

  rejectStrategy(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ) {
    return this.repository.rejectStrategy(strategyId, input, context);
  }

  async pauseStrategy(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ) {
    const result = await this.repository.pauseStrategy(
      strategyId,
      input,
      context,
    );
    await this.notificationService.notifyStrategyPausedPaperAccounts(
      strategyId,
      result.data.name,
    );
    return result;
  }

  async delistStrategy(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ) {
    const result = await this.repository.delistStrategy(
      strategyId,
      input,
      context,
    );
    await this.notificationService.notifyStrategyPausedPaperAccounts(
      strategyId,
      result.data.name,
    );
    return result;
  }

  listAdminSignals(input: ListSignalsInput) {
    const page = normalizePage(input.page);
    const pageSize = normalizePageSize(input.pageSize);
    return this.repository
      .listAdminSignals({ ...input, page, pageSize })
      .then((result) => ({
        data: result.items,
        pagination: buildPagination(page, pageSize, result.total),
      }));
  }

  async cancelAdminSignal(
    signalId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ) {
    const data = await this.repository.cancelAdminSignal(
      signalId,
      input,
      context,
    );
    return { data };
  }

  async markAdminSignalAbnormal(
    signalId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ) {
    const data = await this.repository.markAdminSignalAbnormal(
      signalId,
      input,
      context,
    );
    return { data };
  }

  async repushAdminSignal(
    signalId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ) {
    const data = await this.repository.repushAdminSignal(
      signalId,
      input,
      context,
    );
    await this.notificationService.notifySignalSubscribers(signalId);
    return { data };
  }

  private async resolveEntitlements(userId?: string) {
    if (!userId) {
      return ANONYMOUS_ENTITLEMENTS;
    }

    return this.membershipService.getEntitlements(userId);
  }
}

function normalizePage(page: number | undefined) {
  return Number.isInteger(page) && page && page > 0 ? page : 1;
}

function normalizePageSize(pageSize: number | undefined) {
  if (!Number.isInteger(pageSize) || !pageSize || pageSize < 1) {
    return USER_DEFAULT_PAGE_SIZE;
  }

  return Math.min(pageSize, API_MAX_PAGE_SIZE);
}

function buildPagination(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function buildSignalAccess(entitlements: UserEntitlements) {
  const now = Date.now();
  const delayMinutes = signalDelayMinutes(entitlements.tier);

  return {
    historySince: new Date(now - entitlements.historyDays * 86_400_000),
    signalVisibleBefore:
      delayMinutes > 0 ? new Date(now - delayMinutes * 60_000) : undefined,
  };
}

function applyDetailAccess(
  strategy: StrategyDetail,
  entitlements: UserEntitlements,
): StrategyDetail {
  const access = buildSignalAccess(entitlements);

  return {
    ...strategy,
    recentSignals: strategy.recentSignals.filter((signal) =>
      isSignalAccessible(signal.generatedAt, access),
    ),
  };
}

function isSignalAccessible(
  generatedAt: string,
  access: Pick<ListSignalsInput, "historySince" | "signalVisibleBefore">,
) {
  const timestamp = new Date(generatedAt).getTime();
  if (access.historySince && timestamp < access.historySince.getTime()) {
    return false;
  }
  if (
    access.signalVisibleBefore &&
    timestamp > access.signalVisibleBefore.getTime()
  ) {
    return false;
  }

  return true;
}
