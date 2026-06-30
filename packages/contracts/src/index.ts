import { z } from "zod";

export const portalSchema = z.enum(["user", "admin"]);

export const emailOtpRequestSchema = z.object({
  email: z.email(),
  portal: portalSchema,
  turnstileToken: z.string().min(1).optional(),
});

export const emailOtpVerifySchema = z.object({
  email: z.email(),
  portal: portalSchema,
  code: z.string().regex(/^\d{6}$/),
});

export const emailOtpRequestResponseSchema = z.object({
  message: z.string(),
  resendAvailableAt: z.iso.datetime().optional(),
});

export const authSessionSchema = z.object({
  subjectId: z.uuid(),
  audience: portalSchema,
  expiresAt: z.iso.datetime(),
  email: z.email().optional(),
  displayName: z.string().optional(),
  membershipPlan: z.string().optional(),
});

export const featureFlagsSchema = z.object({
  enableExchangeConnection: z.literal(false),
  enableSemiAutoTrading: z.literal(false),
  enableAutoTrading: z.literal(false),
  enableAuthorPortal: z.literal(false),
  enableProductionPayments: z.boolean(),
});

export const riskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export const membershipTierSchema = z.enum(["free", "plus", "pro"]);
export const paidMembershipTierSchema = z.enum(["plus", "pro"]);
export const strategyStatusSchema = z.enum([
  "draft",
  "pending_review",
  "active",
  "paused",
  "risk_watch",
  "delisted",
]);
export const strategyTypeSchema = z.enum([
  "spot",
  "grid",
  "dca",
  "trend",
  "swing",
]);
export const strategyMetricPeriodSchema = z.enum([
  "seven_days",
  "thirty_days",
  "ninety_days",
  "all_time",
]);
export const signalDirectionSchema = z.enum(["buy", "sell", "watch"]);
export const signalStatusSchema = z.enum([
  "active",
  "expired",
  "cancelled",
  "strategy_paused",
  "risk_blocked",
]);
export const strategySubscriptionStatusSchema = z.enum(["active", "cancelled"]);

export const paginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(1),
});

export const strategyMetricSchema = z.object({
  period: strategyMetricPeriodSchema,
  returnRate: z.string(),
  maxDrawdown: z.string(),
  winRate: z.string(),
  profitLossRatio: z.string(),
  tradeCount: z.number().int().min(0),
  sampleSize: z.number().int().min(0),
  dataSource: z.string(),
  calculatedAt: z.iso.datetime(),
});

export const strategySignalSummarySchema = z.object({
  id: z.uuid(),
  direction: signalDirectionSchema,
  status: signalStatusSchema,
  generatedAt: z.iso.datetime(),
  validUntil: z.iso.datetime(),
});

export const strategyListItemSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  summary: z.string(),
  type: strategyTypeSchema,
  symbols: z.array(z.string()),
  riskLevel: riskLevelSchema,
  status: strategyStatusSchema,
  requiredTier: membershipTierSchema,
  supportsPaperTrading: z.boolean(),
  metric: strategyMetricSchema,
  currentSignal: strategySignalSummarySchema.nullable(),
  publishedAt: z.iso.datetime().nullable(),
  isSubscribed: z.boolean().optional(),
  subscriptionStatus: strategySubscriptionStatusSchema.nullable().optional(),
});

export const strategyListResponseSchema = z.object({
  data: z.array(strategyListItemSchema),
  pagination: paginationSchema,
});

export const signalListItemSchema = z.object({
  id: z.uuid(),
  strategyId: z.uuid(),
  strategySlug: z.string(),
  strategyName: z.string(),
  symbol: z.string(),
  direction: signalDirectionSchema,
  triggerPrice: z.string(),
  currentPriceSnapshot: z.string(),
  suggestedPositionPct: z.string(),
  stopLossPrice: z.string(),
  takeProfitPrice: z.string(),
  rationale: z.string(),
  status: signalStatusSchema,
  riskLevel: riskLevelSchema,
  generatedAt: z.iso.datetime(),
  validUntil: z.iso.datetime(),
  isSubscribed: z.boolean().optional(),
  usedInPaperTrading: z.boolean().optional(),
});

