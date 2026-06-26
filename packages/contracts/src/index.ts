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
});

export const featureFlagsSchema = z.object({
  enableExchangeConnection: z.literal(false),
  enableSemiAutoTrading: z.literal(false),
  enableAutoTrading: z.literal(false),
  enableAuthorPortal: z.literal(false),
  enableProductionPayments: z.literal(false),
});

export type EmailOtpRequest = z.infer<typeof emailOtpRequestSchema>;
export type EmailOtpRequestResponse = z.infer<
  typeof emailOtpRequestResponseSchema
>;
export type EmailOtpVerify = z.infer<typeof emailOtpVerifySchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableExchangeConnection: false,
  enableSemiAutoTrading: false,
  enableAutoTrading: false,
  enableAuthorPortal: false,
  enableProductionPayments: false,
};
