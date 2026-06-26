-- CreateEnum
CREATE TYPE "membership_tier" AS ENUM ('free', 'pro', 'premium');

-- CreateEnum
CREATE TYPE "strategy_status" AS ENUM ('draft', 'pending_review', 'active', 'paused', 'risk_watch', 'delisted');

-- CreateEnum
CREATE TYPE "strategy_type" AS ENUM ('spot', 'grid', 'dca', 'trend', 'swing');

-- CreateEnum
CREATE TYPE "risk_level" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "strategy_metric_period" AS ENUM ('seven_days', 'thirty_days', 'ninety_days', 'all_time');

-- CreateEnum
CREATE TYPE "signal_direction" AS ENUM ('buy', 'sell', 'watch');

-- CreateEnum
CREATE TYPE "signal_status" AS ENUM ('active', 'expired', 'cancelled', 'strategy_paused', 'risk_blocked');

-- CreateEnum
CREATE TYPE "strategy_subscription_status" AS ENUM ('active', 'cancelled');

-- CreateTable
CREATE TABLE "strategies" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "type" "strategy_type" NOT NULL,
    "risk_level" "risk_level" NOT NULL,
    "status" "strategy_status" NOT NULL DEFAULT 'draft',
    "required_tier" "membership_tier" NOT NULL DEFAULT 'free',
    "supports_paper_trading" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_versions" (
    "id" UUID NOT NULL,
    "strategy_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "symbols" TEXT[],
    "logic" TEXT NOT NULL,
    "suitable_market" TEXT NOT NULL,
    "unsuitable_market" TEXT NOT NULL,
    "position_sizing" TEXT NOT NULL,
    "stop_loss_logic" TEXT NOT NULL,
    "take_profit_logic" TEXT NOT NULL,
    "failure_modes" TEXT NOT NULL,
    "data_source" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_metrics" (
    "id" UUID NOT NULL,
    "strategy_id" UUID NOT NULL,
    "strategy_version_id" UUID NOT NULL,
    "period" "strategy_metric_period" NOT NULL,
    "return_rate" NUMERIC(18,8) NOT NULL,
    "max_drawdown" NUMERIC(18,8) NOT NULL,
    "win_rate" NUMERIC(18,8) NOT NULL,
    "profit_loss_ratio" NUMERIC(18,8) NOT NULL,
    "trade_count" INTEGER NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "data_source" TEXT NOT NULL,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "strategy_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_signals" (
    "id" UUID NOT NULL,
    "strategy_id" UUID NOT NULL,
    "strategy_version_id" UUID NOT NULL,
    "symbol" TEXT NOT NULL,
    "direction" "signal_direction" NOT NULL,
    "trigger_price" NUMERIC(28,8) NOT NULL,
    "current_price_snapshot" NUMERIC(28,8) NOT NULL,
    "suggested_position_pct" NUMERIC(18,8) NOT NULL,
    "stop_loss_price" NUMERIC(28,8) NOT NULL,
    "take_profit_price" NUMERIC(28,8) NOT NULL,
    "rationale" TEXT NOT NULL,
    "status" "signal_status" NOT NULL DEFAULT 'active',
    "risk_level" "risk_level" NOT NULL,
    "generated_at" TIMESTAMPTZ(6) NOT NULL,
    "valid_until" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "strategy_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_strategy_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "strategy_id" UUID NOT NULL,
    "status" "strategy_subscription_status" NOT NULL DEFAULT 'active',
    "subscribed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_strategy_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" UUID NOT NULL,
    "actor_admin_id" UUID,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" UUID,
    "strategy_id" UUID,
    "reason" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "strategies_slug_key" ON "strategies"("slug");

-- CreateIndex
CREATE INDEX "idx_strategies_list" ON "strategies"("status", "risk_level", "published_at" DESC, "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_strategy_versions_version" ON "strategy_versions"("strategy_id", "version");

-- CreateIndex
CREATE INDEX "idx_strategy_versions_latest" ON "strategy_versions"("strategy_id", "version" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uniq_strategy_metrics_snapshot" ON "strategy_metrics"("strategy_version_id", "period", "data_source", "calculated_at");

-- CreateIndex
CREATE INDEX "idx_strategy_metrics_latest" ON "strategy_metrics"("strategy_id", "period", "calculated_at" DESC);

-- CreateIndex
CREATE INDEX "idx_strategy_signals_list" ON "strategy_signals"("status", "generated_at" DESC, "id");

-- CreateIndex
CREATE INDEX "idx_strategy_signals_strategy" ON "strategy_signals"("strategy_id", "status", "generated_at" DESC, "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_user_strategy_subscription" ON "user_strategy_subscriptions"("user_id", "strategy_id");

-- CreateIndex
CREATE INDEX "idx_user_strategy_subscriptions_user" ON "user_strategy_subscriptions"("user_id", "status", "subscribed_at" DESC, "id");

-- CreateIndex
CREATE INDEX "idx_user_strategy_subscriptions_strategy" ON "user_strategy_subscriptions"("strategy_id", "status");

-- CreateIndex
CREATE INDEX "idx_admin_audit_actor" ON "admin_audit_logs"("actor_admin_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "idx_admin_audit_resource" ON "admin_audit_logs"("resource_type", "resource_id", "created_at" DESC, "id" DESC);

-- AddForeignKey
ALTER TABLE "strategy_versions" ADD CONSTRAINT "strategy_versions_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_metrics" ADD CONSTRAINT "strategy_metrics_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_metrics" ADD CONSTRAINT "strategy_metrics_strategy_version_id_fkey" FOREIGN KEY ("strategy_version_id") REFERENCES "strategy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_signals" ADD CONSTRAINT "strategy_signals_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_signals" ADD CONSTRAINT "strategy_signals_strategy_version_id_fkey" FOREIGN KEY ("strategy_version_id") REFERENCES "strategy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_strategy_subscriptions" ADD CONSTRAINT "user_strategy_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_strategy_subscriptions" ADD CONSTRAINT "user_strategy_subscriptions_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_admin_id_fkey" FOREIGN KEY ("actor_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed active free strategies for the first user-facing read slice.
INSERT INTO "strategies" ("id", "slug", "name", "summary", "type", "risk_level", "status", "required_tier", "supports_paper_trading", "published_at", "created_at", "updated_at")
VALUES
  ('11111111-1111-4111-8111-111111111111', 'btc-trend', 'BTC 趋势过滤', '结合中期趋势与波动过滤，重点观察震荡阶段的信号失效率。', 'trend', 'medium', 'active', 'free', true, '2026-06-26T02:40:00Z', '2026-06-26T02:40:00Z', '2026-06-26T02:40:00Z'),
  ('22222222-2222-4222-8222-222222222222', 'eth-breakout', 'ETH 波动突破', '观察波动扩张后的价格延续，使用固定失效条件控制风险。', 'spot', 'medium', 'active', 'free', true, '2026-06-26T02:35:00Z', '2026-06-26T02:35:00Z', '2026-06-26T02:35:00Z'),
  ('33333333-3333-4333-8333-333333333333', 'sol-mean', 'SOL 均值观察', '在流动性与行情有效的前提下观察短周期偏离与回归。', 'swing', 'low', 'active', 'free', true, '2026-06-26T02:20:00Z', '2026-06-26T02:20:00Z', '2026-06-26T02:20:00Z')
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "strategy_versions" ("id", "strategy_id", "version", "symbols", "logic", "suitable_market", "unsuitable_market", "position_sizing", "stop_loss_logic", "take_profit_logic", "failure_modes", "data_source", "created_at")
VALUES
  ('11111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', 1, ARRAY['BTCUSDT'], '使用中期均线方向、波动过滤和成交活跃度确认趋势环境，仅输出观察信号。', '趋势方向清晰、波动率稳定放大的行情。', '低流动性、快速反复拉扯或突发行情阶段。', '单个模拟信号建议仓位不超过 10%，不使用杠杆。', '价格跌破趋势过滤阈值或触发固定失效条件时停止观察。', '达到分段目标或趋势动能明显衰减时止盈观察。', '震荡反复、流动性骤降和重大消息冲击可能导致信号失效。', 'platform_seed_v1', '2026-06-26T02:40:00Z'),
  ('22222222-2222-4222-8222-222222222223', '22222222-2222-4222-8222-222222222222', 1, ARRAY['ETHUSDT'], '观察波动扩张后的突破延续，并用固定失效价格控制回撤。', '突破后成交活跃、价格延续性较强的行情。', '假突破密集、波动收缩或方向频繁切换的行情。', '单个模拟信号建议仓位不超过 8%，不使用杠杆。', '跌回突破区间或触发固定止损价格时停止观察。', '达到目标区间或波动明显回落时止盈观察。', '假突破、短时插针和行情快速收缩可能导致信号失效。', 'platform_seed_v1', '2026-06-26T02:35:00Z'),
  ('33333333-3333-4333-8333-333333333334', '33333333-3333-4333-8333-333333333333', 1, ARRAY['SOLUSDT'], '观察短周期价格偏离后的均值回归机会，并要求样本持续补充。', '波动回落、价格围绕区间中枢运行的行情。', '单边趋势过强或流动性快速下降的行情。', '单个模拟信号建议仓位不超过 6%，不使用杠杆。', '偏离继续扩大并突破失效边界时停止观察。', '价格回归区间中枢或样本条件变化时止盈观察。', '趋势加速、低流动性和样本不足会降低参考价值。', 'platform_seed_v1', '2026-06-26T02:20:00Z')
ON CONFLICT ("strategy_id", "version") DO NOTHING;

INSERT INTO "strategy_metrics" ("id", "strategy_id", "strategy_version_id", "period", "return_rate", "max_drawdown", "win_rate", "profit_loss_ratio", "trade_count", "sample_size", "data_source", "calculated_at")
VALUES
  ('11111111-1111-4111-8111-111111111113', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111112', 'ninety_days', 0.12800000, -0.06400000, 0.58200000, 1.46000000, 67, 67, 'platform_seed_v1', '2026-06-26T02:40:00Z'),
  ('22222222-2222-4222-8222-222222222224', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222223', 'ninety_days', 0.08600000, -0.04900000, 0.54700000, 1.39000000, 53, 53, 'platform_seed_v1', '2026-06-26T02:35:00Z'),
  ('33333333-3333-4333-8333-333333333335', '33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333334', 'ninety_days', 0.05100000, -0.03200000, 0.61000000, 1.21000000, 41, 41, 'platform_seed_v1', '2026-06-26T02:20:00Z')
ON CONFLICT ("strategy_version_id", "period", "data_source", "calculated_at") DO NOTHING;

INSERT INTO "strategy_signals" ("id", "strategy_id", "strategy_version_id", "symbol", "direction", "trigger_price", "current_price_snapshot", "suggested_position_pct", "stop_loss_price", "take_profit_price", "rationale", "status", "risk_level", "generated_at", "valid_until", "created_at", "updated_at")
VALUES
  ('11111111-1111-4111-8111-111111111114', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111112', 'BTCUSDT', 'watch', 64250.00000000, 64580.00000000, 0.10000000, 61100.00000000, 68200.00000000, '趋势过滤仍处于观察区间，价格未触发失效边界。该信号仅用于模拟验证，不构成投资建议。', 'active', 'medium', '2026-06-26T02:40:00Z', '2026-06-27T02:40:00Z', '2026-06-26T02:40:00Z', '2026-06-26T02:40:00Z'),
  ('22222222-2222-4222-8222-222222222225', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222223', 'ETHUSDT', 'watch', 3480.00000000, 3512.00000000, 0.08000000, 3310.00000000, 3720.00000000, '波动扩张后仍需等待确认，当前仅保留观察信号。', 'active', 'medium', '2026-06-26T02:35:00Z', '2026-06-27T02:35:00Z', '2026-06-26T02:35:00Z', '2026-06-26T02:35:00Z')
ON CONFLICT ("id") DO NOTHING;