export const strategyDetailSchema = strategyListItemSchema.extend({
  version: z.number().int().min(1),
  logic: z.string(),
  suitableMarket: z.string(),
  unsuitableMarket: z.string(),
  positionSizing: z.string(),
  stopLossLogic: z.string(),
  takeProfitLogic: z.string(),
  failureModes: z.string(),
  dataSource: z.string(),
  riskDisclosure: z.string(),
  canSubscribe: z.boolean(),
  metrics: z.array(strategyMetricSchema),
  recentSignals: z.array(signalListItemSchema),
});

export const strategyDetailResponseSchema = z.object({
  data: strategyDetailSchema,
});

export const signalListResponseSchema = z.object({
  data: z.array(signalListItemSchema),
  pagination: paginationSchema,
});

export const signalDetailSchema = signalListItemSchema.extend({
  riskDisclosure: z.string(),
});

export const signalDetailResponseSchema = z.object({
  data: signalDetailSchema,
});

export const strategySubscriptionSchema = z.object({
  strategyId: z.uuid(),
  status: strategySubscriptionStatusSchema,
  subscribedAt: z.iso.datetime(),
  cancelledAt: z.iso.datetime().nullable(),
});

export const strategySubscriptionResponseSchema = z.object({
  data: strategySubscriptionSchema,
});

export const strategySubscriptionListResponseSchema = z.object({
  data: z.array(strategyListItemSchema),
  pagination: paginationSchema,
});

export const adminStrategyCreateSchema = z.object({
  slug: z.string().min(3),
  name: z.string().min(2),
  summary: z.string().min(10),
  type: strategyTypeSchema,
  riskLevel: riskLevelSchema,
  requiredTier: membershipTierSchema.default("free"),
  symbols: z.array(z.string().min(3)).min(1),
  logic: z.string().min(10),
  suitableMarket: z.string().min(5),
  unsuitableMarket: z.string().min(5),
  positionSizing: z.string().min(5),
  stopLossLogic: z.string().min(5),
  takeProfitLogic: z.string().min(5),
  failureModes: z.string().min(5),
  reason: z.string().min(3),
});

export const adminStrategyActionSchema = z.object({
  reason: z.string().min(3),
});

export const adminStrategyListResponseSchema = strategyListResponseSchema;
export const adminStrategyDetailResponseSchema = strategyDetailResponseSchema;

export const membershipEntitlementSchema = z.object({
  key: z.string(),
  valueType: z.enum(["int", "bool", "string"]),
  value: z.string(),
});

export const membershipPlanSchema = z.object({
  tier: membershipTierSchema,
  name: z.string(),
  monthlyPriceUsd: z.string(),
  yearlyPriceUsd: z.string(),
  entitlements: z.array(membershipEntitlementSchema),
});

export const membershipPlanListResponseSchema = z.object({
  data: z.array(membershipPlanSchema),
});

export const membershipSubscriptionSchema = z.object({
  tier: membershipTierSchema,
  planName: z.string(),
  status: z.enum(["active", "expired", "cancelled"]),
  source: z.enum(["manual", "invite", "test", "plisio"]),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  cancelledAt: z.iso.datetime().nullable(),
});

export const membershipSubscriptionResponseSchema = z.object({
  data: membershipSubscriptionSchema,
});

export const userEntitlementsSchema = z.object({
  tier: membershipTierSchema,
  planName: z.string(),
  strategySubscriptionsMax: z.number().int().min(0),
  paperAccountsMax: z.number().int().min(0),
  historyDays: z.number().int().min(0),
});

export const membershipMockCheckoutSchema = z.object({
  tier: paidMembershipTierSchema,
  billingCycle: z.enum(["monthly", "yearly"]),
  riskAccepted: z.literal(true),
});

export const membershipCheckoutCreateSchema = z.object({
  tier: paidMembershipTierSchema,
  billingCycle: z.enum(["monthly", "yearly"]),
  riskAccepted: z.literal(true),
});

export const membershipInviteRedeemSchema = z.object({
  code: z.string().min(4).max(64),
  riskDisclosureVersion: z.literal("risk-v1"),
  riskAccepted: z.literal(true),
});

