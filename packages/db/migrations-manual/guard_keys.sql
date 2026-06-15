-- ============================================================================
-- Manual migration: guard_keys (GRIDERA|Guard API keys)
-- ============================================================================
-- WHY THIS IS A STANDALONE FILE (not in src/migrations/):
--   drizzle-kit `db:push` diffs the ENTIRE schema against the live DB, so it
--   would also create the drifted `policies` table and add the `audit_trail`
--   observability columns. To keep the Guard launch isolated, apply ONLY this
--   file directly and do NOT run `pnpm --filter @taurus/db db:push` until the
--   policies/audit_trail drift is intentionally migrated.
--
-- HOW TO APPLY (run from repo root, DATABASE_URL in .env.local):
--   psql "$DATABASE_URL" -f packages/db/migrations-manual/guard_keys.sql
--
-- IDEMPOTENT: safe to re-run. CREATE TABLE IF NOT EXISTS + guarded unique index.
-- DDL is kept in parity with packages/db/src/schema/guard-keys.ts.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "guard_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"api_key_hash" text NOT NULL,
	"api_key_prefix" text NOT NULL,
	"tier" text DEFAULT 'sandbox' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"monthly_limit" integer DEFAULT 1000 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	CONSTRAINT "guard_keys_email_unique" UNIQUE("email")
);

-- NOTE: auth.ts looks up every protected request by api_key_hash. An index on
-- that column would help at scale, but it is intentionally omitted here to stay
-- in exact parity with src/schema/guard-keys.ts (which defines no such index).
-- Adding it only in SQL would create reverse drift that a later `db:push` would
-- try to drop. To add it: define it in the schema AND regenerate, together.
