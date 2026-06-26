import type {
  AdminStrategyCreate,
  AdminStrategyDetailResponse,
  AdminStrategyListResponse,
  AdminStrategyAction,
  SignalDetail,
  SignalListItem,
  StrategySubscription,
  StrategyDetail,
  StrategyListItem,
} from "@quantflow/contracts";

export const STRATEGY_REPOSITORY = Symbol("STRATEGY_REPOSITORY");

export type ListStrategiesInput = {
  page: number;
  pageSize: number;
  riskLevel?: string;
};

export type ListSignalsInput = {
  page: number;
  pageSize: number;
  userId?: string;
  direction?: string;
};

export type AuditContext = {
  actorAdminId?: string;
  reason: string;
  ip?: string;
  userAgent?: string;
};

export type PaginatedResult<TItem> = {
  items: TItem[];
  total: number;
};

export interface StrategyRepository {
  listActiveStrategies(
    input: ListStrategiesInput,
    userId?: string,
  ): Promise<PaginatedResult<StrategyListItem>>;
  findActiveStrategy(
    identifier: string,
    userId?: string,
  ): Promise<StrategyDetail | null>;
  listActiveSignals(
    input: ListSignalsInput,
  ): Promise<PaginatedResult<SignalListItem>>;
  findVisibleSignal(
    signalId: string,
    userId?: string,
  ): Promise<SignalDetail | null>;
  subscribeToStrategy(
    userId: string,
    strategyId: string,
  ): Promise<StrategySubscription>;
  cancelStrategySubscription(
    userId: string,
    strategyId: string,
  ): Promise<StrategySubscription | null>;
  countActiveSubscriptions(userId: string): Promise<number>;
  listSubscribedStrategies(
    input: ListStrategiesInput,
    userId: string,
  ): Promise<PaginatedResult<StrategyListItem>>;
  listAdminStrategies(
    input: ListStrategiesInput,
  ): Promise<AdminStrategyListResponse>;
  createAdminStrategy(
    input: AdminStrategyCreate,
    context: AuditContext,
  ): Promise<AdminStrategyDetailResponse>;
  submitStrategyReview(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ): Promise<AdminStrategyDetailResponse>;
  approveStrategy(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ): Promise<AdminStrategyDetailResponse>;
  rejectStrategy(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ): Promise<AdminStrategyDetailResponse>;
  pauseStrategy(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ): Promise<AdminStrategyDetailResponse>;
  delistStrategy(
    strategyId: string,
    input: AdminStrategyAction,
    context: AuditContext,
  ): Promise<AdminStrategyDetailResponse>;
}
