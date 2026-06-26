import { Inject, Injectable, forwardRef } from "@nestjs/common";

import type {
  AdminStrategyAction,
  AdminStrategyCreate,
  AdminStrategyDetailResponse,
  AdminStrategyListResponse,
  SignalDetailResponse,
  SignalListResponse,
  StrategySubscriptionListResponse,
  StrategySubscriptionResponse,
  StrategyDetailResponse,
  StrategyListResponse,
} from "@quantflow/contracts";

import {
  SignalNotFoundError,
  StrategyNotFoundError,
  StrategySubscriptionLimitError,
} from "../domain/strategy-errors.js";
import { MembershipService } from "../../membership/application/membership.service.js";
import {
  STRATEGY_REPOSITORY,
  type AuditContext,
  type ListSignalsInput,
  type ListStrategiesInput,
  type StrategyRepository,
} from "../domain/strategy-repository.js";

export const USER_DEFAULT_PAGE_SIZE = 20;
export const API_MAX_PAGE_SIZE = 100;

@Injectable()
export class StrategyService {
  constructor(
    @Inject(STRATEGY_REPOSITORY)
    private readonly repository: StrategyRepository,
    @Inject(forwardRef(() => MembershipService))
    private readonly membershipService: MembershipService,
  ) {}

  async listStrategies(
    input: Partial<ListStrategiesInput>,
    userId?: string,
  ): Promise<StrategyListResponse> {
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
    const strategy = await this.repository.findActiveStrategy(
      identifier,
      userId,
    );
    if (!strategy) {
      throw new StrategyNotFoundError();
    }

    return { data: strategy };
  }

  async listSignals(
    input: Partial<ListSignalsInput>,
    userId?: string,
  ): Promise<SignalListResponse> {
    const page = normalizePage(input.page);
    const pageSize = normalizePageSize(input.pageSize);
    const result = await this.repository.listActiveSignals({
      page,
      pageSize,
      userId,
      direction: input.direction,
      status: input.status,
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
    const signal = await this.repository.findVisibleSignal(signalId, userId);
    if (!signal) {
      throw new SignalNotFoundError();
    }

    return { data: signal };
  }

  async subscribeToStrategy(
    userId: string,
    strategyId: string,
  ): Promise<StrategySubscriptionResponse> {
    const entitlements = await this.membershipService.getEntitlements(userId);
    const activeCount = await this.repository.countActiveSubscriptions(userId);

    if (activeCount >= entitlements.strategySubscriptionsMax) {
      const strategy = await this.repository.findActiveStrategy(
        strategyId,
        userId,
      );
      if (!strategy?.isSubscribed) {
        throw new StrategySubscriptionLimitError();
      }
    }

    return {
      data: await this.repository.subscribeToStrategy(userId, strategyId),
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

  pauseStrategy(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ) {
    return this.repository.pauseStrategy(strategyId, input, context);
  }

  delistStrategy(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ) {
    return this.repository.delistStrategy(strategyId, input, context);
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
