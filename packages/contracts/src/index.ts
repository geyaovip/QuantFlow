import { z } from "zod";

export const portalSchema = z.enum(["user", "admin"]);

export const emailOtpRequestSchema = z.object({
  email: z.email(),
  portal: portalSchema,
  turnstileToken: z.string().min(1).optional(),
});

export const featureFlagsSchema = z.object({
  enableExchangeConnection: z.literal(false),
  enableSemiAutoTrading: z.literal(false),
  enableAutoTrading: z.literal(false),
  enableAuthorPortal: z.literal(false),
  enableProductionPayments: z.literal(false),
});

export type EmailOtpRequest = z.infer<typeof emailOtpRequestSchema>;
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableExchangeConnection: false,
  enableSemiAutoTrading: false,
  enableAutoTrading: false,
  enableAuthorPortal: false,
  enableProductionPayments: false,
};
