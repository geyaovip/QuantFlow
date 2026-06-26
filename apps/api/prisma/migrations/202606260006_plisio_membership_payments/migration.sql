ALTER TYPE "user_subscription_source" ADD VALUE IF NOT EXISTS 'plisio';

CREATE TABLE "membership_payments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "tier" "membership_tier" NOT NULL,
    "billing_cycle" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'plisio',
    "provider_invoice_id" TEXT,
    "status" TEXT NOT NULL,
    "amount_cny" DECIMAL(10,2) NOT NULL,
    "source_currency" TEXT NOT NULL DEFAULT 'CNY',
    "allowed_psys_cids" TEXT[],
    "invoice_url" TEXT,
    "raw_payload" JSONB,
    "expires_at" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "membership_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "membership_payments_provider_invoice_id_key" ON "membership_payments"("provider_invoice_id");
CREATE INDEX "idx_membership_payments_user" ON "membership_payments"("user_id", "created_at" DESC, "id" DESC);
CREATE INDEX "idx_membership_payments_provider_invoice" ON "membership_payments"("provider", "provider_invoice_id");
CREATE INDEX "idx_membership_payments_status" ON "membership_payments"("status", "created_at" DESC);

ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