export const membershipPaymentSchema = z.object({
  id: z.uuid(),
  tier: paidMembershipTierSchema,
  billingCycle: z.enum(["monthly", "yearly"]),
  status: z.string(),
  provider: z.literal("plisio"),
  invoiceUrl: z.url(),
  amountUsd: z.string(),
  allowedCurrencies: z.array(z.enum(["USDT_BSC", "USDT"])),
  expiresAt: z.iso.datetime().nullable(),
});

export const membershipPaymentResponseSchema = z.object({
  data: membershipPaymentSchema,
});

export const securityEventSchema = z.object({
  id: z.uuid(),
  eventType: z.string(),
  occurredAt: z.iso.datetime(),
  ip: z.string().nullable(),
});

export const securityEventListResponseSchema = z.object({
  data: z.array(securityEventSchema),
  pagination: paginationSchema,
});

export const paperAccountStatusSchema = z.enum([
  "running",
  "paused",
  "ended",
  "data_error",
  "strategy_paused",
]);

export const paperAccountListItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  symbol: z.string(),
  strategyId: z.uuid(),
  strategyName: z.string(),
  status: paperAccountStatusSchema,
  initialBalance: z.string(),
  currentEquity: z.string(),
  returnRate: z.string(),
  maxDrawdown: z.string(),
  startedAt: z.iso.datetime(),
  isSimulated: z.literal(true),
});

export const paperAccountListResponseSchema = z.object({
  data: z.array(paperAccountListItemSchema),
  pagination: paginationSchema,
});

export const paperPositionSchema = z.object({
  id: z.uuid(),
  symbol: z.string(),
  side: z.enum(["buy", "sell"]),
  quantity: z.string(),
  averagePrice: z.string(),
  markPrice: z.string(),
  unrealizedPnl: z.string(),
  status: z.enum(["open", "closed"]),
});

export const paperTradeSchema = z.object({
  id: z.uuid(),
  side: z.enum(["buy", "sell"]),
  price: z.string(),
  quantity: z.string(),
  fee: z.string(),
  realizedPnl: z.string(),
  executedAt: z.iso.datetime(),
});

export const paperPerformancePointSchema = z.object({
  equity: z.string(),
  returnRate: z.string(),
  drawdown: z.string(),
  positionCount: z.number().int().min(0),
  recordedAt: z.iso.datetime(),
});

export const paperRiskEventSchema = z.object({
  id: z.uuid(),
  type: z.string(),
  riskLevel: riskLevelSchema,
  message: z.string(),
  occurredAt: z.iso.datetime(),
});

export const paperAccountDetailSchema = paperAccountListItemSchema.extend({
  cashBalance: z.string(),
  maxPositionPct: z.string(),
  maxPositions: z.number().int().min(1),
  engineVersion: z.string(),
  positions: z.array(paperPositionSchema),
  recentTrades: z.array(paperTradeSchema),
  performance: z.array(paperPerformancePointSchema),
  riskEvents: z.array(paperRiskEventSchema),
  riskDisclosure: z.string(),
});

export const paperAccountDetailResponseSchema = z.object({
  data: paperAccountDetailSchema,
});

export const paperAccountCreateSchema = z.object({
  strategyId: z.uuid(),
  symbol: z.string().min(3),
  name: z.string().min(1).max(80),
  initialBalance: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .default("10000.00"),
  maxPositionPct: z
    .string()
    .regex(/^0(\.\d+)?$|^1(\.0+)?$/)
    .default("0.10"),
  maxPositions: z.number().int().min(1).max(10).default(3),
  signalId: z.uuid().optional(),
  riskDisclosureVersion: z.literal("risk-v1"),
  riskAccepted: z.literal(true),
});

export const paperExecuteSignalSchema = z.object({
  signalId: z.uuid(),
  riskAccepted: z.literal(true),
});

export const paperAccountCopySchema = z.object({
  name: z.string().min(1).max(80).optional(),
  riskDisclosureVersion: z.literal("risk-v1"),
  riskAccepted: z.literal(true),
});

