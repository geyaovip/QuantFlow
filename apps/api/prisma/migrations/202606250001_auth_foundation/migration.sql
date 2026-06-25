-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'disabled', 'risk_watch', 'deleting');

-- CreateEnum
CREATE TYPE "admin_user_status" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "auth_portal" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "auth_session_audience" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "security_event_type" AS ENUM ('auth_otp_requested', 'auth_otp_sent', 'auth_otp_send_failed', 'auth_otp_verified', 'auth_otp_failed', 'auth_session_created', 'auth_logout');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email_normalized" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "user_status" NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "email_normalized" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "admin_user_status" NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_email_challenges" (
    "id" UUID NOT NULL,
    "email_normalized" TEXT NOT NULL,
    "email_hash" TEXT NOT NULL,
    "portal" "auth_portal" NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "requested_ip" TEXT,
    "requested_ua" TEXT,
    "resend_message_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "auth_email_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "audience" "auth_session_audience" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "last_seen_at" TIMESTAMPTZ(6),
    "created_ip" TEXT,
    "created_ua" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_security_events" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "email_normalized" TEXT,
    "event_type" "security_event_type" NOT NULL,
    "portal" "auth_portal",
    "ip" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_security_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_normalized_key" ON "users"("email_normalized");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_normalized_key" ON "admin_users"("email_normalized");

-- CreateIndex
CREATE INDEX "idx_auth_email_challenges_lookup" ON "auth_email_challenges"("email_normalized", "portal", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "idx_auth_email_challenges_expires" ON "auth_email_challenges"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_token_hash_key" ON "auth_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "idx_auth_sessions_subject" ON "auth_sessions"("subject_id", "audience", "revoked_at");

-- CreateIndex
CREATE INDEX "idx_auth_sessions_expires" ON "auth_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "idx_user_security_events_user" ON "user_security_events"("user_id", "occurred_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "idx_user_security_events_email" ON "user_security_events"("email_normalized", "occurred_at" DESC, "id" DESC);

-- AddForeignKey
ALTER TABLE "user_security_events" ADD CONSTRAINT "user_security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
