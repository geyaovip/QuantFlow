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
  enableProductionPayments: z.literal(false),
});

export const riskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export const membershipTierSchema = z.enum(["free", "pro", "premium"]);
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
  monthlyPriceCny: z.string(),
  yearlyPriceCny: z.string(),
  entitlements: z.array(membershipEntitlementSchema),
});

export const membershipPlanListResponseSchema = z.object({
  data: z.array(membershipPlanSchema),
});

export const membershipSubscriptionSchema = z.object({
  tier: membershipTierSchema,
  planName: z.string(),
  status: z.enum(["active", "expired", "cancelled"]),
  source: z.enum(["manual", "invite", "test"]),
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
  tier: z.enum(["pro", "premium"]),
  billingCycle: z.enum(["monthly", "yearly"]),
  riskAccepted: z.literal(true),
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

export const adminPaperAccountActionSchema = z.object({
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
export type AdminPaperAccountAction = z.infer<
  typeof adminPaperAccountActionSchema
>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableExchangeConnection: false,
  enableSemiAutoTrading: false,
  enableAutoTrading: false,
  enableAuthorPortal: false,
  enableProductionPayments: false,
};