export const paperAccountResetSchema = z.object({
  riskDisclosureVersion: z.literal("risk-v1"),
  riskAccepted: z.literal(true),
});

export const marketSymbolSnapshotSchema = z.object({
  symbol: z.string(),
  price: z.string().nullable(),
  changeRate: z.string().nullable(),
  source: z.string().nullable(),
  capturedAt: z.iso.datetime().nullable(),
  isStale: z.boolean(),
});

export const marketSymbolListResponseSchema = z.object({
  data: z.array(marketSymbolSnapshotSchema),
});

export const marketSymbolDetailResponseSchema = z.object({
  data: marketSymbolSnapshotSchema,
});

export const paperOrderSchema = z.object({
  id: z.uuid(),
  signalId: z.uuid().nullable(),
  side: z.enum(["buy", "sell"]),
  type: z.literal("market"),
  price: z.string().nullable(),
  quantity: z.string(),
  status: z.enum(["pending", "filled", "cancelled", "rejected"]),
  rejectReason: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const paperPositionListResponseSchema = z.object({
  data: z.array(paperPositionSchema),
  pagination: paginationSchema,
});

export const paperOrderListResponseSchema = z.object({
  data: z.array(paperOrderSchema),
  pagination: paginationSchema,
});

export const paperTradeListResponseSchema = z.object({
  data: z.array(paperTradeSchema),
  pagination: paginationSchema,
});

export const paperPerformanceListResponseSchema = z.object({
  data: z.array(paperPerformancePointSchema),
  pagination: paginationSchema,
});

export const paperRiskEventListResponseSchema = z.object({
  data: z.array(paperRiskEventSchema),
  pagination: paginationSchema,
});

export const adminPaperAccountListItemSchema =
  paperAccountListItemSchema.extend({
    userId: z.uuid(),
    userEmail: z.string(),
  });

export const adminPaperAccountListResponseSchema = z.object({
  data: z.array(adminPaperAccountListItemSchema),
  pagination: paginationSchema,
});

export const adminPaperAccountActionResponseSchema = z.object({
  data: adminPaperAccountListItemSchema,
});

export const adminPaperAccountDetailSchema = paperAccountDetailSchema.extend({
  userId: z.uuid(),
  userEmail: z.string(),
});

export const adminPaperAccountDetailResponseSchema = z.object({
  data: adminPaperAccountDetailSchema,
});

export const adminPaperAccountActionSchema = z.object({
  reason: z.string().min(3),
});

export const notificationTypeSchema = z.enum([
  "system",
  "signal",
  "risk",
  "membership",
]);

export const notificationChannelSchema = z.enum(["in_app"]);

export const notificationListItemSchema = z.object({
  id: z.uuid(),
  type: notificationTypeSchema,
  title: z.string(),
  content: z.string(),
  readAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export const notificationListResponseSchema = z.object({
  data: z.array(notificationListItemSchema),
  pagination: paginationSchema,
});

export const notificationDetailResponseSchema = z.object({
  data: notificationListItemSchema,
});

export const notificationPreferenceSchema = z.object({
  channel: notificationChannelSchema,
  type: notificationTypeSchema,
  enabled: z.boolean(),
});

export const notificationPreferenceListResponseSchema = z.object({
  data: z.array(notificationPreferenceSchema),
});

export const notificationPreferenceUpdateSchema = z.object({
  preferences: z.array(notificationPreferenceSchema).min(1),
});

export const adminAuditLogSchema = z.object({
  id: z.uuid(),
  actorAdminId: z.uuid().nullable(),
  actorEmail: z.string().nullable(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.uuid().nullable(),
  reason: z.string(),
  before: z.unknown().nullable(),
  after: z.unknown().nullable(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const adminAuditLogListResponseSchema = z.object({
  data: z.array(adminAuditLogSchema),
  pagination: paginationSchema,
});

export const adminDashboardSummarySchema = z.object({
  userCount: z.number().int().min(0),
  activeStrategyCount: z.number().int().min(0),
  signalCountToday: z.number().int().min(0),
  paperAccountCount: z.number().int().min(0),
  openRiskEventCount: z.number().int().min(0),
});

export const adminDashboardSummaryResponseSchema = z.object({
  data: adminDashboardSummarySchema,
});

export const adminUserListItemSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  status: z.string(),
  membershipTier: membershipTierSchema,
  membershipPlanName: z.string(),
  paperAccountCount: z.number().int().min(0),
  strategySubscriptionCount: z.number().int().min(0),
  lastLoginAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export const adminUserListResponseSchema = z.object({
  data: z.array(adminUserListItemSchema),
  pagination: paginationSchema,
});

export const adminUserStatusSchema = z.object({
  status: z.enum(["active", "disabled", "risk_watch"]),
  reason: z.string().min(3),
});

export const adminSubscriptionListItemSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  userEmail: z.string(),
  tier: membershipTierSchema,
  planName: z.string(),
  status: z.enum(["active", "expired", "cancelled"]),
  source: z.enum(["manual", "invite", "test", "plisio"]),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  cancelledAt: z.iso.datetime().nullable(),
});

export const adminSubscriptionListResponseSchema = z.object({
  data: z.array(adminSubscriptionListItemSchema),
  pagination: paginationSchema,
});

export const adminMembershipPaymentSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  userEmail: z.string(),
  tier: membershipTierSchema,
  planName: z.string(),
  billingCycle: z.string(),
  status: z.string(),
  amountUsd: z.string(),
  providerInvoiceId: z.string().nullable(),
  invoiceUrl: z.string().nullable(),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime().nullable(),
  paidAt: z.iso.datetime().nullable(),
});

export const adminMembershipPaymentListResponseSchema = z.object({
  data: z.array(adminMembershipPaymentSchema),
  pagination: paginationSchema,
});

export const adminUserDetailSchema = adminUserListItemSchema.extend({
  subscriptions: z.array(adminSubscriptionListItemSchema),
  strategySubscriptions: z.array(
    z.object({
      id: z.uuid(),
      strategyId: z.uuid(),
      strategyName: z.string(),
      strategySlug: z.string(),
      status: z.enum(["active", "cancelled"]),
      subscribedAt: z.iso.datetime(),
      cancelledAt: z.iso.datetime().nullable(),
    }),
  ),
  paperAccounts: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      strategyName: z.string(),
      symbol: z.string(),
      status: paperAccountStatusSchema,
      currentEquity: z.string(),
      maxDrawdown: z.string(),
      createdAt: z.iso.datetime(),
    }),
  ),
  inviteRedemptions: z.array(
    z.object({
      id: z.uuid(),
      codeLabel: z.string(),
      tier: membershipTierSchema,
      billingCycle: z.string(),
      redeemedAt: z.iso.datetime(),
    }),
  ),
  riskAcceptances: z.array(
    z.object({
      id: z.uuid(),
      disclosureVersion: z.string(),
      context: z.enum([
        "strategy_subscribe",
        "paper_account_create",
        "membership_checkout",
        "membership_invite_redeem",
      ]),
      acceptedAt: z.iso.datetime(),
    }),
  ),
  payments: z.array(
    z.object({
      id: z.uuid(),
      tier: membershipTierSchema,
      billingCycle: z.string(),
      status: z.string(),
      amountUsd: z.string(),
      providerInvoiceId: z.string().nullable(),
      createdAt: z.iso.datetime(),
      paidAt: z.iso.datetime().nullable(),
    }),
  ),
  auditLogs: z.array(adminAuditLogSchema),
});

export const adminUserDetailResponseSchema = z.object({
  data: adminUserDetailSchema,
});

export const adminMembershipManualGrantSchema = z.object({
  userId: z.uuid(),
  tier: paidMembershipTierSchema,
  billingCycle: z.enum(["monthly", "yearly"]),
  reason: z.string().min(3),
});

export const adminMembershipActionSchema = z.object({
  reason: z.string().min(3),
});

export const adminMembershipInviteCodeSchema = z.object({
  id: z.uuid(),
  codeLabel: z.string(),
  tier: paidMembershipTierSchema,
  billingCycle: z.enum(["monthly", "yearly"]),
  maxRedemptions: z.number().int().min(1),
  redemptionCount: z.number().int().min(0),
  expiresAt: z.iso.datetime().nullable(),
  status: z.enum(["active", "disabled"]),
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const adminMembershipInviteListResponseSchema = z.object({
  data: z.array(adminMembershipInviteCodeSchema),
  pagination: paginationSchema,
});

export const adminMembershipInviteCreateSchema = z.object({
  code: z.string().min(4).max(64),
  tier: paidMembershipTierSchema,
  billingCycle: z.enum(["monthly", "yearly"]),
  maxRedemptions: z.number().int().min(1).max(10000),
  expiresAt: z.iso.datetime().optional(),
  note: z.string().max(200).optional(),
  reason: z.string().min(3),
});

export const strategySubscribeSchema = z.object({
  riskDisclosureVersion: z.literal("risk-v1"),
  riskAccepted: z.literal(true),
});

export const adminRiskEventSchema = z.object({
  id: z.uuid(),
  type: z.string(),
  level: riskLevelSchema,
  status: z.string(),
  message: z.string(),
  userId: z.uuid().nullable(),
  strategyId: z.uuid().nullable(),
  signalId: z.uuid().nullable(),
  paperAccountId: z.uuid().nullable(),
  assigneeAdminId: z.uuid().nullable(),
  resolution: z.string().nullable(),
  handledAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export const adminRiskEventListResponseSchema = z.object({
  data: z.array(adminRiskEventSchema),
  pagination: paginationSchema,
});

export const adminRiskActionSchema = z.object({
  reason: z.string().min(3),
  resolution: z.string().optional(),
  assigneeAdminId: z.uuid().optional(),
});

export const adminRoleListItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string(),
  permissions: z.array(z.string()),
});

export const adminRoleListResponseSchema = z.object({
  data: z.array(adminRoleListItemSchema),
});

export const adminAccountListItemSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  status: z.string(),
  roles: z.array(z.string()),
  lastLoginAt: z.iso.datetime().nullable(),
});

export const adminAccountListResponseSchema = z.object({
  data: z.array(adminAccountListItemSchema),
});

export const adminRoleAssignSchema = z.object({
  roleId: z.uuid(),
  reason: z.string().min(3),
});

export const adminAnnouncementSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  content: z.string(),
  status: z.enum(["draft", "published", "ended"]),
  publishedAt: z.iso.datetime().nullable(),
  endsAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export const adminAnnouncementListResponseSchema = z.object({
  data: z.array(adminAnnouncementSchema),
  pagination: paginationSchema,
});

export const adminAnnouncementCreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  reason: z.string().min(3),
});

