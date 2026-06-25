-- Seed the MVP production administrator and disable any other pre-existing admin accounts.
-- Admin login never auto-creates users; only active rows in admin_users can receive OTP.

INSERT INTO "admin_users" (
  "id",
  "email_normalized",
  "email",
  "status",
  "created_at",
  "updated_at"
)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'geyaovip@163.com',
  'geyaovip@163.com',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email_normalized") DO UPDATE SET
  "email" = EXCLUDED."email",
  "status" = 'active',
  "updated_at" = CURRENT_TIMESTAMP;

UPDATE "admin_users"
SET
  "status" = 'disabled',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "email_normalized" <> 'geyaovip@163.com';
