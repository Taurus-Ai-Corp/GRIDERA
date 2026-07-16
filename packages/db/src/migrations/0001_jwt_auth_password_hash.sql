-- JWT auth migration (2026-07-16)
-- Clerk removed from app; first-party JWT needs password_hash and nullable clerk_id.
-- Production EU Neon applied via psql 2026-07-16.

ALTER TABLE "users" ALTER COLUMN "clerk_id" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;
