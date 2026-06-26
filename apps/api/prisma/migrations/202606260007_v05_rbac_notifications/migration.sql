-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('system', 'signal', 'risk', 'membership');

-- CreateEnum
CREATE TYPE "notification_channel" AS ENUM ('in_app');

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel" "notification_channel" NOT NULL,
    "type" "notification_type" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_permissions" (
    "id" UUID NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admin_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_user_roles" (
    "admin_user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_user_roles_pkey" PRIMARY KEY ("admin_user_id","role_id")
);

-- CreateTable
CREATE TABLE "admin_role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateIndex
CREATE INDEX "idx_user_notifications_user" ON "user_notifications"("user_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uniq_notification_preferences_user_channel_type" ON "notification_preferences"("user_id", "channel", "type");

-- CreateIndex
CREATE UNIQUE INDEX "admin_roles_name_key" ON "admin_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_admin_permissions_resource_action" ON "admin_permissions"("resource", "action");

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_user_roles" ADD CONSTRAINT "admin_user_roles_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_user_roles" ADD CONSTRAINT "admin_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "admin_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "admin_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "admin_permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed admin permissions
INSERT INTO "admin_permissions" ("id", "resource", "action", "description", "created_at", "updated_at") VALUES
  ('10000000-0000-4000-8000-000000000001', 'dashboard', 'read', '查看数据看板', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000002', 'users', 'read', '查看用户', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000003', 'users', 'write', '变更用户状态', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000004', 'strategies', 'read', '查看策略', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000005', 'strategies', 'write', '治理策略', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000006', 'signals', 'read', '查看信号', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000007', 'signals', 'write', '治理信号', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000008', 'paper_accounts', 'read', '查看模拟盘', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000009', 'paper_accounts', 'write', '治理模拟盘', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-00000000000a', 'membership', 'read', '查看会员', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-00000000000b', 'membership', 'write', '治理会员', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-00000000000c', 'risk', 'read', '查看风险事件', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-00000000000d', 'risk', 'write', '处理风险事件', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-00000000000e', 'roles', 'manage', '管理角色与授权', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-00000000000f', 'audit_logs', 'read', '查看审计日志', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed admin roles
INSERT INTO "admin_roles" ("id", "name", "description", "created_at", "updated_at") VALUES
  ('20000000-0000-4000-8000-000000000001', 'super_admin', '超级管理员', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000002', 'operations_admin', '运营管理员', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000003', 'risk_admin', '风控管理员', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000004', 'support_admin', '客服管理员', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000005', 'readonly_admin', '只读管理员', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- super_admin: all permissions
INSERT INTO "admin_role_permissions" ("role_id", "permission_id", "created_at")
SELECT '20000000-0000-4000-8000-000000000001', "id", CURRENT_TIMESTAMP FROM "admin_permissions";

-- operations_admin
INSERT INTO "admin_role_permissions" ("role_id", "permission_id", "created_at") VALUES
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000004', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000005', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000006', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000007', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000008', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-00000000000a', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-00000000000f', CURRENT_TIMESTAMP);

-- risk_admin
INSERT INTO "admin_role_permissions" ("role_id", "permission_id", "created_at") VALUES
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000004', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000005', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000006', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000007', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000008', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000009', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-00000000000c', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-00000000000d', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-00000000000f', CURRENT_TIMESTAMP);

-- support_admin
INSERT INTO "admin_role_permissions" ("role_id", "permission_id", "created_at") VALUES
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-00000000000a', CURRENT_TIMESTAMP),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000008', CURRENT_TIMESTAMP);

-- readonly_admin: all read permissions
INSERT INTO "admin_role_permissions" ("role_id", "permission_id", "created_at")
SELECT '20000000-0000-4000-8000-000000000005', "id", CURRENT_TIMESTAMP
FROM "admin_permissions"
WHERE "action" = 'read';

-- Assign super_admin to MVP production administrator
INSERT INTO "admin_user_roles" ("admin_user_id", "role_id", "created_at")
VALUES (
  '00000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;