export type EmailOtpRequest = z.infer<typeof emailOtpRequestSchema>;
export type EmailOtpRequestResponse = z.infer<
  typeof emailOtpRequestResponseSchema
>;
export type EmailOtpVerify = z.infer<typeof emailOtpVerifySchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;
export type RiskLevel = z.infer<typeof riskLevelSchema>;
export type MembershipTier = z.infer<typeof membershipTierSchema>;
export type StrategyStatus = z.infer<typeof strategyStatusSchema>;
export type StrategyType = z.infer<typeof strategyTypeSchema>;
export type StrategyMetricPeriod = z.infer<typeof strategyMetricPeriodSchema>;
export type SignalDirection = z.infer<typeof signalDirectionSchema>;
export type SignalStatus = z.infer<typeof signalStatusSchema>;
export type StrategySubscriptionStatus = z.infer<
  typeof strategySubscriptionStatusSchema
>;
export type Pagination = z.infer<typeof paginationSchema>;
export type StrategyMetric = z.infer<typeof strategyMetricSchema>;
export type StrategySignalSummary = z.infer<typeof strategySignalSummarySchema>;
export type StrategyListItem = z.infer<typeof strategyListItemSchema>;
export type StrategyListResponse = z.infer<typeof strategyListResponseSchema>;
export type StrategyDetail = z.infer<typeof strategyDetailSchema>;
export type StrategyDetailResponse = z.infer<
  typeof strategyDetailResponseSchema
