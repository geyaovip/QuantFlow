ALTER TYPE "membership_tier" RENAME VALUE 'pro' TO 'plus';
ALTER TYPE "membership_tier" RENAME VALUE 'premium' TO 'pro';

ALTER TABLE "membership_plans" RENAME COLUMN "monthly_price_cny" TO "monthly_price_usd";
ALTER TABLE "membership_plans" RENAME COLUMN "yearly_price_cny" TO "yearly_price_usd";

ALTER TABLE "membership_payments" RENAME COLUMN "amount_cny" TO "amount_usd";
ALTER TABLE "membership_payments" ALTER COLUMN "source_currency" SET DEFAULT 'USD';

UPDATE "membership_plans"
SET
  "name" = 'Free',
  "monthly_price_usd" = 0.00,
  "yearly_price_usd" = 0.00,
  "display_order" = 1,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "tier" = 'free';

UPDATE "membership_plans"
SET
  "name" = 'Plus',
  "monthly_price_usd" = 4.90,
  "yearly_price_usd" = 49.00,
  "display_order" = 2,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "tier" = 'plus';

UPDATE "membership_plans"
SET
  "name" = 'Pro',
  "monthly_price_usd" = 9.90,
  "yearly_price_usd" = 99.00,
  "display_order" = 3,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "tier" = 'pro';

UPDATE "membership_payments"
SET "source_currency" = 'USD'
WHERE "source_currency" = 'CNY';
