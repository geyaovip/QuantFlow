import { z } from "zod";

import { DEFAULT_FEATURE_FLAGS } from "@quantflow/contracts";

const disabledFlag = z
  .literal("false")
  .default("false")
  .transform(() => false as const);

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3002),
  ENABLE_EXCHANGE_CONNECTION: disabledFlag,
  ENABLE_SEMI_AUTO_TRADING: disabledFlag,
  ENABLE_AUTO_TRADING: disabledFlag,
  ENABLE_AUTHOR_PORTAL: disabledFlag,
  ENABLE_PRODUCTION_PAYMENTS: disabledFlag,
  RESEND_API_KEY: z.string().optional().default(""),
  AUTH_EMAIL_FROM: z
    .string()
    .optional()
    .default("QuantFlow <login@example.com>"),
  AUTH_OTP_PEPPER: z.string().optional().default(""),
  AUTH_OTP_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(600),
  AUTH_OTP_RESEND_COOLDOWN_SECONDS: z.coerce
    .number()
    .int()
    .min(10)
    .max(600)
    .default(60),
  AUTH_OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(5),
  AUTH_SESSION_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(3600)
    .max(60 * 60 * 24 * 365)
    .default(60 * 60 * 24 * 365),
  AUTH_ALLOWED_ORIGINS: z
    .string()
    .optional()
    .default("https://quantflow.chat,https://admin.quantflow.chat"),
  AUTH_COOKIE_DOMAIN: z.string().optional().default(""),
  TURNSTILE_SITE_KEY: z.string().optional().default(""),
  TURNSTILE_SECRET_KEY: z.string().optional().default(""),
});

export type AppConfig = ReturnType<typeof loadAppConfig>;

export function loadAppConfig(environment: NodeJS.ProcessEnv = process.env) {
  const parsed = environmentSchema.parse(environment);
  if (parsed.NODE_ENV === "production") {
    const missing = [
      ["RESEND_API_KEY", parsed.RESEND_API_KEY],
      ["AUTH_EMAIL_FROM", parsed.AUTH_EMAIL_FROM],
      ["AUTH_OTP_PEPPER", parsed.AUTH_OTP_PEPPER],
      ["AUTH_COOKIE_DOMAIN", parsed.AUTH_COOKIE_DOMAIN],
      ["TURNSTILE_SITE_KEY", parsed.TURNSTILE_SITE_KEY],
      ["TURNSTILE_SECRET_KEY", parsed.TURNSTILE_SECRET_KEY],
    ].flatMap(([key, value]) => (value ? [] : [key]));
    if (missing.length > 0) {
      throw new Error(`Missing production auth config: ${missing.join(", ")}`);
    }
  }
  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    auth: {
      resendApiKey: parsed.RESEND_API_KEY,
      emailFrom: parsed.AUTH_EMAIL_FROM,
      otpPepper: parsed.AUTH_OTP_PEPPER || "development-only-otp-pepper",
      otpTtlSeconds: parsed.AUTH_OTP_TTL_SECONDS,
      otpResendCooldownSeconds: parsed.AUTH_OTP_RESEND_COOLDOWN_SECONDS,
      otpMaxAttempts: parsed.AUTH_OTP_MAX_ATTEMPTS,
      sessionTtlSeconds: parsed.AUTH_SESSION_TTL_SECONDS,
      allowedOrigins: parsed.AUTH_ALLOWED_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
      cookieDomain: parsed.AUTH_COOKIE_DOMAIN || undefined,
      turnstileSiteKey: parsed.TURNSTILE_SITE_KEY,
      turnstileSecretKey: parsed.TURNSTILE_SECRET_KEY,
    },
    featureFlags: DEFAULT_FEATURE_FLAGS,
  } as const;
}