>;
export type SignalListItem = z.infer<typeof signalListItemSchema>;
export type SignalListResponse = z.infer<typeof signalListResponseSchema>;
export type SignalDetail = z.infer<typeof signalDetailSchema>;
export type SignalDetailResponse = z.infer<typeof signalDetailResponseSchema>;
export type StrategySubscription = z.infer<typeof strategySubscriptionSchema>;
export type StrategySubscriptionResponse = z.infer<
  typeof strategySubscriptionResponseSchema
>;
export type StrategySubscriptionListResponse = z.infer<
  typeof strategySubscriptionListResponseSchema
>;
export type AdminStrategyCreate = z.infer<typeof adminStrategyCreateSchema>;
export type AdminStrategyAction = z.infer<typeof adminStrategyActionSchema>;
export type AdminStrategyListResponse = z.infer<
  typeof adminStrategyListResponseSchema
>;
export type AdminStrategyDetailResponse = z.infer<
  typeof adminStrategyDetailResponseSchema
>;
export type MembershipPlan = z.infer<typeof membershipPlanSchema>;
export type MembershipPlanListResponse = z.infer<
  typeof membershipPlanListResponseSchema
>;
export type MembershipSubscription = z.infer<
  typeof membershipSubscriptionSchema
>;
export type MembershipSubscriptionResponse = z.infer<
  typeof membershipSubscriptionResponseSchema
