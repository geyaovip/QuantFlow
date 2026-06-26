import { Inject, Injectable } from "@nestjs/common";

import type {
  AdminPaperAccountAction,
  AdminPaperAccountListResponse,
  PaperAccountCopy,
  PaperAccountCreate,
  PaperAccountDetailResponse,
  PaperAccountListResponse,
  PaperExecuteSignal,
  PaperOrderListResponse,
  PaperPerformanceListResponse,
  PaperPositionListResponse,
  PaperRiskEventListResponse,
  PaperTradeListResponse,
} from "@quantflow/contracts";

import { MembershipService } from "../../membership/application/membership.service.js";
import {
  PaperAccountLimitError,
  PaperAccountNotFoundError,
  PaperRiskNotAcceptedError,
} from "../domain/paper-errors.js";
import {
  PAPER_REPOSITORY,
  type AuditContext,
  type ListPaperAccountsInput,
  type ListPaperSubResourceInput,
  type PaperRepository,
} from "../domain/paper-repository.js";

export const USER_DEFAULT_PAGE_SIZE = 20;
export const ADMIN_DEFAULT_PAGE_SIZE = 50;
export const API_MAX_PAGE_SIZE = 100;

@Injectable()
export class PaperService {
  constructor(
    @Inject(PAPER_REPOSITORY)
    private readonly repository: PaperRepository,
    private readonly membershipService: MembershipService,
  ) {}

  async listAccounts(
    userId: string,
    input: Partial<ListPaperAccountsInput>,
  ): Promise<PaperAccountListResponse> {
    const page = normalizePage(input.page);
    const pageSize = normalizePageSize(input.pageSize, USER_DEFAULT_PAGE_SIZE);
    const result = await this.repository.listAccounts(userId, {
      page,
      pageSize,
    });

    return {
      data: result.items,
      pagination: buildPagination(page, pageSize, result.total),
    };
  }

  async getAccount(
    userId: string,
    accountId: string,
  ): Promise<PaperAccountDetailResponse> {
    const account = await this.repository.getAccount(userId, accountId);
    if (!account) {
      throw new PaperAccountNotFoundError();
    }

    return { data: account };
  }

  async createAccount(userId: string, input: PaperAccountCreate) {
    if (!input.riskAccepted) {
      throw new PaperRiskNotAcceptedError();
    }

    await this.assertPaperQuota(userId);
    const data = await this.repository.createAccount(userId, input);
    return { data };
  }

  async copyAccount(
    userId: string,
    accountId: string,
    input: PaperAccountCopy,
  ) {
    if (!input.riskAccepted) {
      throw new PaperRiskNotAcceptedError();
    }

    await this.assertPaperQuota(userId);
    const data = await this.repository.copyAccount(userId, accountId, input);
    return { data };
  }

  async pauseAccount(userId: string, accountId: string) {
    const data = await this.repository.pauseAccount(userId, accountId);
    return { data };
  }

  async resumeAccount(userId: string, accountId: string) {
    const data = await this.repository.resumeAccount(userId, accountId);
    return { data };
  }

  async endAccount(userId: string, accountId: string) {
    const data = await this.repository.endAccount(userId, accountId);
    return { data };
  }

  async deleteAccount(userId: string, accountId: string) {
    await this.repository.deleteAccount(userId, accountId);
  }

  async executeSignal(
    userId: string,
    accountId: string,
    input: PaperExecuteSignal,
  ) {
    if (!input.riskAccepted) {
      throw new PaperRiskNotAcceptedError();
    }

    const data = await this.repository.executeSignal(userId, accountId, input);
    return { data };
  }

  async listPositions(
    userId: string,
    accountId: string,
    input: Partial<ListPaperSubResourceInput>,
  ): Promise<PaperPositionListResponse> {
    return this.listSubResource(
      userId,
      accountId,
      input,
      (uid, aid, normalized) =>
        this.repository.listPositions(uid, aid, normalized),
    );
  }

