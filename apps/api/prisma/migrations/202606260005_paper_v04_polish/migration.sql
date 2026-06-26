-- AlterTable
ALTER TABLE "paper_accounts" ADD COLUMN "max_drawdown" DECIMAL(18,8) NOT NULL DEFAULT 0;

-- CreateEnum
CREATE TYPE "market_symbol_status" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "market_symbols" (
    "id" UUID NOT NULL,
    "symbol" TEXT NOT NULL,
    "base_asset" TEXT NOT NULL,
    "quote_asset" TEXT NOT NULL,
    "status" "market_symbol_status" NOT NULL DEFAULT 'active',
    "price_precision" INTEGER NOT NULL DEFAULT 2,
    "quantity_precision" INTEGER NOT NULL DEFAULT 8,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "market_symbols_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "market_price_snapshots" (
    "id" UUID NOT NULL,
    "symbol_id" UUID NOT NULL,
    "price" DECIMAL(28,8) NOT NULL,
    "volume" DECIMAL(28,8),
    "change_rate" DECIMAL(18,8),
    "source" TEXT NOT NULL DEFAULT 'seed',
    "captured_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_price_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "market_symbols_symbol_key" ON "market_symbols"("symbol");
CREATE INDEX "idx_market_price_snapshots_symbol_time" ON "market_price_snapshots"("symbol_id", "captured_at" DESC);

ALTER TABLE "market_price_snapshots" ADD CONSTRAINT "market_price_snapshots_symbol_id_fkey" FOREIGN KEY ("symbol_id") REFERENCES "market_symbols"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed MVP symbols
INSERT INTO "market_symbols" ("id", "symbol", "base_asset", "quote_asset", "status", "updated_at")
VALUES
    (gen_random_uuid(), 'BTCUSDT', 'BTC', 'USDT', 'active', CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'ETHUSDT', 'ETH', 'USDT', 'active', CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOLUSDT', 'SOL', 'USDT', 'active', CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BNBUSDT', 'BNB', 'USDT', 'active', CURRENT_TIMESTAMP)
ON CONFLICT ("symbol") DO NOTHING;

-- Seed fresh snapshots from latest active signals per symbol
INSERT INTO "market_price_snapshots" ("id", "symbol_id", "price", "source", "captured_at")
SELECT
    gen_random_uuid(),
    ms.id,
    latest.price,
    'signal-seed',
    CURRENT_TIMESTAMP
FROM "market_symbols" ms
INNER JOIN LATERAL (
    SELECT ss."current_price_snapshot" AS price
    FROM "strategy_signals" ss
    WHERE ss."symbol" = ms."symbol"
      AND ss."status" = 'active'
    ORDER BY ss."generated_at" DESC
    LIMIT 1
) latest ON TRUE;

-- Backfill historical max drawdown from performance points
UPDATE "paper_accounts" pa
SET "max_drawdown" = COALESCE((
    SELECT MAX(ppp."drawdown")
    FROM "paper_performance_points" ppp
    WHERE ppp."account_id" = pa."id"
), 0);
