-- CreateEnum
CREATE TYPE "risk_acceptance_context" AS ENUM (
  'strategy_subscribe',
  'paper_account_create',
  'membership_checkout',
  'membership_invite_redeem'
);

-- CreateEnum
CREATE TYPE "membership_invite_code_status" AS ENUM ('active', 'disabled');

-- CreateTable
CREATE TABLE "user_risk_acceptances" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "disclosure_version" TEXT NOT NULL,
  "context" "risk_acceptance_context" NOT NULL,
  "accepted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_risk_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_invite_codes" (
  "id" UUID NOT NULL,
  "code_normalized" TEXT NOT NULL,
  "code_label" TEXT NOT NULL,
  "tier" "membership_tier" NOT NULL,
  "billing_cycle" TEXT NOT NULL,
  "max_redemptions" INTEGER NOT NULL,
  "redemption_count" INTEGER NOT NULL DEFAULT 0,
  "expires_at" TIMESTAMPTZ(6),
  "status" "membership_invite_code_status" NOT NULL DEFAULT 'active',
  "note" TEXT,
  "created_by_admin_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "membership_invite_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_invite_redemptions" (
  "id" UUID NOT NULL,
  "invite_code_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "subscription_id" UUID,
  "redeemed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "membership_invite_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uniq_user_risk_acceptances_user_version_context"
ON "user_risk_acceptances"("user_id", "disclosure_version", "context");

-- CreateIndex
CREATE INDEX "idx_user_risk_acceptances_user_accepted"
ON "user_risk_acceptances"("user_id", "accepted_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "membership_invite_codes_code_normalized_key"
ON "membership_invite_codes"("code_normalized");

-- CreateIndex
CREATE INDEX "idx_membership_invite_codes_status_created"
ON "membership_invite_codes"("status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uniq_membership_invite_redemptions_code_user"
ON "membership_invite_redemptions"("invite_code_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_membership_invite_redemptions_user"
ON "membership_invite_redemptions"("user_id", "redeemed_at" DESC);

-- AddForeignKey
ALTER TABLE "user_risk_acceptances"
ADD CONSTRAINT "user_risk_acceptances_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_invite_codes"
ADD CONSTRAINT "membership_invite_codes_created_by_admin_id_fkey"
FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_invite_redemptions"
ADD CONSTRAINT "membership_invite_redemptions_invite_code_id_fkey"
FOREIGN KEY ("invite_code_id") REFERENCES "membership_invite_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_invite_redemptions"
ADD CONSTRAINT "membership_invite_redemptions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_invite_redemptions"
ADD CONSTRAINT "membership_invite_redemptions_subscription_id_fkey"
FOREIGN KEY ("subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