  async listOrders(
    userId: string,
    accountId: string,
    input: Partial<ListPaperSubResourceInput>,
  ): Promise<PaperOrderListResponse> {
    return this.listSubResource(
      userId,
      accountId,
      input,
      (uid, aid, normalized) =>
        this.repository.listOrders(uid, aid, normalized),
    );
  }

  async listTrades(
    userId: string,
    accountId: string,
    input: Partial<ListPaperSubResourceInput>,
  ): Promise<PaperTradeListResponse> {
    return this.listSubResource(
      userId,
      accountId,
      input,
      (uid, aid, normalized) =>
        this.repository.listTrades(uid, aid, normalized),
    );
  }

  async listPerformance(
    userId: string,
    accountId: string,
    input: Partial<ListPaperSubResourceInput>,
  ): Promise<PaperPerformanceListResponse> {
    return this.listSubResource(
      userId,
      accountId,
      input,
      (uid, aid, normalized) =>
        this.repository.listPerformance(uid, aid, normalized),
    );
  }

  async listRiskEvents(
    userId: string,
    accountId: string,
    input: Partial<ListPaperSubResourceInput>,
  ): Promise<PaperRiskEventListResponse> {
    return this.listSubResource(
      userId,
      accountId,
      input,
      (uid, aid, normalized) =>
        this.repository.listRiskEvents(uid, aid, normalized),
    );
  }

  async listAdminAccounts(
    input: Partial<ListPaperAccountsInput>,
  ): Promise<AdminPaperAccountListResponse> {
    const page = normalizePage(input.page);
    const pageSize = normalizePageSize(input.pageSize, ADMIN_DEFAULT_PAGE_SIZE);
    const result = await this.repository.listAdminAccounts({ page, pageSize });

    return {
      data: result.items,
      pagination: buildPagination(page, pageSize, result.total),
    };
  }

  adminPauseAccount(
    accountId: string,
    input: AdminPaperAccountAction,
    context: AuditContext,
  ) {
    return this.repository
      .adminPauseAccount(accountId, {
        ...context,
        reason: input.reason,
      })
      .then((data) => ({ data }));
  }

  adminResumeAccount(
    accountId: string,
    input: AdminPaperAccountAction,
    context: AuditContext,
  ) {
    return this.repository
      .adminResumeAccount(accountId, {
        ...context,
        reason: input.reason,
      })
      .then((data) => ({ data }));
  }

  adminMarkAbnormal(
    accountId: string,
    input: AdminPaperAccountAction,
    context: AuditContext,
  ) {
    return this.repository
      .adminMarkAbnormal(accountId, {
        ...context,
        reason: input.reason,
      })
      .then((data) => ({ data }));
  }

  private async listSubResource<T>(
    userId: string,
    accountId: string,
    input: Partial<ListPaperSubResourceInput>,
    loader: (
      userId: string,
      accountId: string,
      normalized: ListPaperSubResourceInput,
    ) => Promise<{ total: number; items: T[] }>,
  ) {
    const page = normalizePage(input.page);
    const pageSize = normalizePageSize(input.pageSize, USER_DEFAULT_PAGE_SIZE);
    const result = await loader(userId, accountId, { page, pageSize });

    return {
      data: result.items,
      pagination: buildPagination(page, pageSize, result.total),
    };
  }

  private async assertPaperQuota(userId: string) {
    const entitlements = await this.membershipService.getEntitlements(userId);
    const activeCount = await this.repository.countActiveAccounts(userId);
    if (activeCount >= entitlements.paperAccountsMax) {
      throw new PaperAccountLimitError();
    }
  }
}

function normalizePage(page: number | undefined) {
  return Number.isInteger(page) && page && page > 0 ? page : 1;
}

function normalizePageSize(pageSize: number | undefined, fallback: number) {
  if (!Number.isInteger(pageSize) || !pageSize || pageSize < 1) {
    return fallback;
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
