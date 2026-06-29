import type { AuditContext } from "../../strategy/domain/strategy-repository.js";

export type Paginated<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type AdminUserListItem = {
  id: string;
  email: string;
  status: string;
  membershipTier: string;
  membershipPlanName: string;
  paperAccountCount: number;
  strategySubscriptionCount: number;
  lastLoginAt: string | null;
  createdAt: string;
};

export type AdminUserDetail = AdminUserListItem & {
  subscriptions: AdminSubscriptionListItem[];
  strategySubscriptions: Array<{
    id: string;
    strategyId: string;
    strategyName: string;
    strategySlug: string;
    status: "active" | "cancelled";
    subscribedAt: string;
    cancelledAt: string | null;
  }>;
  paperAccounts: Array<{
    id: string;
    name: string;
    strategyName: string;
    symbol: string;
    status: string;
    currentEquity: string;
    maxDrawdown: string;
    createdAt: string;
  }>;
  inviteRedemptions: Array<{
    id: string;
    codeLabel: string;
    tier: "free" | "pro" | "premium";
    billingCycle: string;
    redeemedAt: string;
  }>;
  riskAcceptances: Array<{
    id: string;
    disclosureVersion: string;
    context: string;
    acceptedAt: string;
  }>;
  payments: Array<{
    id: string;
    tier: "free" | "pro" | "premium";
    billingCycle: string;
    status: string;
    amountCny: string;
    providerInvoiceId: string | null;
    createdAt: string;
    paidAt: string | null;
  }>;
  auditLogs: Array<{
    id: string;
    actorAdminId: string | null;
    actorEmail: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    reason: string;
    before: unknown | null;
    after: unknown | null;
    ip: string | null;
    userAgent: string | null;
    createdAt: string;
  }>;
};

export type AdminSubscriptionListItem = {
  id: string;
  userId: string;
  userEmail: string;
  tier: string;
  planName: string;
  status: string;
  source: string;
  startsAt: string;
  endsAt: string;
  cancelledAt: string | null;
};

export type AdminMembershipPaymentListItem = {
  id: string;
  userId: string;
  userEmail: string;
  tier: "free" | "pro" | "premium";
  planName: string;
  billingCycle: string;
  status: string;
  amountCny: string;
  providerInvoiceId: string | null;
  invoiceUrl: string | null;
  createdAt: string;
  expiresAt: string | null;
  paidAt: string | null;
};

export type RiskEventListItem = {
  id: string;
  type: string;
  level: string;
  status: string;
  message: string;
  userId: string | null;
  strategyId: string | null;
  signalId: string | null;
  paperAccountId: string | null;
  assigneeAdminId: string | null;
  resolution: string | null;
  handledAt: string | null;
  createdAt: string;
};

export type AdminDashboardSummary = {
  userCount: number;
  activeStrategyCount: number;
  signalCountToday: number;
  paperAccountCount: number;
  openRiskEventCount: number;
};

export type AdminRoleListItem = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
};

export type AdminAccountListItem = {
  id: string;
  email: string;
  status: string;
  roles: string[];
  lastLoginAt: string | null;
};

export type SystemAnnouncementItem = {
  id: string;
  title: string;
  content: string;
  status: string;
  publishedAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

export type ManualGrantInput = {
  userId: string;
  tier: "pro" | "premium";
  billingCycle: "monthly" | "yearly";
  reason: string;
};

export type InviteCodeListItem = {
  id: string;
  codeLabel: string;
  tier: "pro" | "premium";
  billingCycle: "monthly" | "yearly";
  maxRedemptions: number;
  redemptionCount: number;
  expiresAt: string | null;
  status: "active" | "disabled";
  note: string | null;
  createdAt: string;
};

export type InviteCodeCreateInput = {
  code: string;
  tier: "pro" | "premium";
  billingCycle: "monthly" | "yearly";
  maxRedemptions: number;
  expiresAt?: string;
  note?: string;
};

export const GOVERNANCE_REPOSITORY = Symbol("GOVERNANCE_REPOSITORY");

export interface GovernanceRepository {
  listUsers(
    page: number,
    pageSize: number,
  ): Promise<Paginated<AdminUserListItem>>;
  getUserDetail(userId: string): Promise<AdminUserDetail>;
  updateUserStatus(
    userId: string,
    status: "active" | "disabled" | "risk_watch",
    context: AuditContext,
  ): Promise<AdminUserListItem>;
  listSubscriptions(
    page: number,
    pageSize: number,
  ): Promise<Paginated<AdminSubscriptionListItem>>;
  listMembershipPayments(
    page: number,
    pageSize: number,
  ): Promise<Paginated<AdminMembershipPaymentListItem>>;
  manualGrantMembership(
    input: ManualGrantInput,
    context: AuditContext,
  ): Promise<AdminSubscriptionListItem>;
  cancelMembership(
    subscriptionId: string,
    context: AuditContext,
  ): Promise<AdminSubscriptionListItem>;
  listInviteCodes(
    page: number,
    pageSize: number,
  ): Promise<Paginated<InviteCodeListItem>>;
  createInviteCode(
    input: InviteCodeCreateInput,
    context: AuditContext,
  ): Promise<InviteCodeListItem>;
  disableInviteCode(
    inviteCodeId: string,
    context: AuditContext,
  ): Promise<InviteCodeListItem>;
  listRiskEvents(
    page: number,
    pageSize: number,
  ): Promise<Paginated<RiskEventListItem>>;
  updateRiskEvent(
    riskEventId: string,
    action: "assign" | "resolve" | "ignore" | "escalate",
    input: { reason: string; resolution?: string; assigneeAdminId?: string },
    context: AuditContext,
  ): Promise<RiskEventListItem>;
  createRiskEvent(input: {
    type: string;
    level: "low" | "medium" | "high" | "critical";
    message: string;
    userId?: string | null;
    strategyId?: string | null;
    signalId?: string | null;
    paperAccountId?: string | null;
  }): Promise<RiskEventListItem>;
  getDashboardSummary(): Promise<AdminDashboardSummary>;
  listRoles(): Promise<AdminRoleListItem[]>;
  listAdminAccounts(): Promise<AdminAccountListItem[]>;
  assignAdminRole(
    adminUserId: string,
    roleId: string,
    context: AuditContext,
  ): Promise<AdminAccountListItem>;
  listAnnouncements(
    page: number,
    pageSize: number,
  ): Promise<Paginated<SystemAnnouncementItem>>;
  publishAnnouncement(
    announcementId: string,
    context: AuditContext,
  ): Promise<SystemAnnouncementItem>;
  createAnnouncement(
    input: { title: string; content: string; reason: string },
    context: AuditContext,
  ): Promise<SystemAnnouncementItem>;
  listActiveUserIds(): Promise<string[]>;
}
