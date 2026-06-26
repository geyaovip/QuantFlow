-- CreateEnum
CREATE TYPE "paper_account_status" AS ENUM ('running', 'paused', 'ended', 'data_error', 'strategy_paused');
CREATE TYPE "paper_order_side" AS ENUM ('buy', 'sell');
CREATE TYPE "paper_order_type" AS ENUM ('market');
CREATE TYPE "paper_order_status" AS ENUM ('pending', 'filled', 'cancelled', 'rejected');
CREATE TYPE "paper_position_status" AS ENUM ('open', 'closed');

-- CreateTable
CREATE TABLE "paper_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "strategy_id" UUID NOT NULL,
    "strategy_version_id" UUID NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initial_balance" DECIMAL(28,8) NOT NULL,
    "cash_balance" DECIMAL(28,8) NOT NULL,
    "current_equity" DECIMAL(28,8) NOT NULL,
    "peak_equity" DECIMAL(28,8) NOT NULL,
    "max_position_pct" DECIMAL(18,8) NOT NULL,
    "max_positions" INTEGER NOT NULL,
    "leverage" INTEGER NOT NULL DEFAULT 1,
    "engine_version" TEXT NOT NULL DEFAULT 'paper-engine-v1',
    "status" "paper_account_status" NOT NULL DEFAULT 'running',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paused_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "paper_accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "paper_accounts_leverage_check" CHECK ("leverage" = 1)
);

CREATE TABLE "paper_positions" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" "paper_order_side" NOT NULL DEFAULT 'buy',
    "quantity" DECIMAL(28,8) NOT NULL,
    "average_price" DECIMAL(28,8) NOT NULL,
    "mark_price" DECIMAL(28,8) NOT NULL,
    "unrealized_pnl" DECIMAL(28,8) NOT NULL,
    "status" "paper_position_status" NOT NULL DEFAULT 'open',
    "opened_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "paper_positions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "paper_orders" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "signal_id" UUID,
    "side" "paper_order_side" NOT NULL,
    "type" "paper_order_type" NOT NULL DEFAULT 'market',
    "price" DECIMAL(28,8),
    "quantity" DECIMAL(28,8) NOT NULL,
    "status" "paper_order_status" NOT NULL DEFAULT 'pending',
    "reject_reason" TEXT,
    "engine_snapshot" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "paper_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "paper_trades" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "price" DECIMAL(28,8) NOT NULL,
    "quantity" DECIMAL(28,8) NOT NULL,
    "fee" DECIMAL(28,8) NOT NULL,
    "realized_pnl" DECIMAL(28,8) NOT NULL DEFAULT 0,
    "executed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paper_trades_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "paper_performance_points" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "equity" DECIMAL(28,8) NOT NULL,
    "return_rate" DECIMAL(18,8) NOT NULL,
    "drawdown" DECIMAL(18,8) NOT NULL,
    "position_count" INTEGER NOT NULL,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paper_performance_points_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "paper_risk_events" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "risk_level" "risk_level" NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paper_risk_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_paper_accounts_user" ON "paper_accounts"("user_id", "status", "created_at" DESC, "id" DESC);
CREATE INDEX "idx_paper_positions_account" ON "paper_positions"("account_id", "status");
CREATE INDEX "idx_paper_orders_account" ON "paper_orders"("account_id", "created_at" DESC, "id" DESC);
CREATE UNIQUE INDEX "paper_trades_order_id_key" ON "paper_trades"("order_id");
CREATE INDEX "idx_paper_trades_account" ON "paper_trades"("account_id", "executed_at" DESC, "id" DESC);
CREATE UNIQUE INDEX "uniq_paper_performance_points_account_time" ON "paper_performance_points"("account_id", "recorded_at");
CREATE INDEX "idx_paper_performance_points_account" ON "paper_performance_points"("account_id", "recorded_at" DESC);
CREATE INDEX "idx_paper_risk_events_account" ON "paper_risk_events"("account_id", "occurred_at" DESC, "id" DESC);

-- AddForeignKey
ALTER TABLE "paper_accounts" ADD CONSTRAINT "paper_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "paper_accounts" ADD CONSTRAINT "paper_accounts_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "paper_accounts" ADD CONSTRAINT "paper_accounts_strategy_version_id_fkey" FOREIGN KEY ("strategy_version_id") REFERENCES "strategy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "paper_positions" ADD CONSTRAINT "paper_positions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "paper_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "paper_orders" ADD CONSTRAINT "paper_orders_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "paper_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "paper_orders" ADD CONSTRAINT "paper_orders_signal_id_fkey" FOREIGN KEY ("signal_id") REFERENCES "strategy_signals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "paper_trades" ADD CONSTRAINT "paper_trades_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "paper_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "paper_trades" ADD CONSTRAINT "paper_trades_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "paper_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "paper_performance_points" ADD CONSTRAINT "paper_performance_points_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "paper_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "paper_risk_events" ADD CONSTRAINT "paper_risk_events_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "paper_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
