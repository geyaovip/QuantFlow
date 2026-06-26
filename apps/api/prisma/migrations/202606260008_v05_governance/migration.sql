-- CreateEnum
CREATE TYPE "risk_event_status" AS ENUM ('open', 'assigned', 'resolved', 'ignored', 'escalated');

-- CreateEnum
CREATE TYPE "system_announcement_status" AS ENUM ('draft', 'published', 'ended');

-- CreateTable
CREATE TABLE "risk_events" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "level" "risk_level" NOT NULL,
    "status" "risk_event_status" NOT NULL DEFAULT 'open',
    "message" TEXT NOT NULL,
    "user_id" UUID,
    "strategy_id" UUID,
    "signal_id" UUID,
    "paper_account_id" UUID,
    "assignee_admin_id" UUID,
    "resolution" TEXT,
    "handled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "risk_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_announcements" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "system_announcement_status" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "system_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_risk_events_status" ON "risk_events"("status", "level", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "idx_system_announcements_status" ON "system_announcements"("status", "published_at" DESC, "id" DESC);

-- AddForeignKey
ALTER TABLE "risk_events" ADD CONSTRAINT "risk_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_events" ADD CONSTRAINT "risk_events_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_events" ADD CONSTRAINT "risk_events_assignee_admin_id_fkey" FOREIGN KEY ("assignee_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
