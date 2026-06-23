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
});

export type AppConfig = ReturnType<typeof loadAppConfig>;

export function loadAppConfig(environment: NodeJS.ProcessEnv = process.env) {
  const parsed = environmentSchema.parse(environment);
  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    featureFlags: DEFAULT_FEATURE_FLAGS,
  } as const;
}
