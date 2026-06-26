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
});

export const strategyDetailResponseSchema = z.object({
  data: strategyDetailSchema,
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

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableExchangeConnection: false,
  enableSemiAutoTrading: false,
  enableAutoTrading: false,
  enableAuthorPortal: false,
  enableProductionPayments: false,
};