>;
export type UserEntitlements = z.infer<typeof userEntitlementsSchema>;
export type MembershipMockCheckout = z.infer<
  typeof membershipMockCheckoutSchema
>;
export type MembershipCheckoutCreate = z.infer<
  typeof membershipCheckoutCreateSchema
>;
export type MembershipInviteRedeem = z.infer<
  typeof membershipInviteRedeemSchema
>;
export type MembershipPayment = z.infer<typeof membershipPaymentSchema>;
export type MembershipPaymentResponse = z.infer<
  typeof membershipPaymentResponseSchema
>;
export type SecurityEvent = z.infer<typeof securityEventSchema>;
export type SecurityEventListResponse = z.infer<
  typeof securityEventListResponseSchema
>;
export type PaperAccountStatus = z.infer<typeof paperAccountStatusSchema>;
export type PaperAccountListItem = z.infer<typeof paperAccountListItemSchema>;
export type PaperAccountListResponse = z.infer<
  typeof paperAccountListResponseSchema
>;
export type PaperPosition = z.infer<typeof paperPositionSchema>;
export type PaperTrade = z.infer<typeof paperTradeSchema>;
export type PaperPerformancePoint = z.infer<typeof paperPerformancePointSchema>;
export type PaperRiskEvent = z.infer<typeof paperRiskEventSchema>;
export type PaperAccountDetail = z.infer<typeof paperAccountDetailSchema>;
export type PaperAccountDetailResponse = z.infer<
  typeof paperAccountDetailResponseSchema
>;
export type PaperAccountCreate = z.infer<typeof paperAccountCreateSchema>;
export type PaperExecuteSignal = z.infer<typeof paperExecuteSignalSchema>;
export type PaperAccountCopy = z.infer<typeof paperAccountCopySchema>;
export type PaperAccountReset = z.infer<typeof paperAccountResetSchema>;
export type MarketSymbolSnapshot = z.infer<typeof marketSymbolSnapshotSchema>;
export type MarketSymbolListResponse = z.infer<
  typeof marketSymbolListResponseSchema
>;
export type MarketSymbolDetailResponse = z.infer<
  typeof marketSymbolDetailResponseSchema
>;
export type PaperOrder = z.infer<typeof paperOrderSchema>;
export type PaperPositionListResponse = z.infer<
  typeof paperPositionListResponseSchema
>;
export type PaperOrderListResponse = z.infer<
  typeof paperOrderListResponseSchema
>;
export type PaperTradeListResponse = z.infer<
  typeof paperTradeListResponseSchema
>;
export type PaperPerformanceListResponse = z.infer<
  typeof paperPerformanceListResponseSchema
>;
export type PaperRiskEventListResponse = z.infer<
  typeof paperRiskEventListResponseSchema
>;
export type AdminPaperAccountListItem = z.infer<
  typeof adminPaperAccountListItemSchema
