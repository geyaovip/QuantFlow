import type {
  AdminPaperAccountDetail,
  AdminPaperAccountListItem,
  PaperAccountCopy,
  PaperAccountCreate,
  PaperAccountDetail,
  PaperAccountListItem,
  PaperExecuteSignal,
  PaperOrder,
  PaperPerformancePoint,
  PaperPosition,
  PaperRiskEvent,
  PaperTrade,
} from "@quantflow/contracts";

export const PAPER_REPOSITORY = Symbol("PAPER_REPOSITORY");

export type AuditContext = {
  actorAdminId: string;
  reason: string;
  ip?: string;
  userAgent?: string;
};

export type ListPaperAccountsInput = {
  page: number;
  pageSize: number;
};

export type ListPaperSubResourceInput = ListPaperAccountsInput;

export type PaginatedPaperAccounts = {
  total: number;
  items: PaperAccountListItem[];
};

export type Paginated<T> = {
  total: number;
  items: T[];
};

export interface PaperRepository {
  countActiveAccounts(userId: string): Promise<number>;
  listAccounts(
    userId: string,
    input: ListPaperAccountsInput,
  ): Promise<PaginatedPaperAccounts>;
  getAccount(
    userId: string,
    accountId: string,
  ): Promise<PaperAccountDetail | null>;
  createAccount(
    userId: string,
    input: PaperAccountCreate,
  ): Promise<PaperAccountDetail>;
  copyAccount(
    userId: string,
    accountId: string,
    input: PaperAccountCopy,
  ): Promise<PaperAccountDetail>;
  pauseAccount(userId: string, accountId: string): Promise<PaperAccountDetail>;
  resumeAccount(userId: string, accountId: string): Promise<PaperAccountDetail>;
  resetAccount(userId: string, accountId: string): Promise<PaperAccountDetail>;
  endAccount(userId: string, accountId: string): Promise<PaperAccountDetail>;
  deleteAccount(userId: string, accountId: string): Promise<void>;
  executeSignal(
    userId: string,
    accountId: string,
    input: PaperExecuteSignal,
  ): Promise<PaperAccountDetail>;
  listPositions(
    userId: string,
    accountId: string,
    input: ListPaperSubResourceInput,
  ): Promise<Paginated<PaperPosition>>;
  listOrders(
    userId: string,
    accountId: string,
    input: ListPaperSubResourceInput,
  ): Promise<Paginated<PaperOrder>>;
  listTrades(
    userId: string,
    accountId: string,
    input: ListPaperSubResourceInput,
  ): Promise<Paginated<PaperTrade>>;
  listPerformance(
    userId: string,
    accountId: string,
    input: ListPaperSubResourceInput,
  ): Promise<Paginated<PaperPerformancePoint>>;
  listRiskEvents(
    userId: string,
    accountId: string,
    input: ListPaperSubResourceInput,
  ): Promise<Paginated<PaperRiskEvent>>;
  listAdminAccounts(
    input: ListPaperAccountsInput,
  ): Promise<Paginated<AdminPaperAccountListItem>>;
  getAdminAccount(accountId: string): Promise<AdminPaperAccountDetail | null>;
  adminPauseAccount(
    accountId: string,
    context: AuditContext,
  ): Promise<AdminPaperAccountListItem>;
  adminResumeAccount(
    accountId: string,
    context: AuditContext,
  ): Promise<AdminPaperAccountListItem>;
  adminMarkAbnormal(
    accountId: string,
    context: AuditContext,
  ): Promise<AdminPaperAccountListItem>;
}
