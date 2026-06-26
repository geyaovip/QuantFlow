CREATE TYPE "membership_plan_status" AS ENUM ('active', 'inactive');
CREATE TYPE "user_subscription_status" AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE "user_subscription_source" AS ENUM ('manual', 'invite', 'test');

CREATE TABLE "membership_plans" (
    "id" UUID NOT NULL,
    "tier" "membership_tier" NOT NULL,
    "name" TEXT NOT NULL,
    "monthly_price_cny" DECIMAL(10,2) NOT NULL,
    "yearly_price_cny" DECIMAL(10,2) NOT NULL,
    "display_order" INTEGER NOT NULL,
    "status" "membership_plan_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "membership_entitlements" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value_type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "membership_entitlements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "user_subscription_status" NOT NULL DEFAULT 'active',
    "source" "user_subscription_source" NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "cancelled_at" TIMESTAMPTZ(6),
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "membership_plans_tier_key" ON "membership_plans"("tier");
CREATE UNIQUE INDEX "uniq_membership_entitlements_plan_key" ON "membership_entitlements"("plan_id", "key");
CREATE INDEX "idx_user_subscriptions_user" ON "user_subscriptions"("user_id", "status", "ends_at" DESC, "id" DESC);

ALTER TABLE "membership_entitlements" ADD CONSTRAINT "membership_entitlements_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "membership_plans" ("id", "tier", "name", "monthly_price_cny", "yearly_price_cny", "display_order", "status", "created_at", "updated_at")
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'free', 'Free', 0.00, 0.00, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'pro', 'Pro', 69.00, 699.00, 2, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'premium', 'Premium', 199.00, 1999.00, 3, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("tier") DO NOTHING;

INSERT INTO "membership_entitlements" ("id", "plan_id", "key", "value_type", "value", "created_at", "updated_at")
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'strategy_subscriptions_max', 'int', '3', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'paper_accounts_max', 'int', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'history_days', 'int', '30', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'strategy_subscriptions_max', 'int', '20', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb02', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'paper_accounts_max', 'int', '10', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb03', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'history_days', 'int', '365', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccc01', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'strategy_subscriptions_max', 'int', '50', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccc02', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'paper_accounts_max', 'int', '30', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccc03', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'history_days', 'int', '730', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("plan_id", "key") DO NOTHING;

INSERT INTO "strategy_metrics" ("id", "strategy_id", "strategy_version_id", "period", "return_rate", "max_drawdown", "win_rate", "profit_loss_ratio", "trade_count", "sample_size", "data_source", "calculated_at")
VALUES
  ('11111111-1111-4111-8111-111111111115', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111112', 'seven_days', 0.03200000, -0.01800000, 0.57100000, 1.32000000, 14, 14, 'platform_seed_v1', '2026-06-26T02:40:00Z'),
  ('11111111-1111-4111-8111-111111111116', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111112', 'thirty_days', 0.06800000, -0.04100000, 0.57900000, 1.41000000, 28, 28, 'platform_seed_v1', '2026-06-26T02:40:00Z')
ON CONFLICT ("strategy_version_id", "period", "data_source", "calculated_at") DO NOTHING;