>;
export type AdminPaperAccountListResponse = z.infer<
  typeof adminPaperAccountListResponseSchema
>;
export type AdminPaperAccountActionResponse = z.infer<
  typeof adminPaperAccountActionResponseSchema
>;
export type AdminPaperAccountDetail = z.infer<
  typeof adminPaperAccountDetailSchema
>;
export type AdminPaperAccountDetailResponse = z.infer<
  typeof adminPaperAccountDetailResponseSchema
>;
export type AdminPaperAccountAction = z.infer<
  typeof adminPaperAccountActionSchema
>;
export type NotificationListItem = z.infer<typeof notificationListItemSchema>;
export type NotificationListResponse = z.infer<
  typeof notificationListResponseSchema
>;
export type NotificationDetailResponse = z.infer<
  typeof notificationDetailResponseSchema
>;
export type NotificationPreference = z.infer<
  typeof notificationPreferenceSchema
>;
export type NotificationPreferenceListResponse = z.infer<
  typeof notificationPreferenceListResponseSchema
>;
export type NotificationPreferenceUpdate = z.infer<
  typeof notificationPreferenceUpdateSchema
>;
export type AdminAuditLog = z.infer<typeof adminAuditLogSchema>;
export type AdminAuditLogListResponse = z.infer<
  typeof adminAuditLogListResponseSchema
>;
export type AdminDashboardSummary = z.infer<typeof adminDashboardSummarySchema>;
export type AdminDashboardSummaryResponse = z.infer<
  typeof adminDashboardSummaryResponseSchema
>;
export type AdminUserListItem = z.infer<typeof adminUserListItemSchema>;
export type AdminUserListResponse = z.infer<typeof adminUserListResponseSchema>;
export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;
export type AdminUserDetailResponse = z.infer<
  typeof adminUserDetailResponseSchema
>;
export type AdminUserStatusUpdate = z.infer<typeof adminUserStatusSchema>;
export type AdminSubscriptionListItem = z.infer<
  typeof adminSubscriptionListItemSchema
>;
export type AdminSubscriptionListResponse = z.infer<
  typeof adminSubscriptionListResponseSchema
>;
export type AdminMembershipPayment = z.infer<
  typeof adminMembershipPaymentSchema
>;
export type AdminMembershipPaymentListResponse = z.infer<
  typeof adminMembershipPaymentListResponseSchema
>;
export type AdminMembershipManualGrant = z.infer<
  typeof adminMembershipManualGrantSchema
>;
export type AdminMembershipAction = z.infer<typeof adminMembershipActionSchema>;
export type AdminMembershipInviteCode = z.infer<
  typeof adminMembershipInviteCodeSchema
>;
export type AdminMembershipInviteListResponse = z.infer<
  typeof adminMembershipInviteListResponseSchema
>;
export type AdminMembershipInviteCreate = z.infer<
  typeof adminMembershipInviteCreateSchema
>;
export type StrategySubscribe = z.infer<typeof strategySubscribeSchema>;
export type AdminRiskEvent = z.infer<typeof adminRiskEventSchema>;
export type AdminRiskEventListResponse = z.infer<
  typeof adminRiskEventListResponseSchema
>;
export type AdminRiskAction = z.infer<typeof adminRiskActionSchema>;
export type AdminRoleListItem = z.infer<typeof adminRoleListItemSchema>;
export type AdminRoleListResponse = z.infer<typeof adminRoleListResponseSchema>;
export type AdminAccountListItem = z.infer<typeof adminAccountListItemSchema>;
export type AdminAccountListResponse = z.infer<
  typeof adminAccountListResponseSchema
>;
export type AdminRoleAssign = z.infer<typeof adminRoleAssignSchema>;
export type AdminAnnouncement = z.infer<typeof adminAnnouncementSchema>;
export type AdminAnnouncementListResponse = z.infer<
  typeof adminAnnouncementListResponseSchema
>;
export type AdminAnnouncementCreate = z.infer<
  typeof adminAnnouncementCreateSchema
>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableExchangeConnection: false,
  enableSemiAutoTrading: false,
  enableAutoTrading: false,
  enableAuthorPortal: false,
  enableProductionPayments: false,
};
