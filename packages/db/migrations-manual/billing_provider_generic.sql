-- ============================================================================
-- Manual migration: billing provider abstraction (Stripe replacement, Phase 0)
-- ============================================================================
-- WHY THIS IS A STANDALONE FILE (not in src/migrations/):
--   drizzle-kit `db:push` diffs the ENTIRE schema against the live DB, so it
--   would also touch the drifted `policies` table and `audit_trail` columns
--   (see migrations-manual/guard_keys.sql). To keep the payments refactor
--   isolated, apply ONLY this file directly and do NOT run
--   `pnpm --filter @taurus/db db:push` until that drift is intentionally migrated.
--
-- WHAT IT DOES (additive + non-destructive — no live payment path changes):
--   1. Adds generic `provider` and `provider_event_id` columns.
--   2. Backfills existing rows: provider='stripe', provider_event_id=stripe_event_id.
--   3. Adds the unique constraint drizzle expects (name matches .unique() default,
--      so a later db:push sees parity and won't try to recreate it).
--   `stripe_event_id` is INTENTIONALLY KEPT (deprecated, dropped only in Phase 5),
--   so every current reader of stripeEventId keeps working.
--
-- HOW TO APPLY:
--   Neon blocks psql/TCP 5432 from the agent shell (see memory:
--   neon_5432_blocked_use_http_driver) — apply via the @neondatabase/serverless
--   HTTP driver, or from an environment where 5432 is reachable:
--     psql "$DATABASE_URL" -f packages/db/migrations-manual/billing_provider_generic.sql
--   NOTE: `.env.local` may contain a duplicate empty DATABASE_URL — use the last
--   non-empty value.
--
-- IDEMPOTENT: safe to re-run (ADD COLUMN IF NOT EXISTS + guarded constraint +
--   COALESCE backfill that never overwrites an already-set value).
-- Kept in parity with packages/db/src/schema/billing.ts.
-- ============================================================================

-- 1. Generic provider columns (nullable, additive)
ALTER TABLE "billing" ADD COLUMN IF NOT EXISTS "provider" text;
ALTER TABLE "billing" ADD COLUMN IF NOT EXISTS "provider_event_id" text;

-- 2. Backfill from legacy stripe_event_id, without overwriting anything already set
UPDATE "billing"
   SET "provider"          = COALESCE("provider", 'stripe'),
       "provider_event_id" = COALESCE("provider_event_id", "stripe_event_id")
 WHERE "stripe_event_id" IS NOT NULL
   AND ("provider_event_id" IS NULL OR "provider" IS NULL);

-- 3. Unique constraint on provider_event_id — name matches drizzle's default for
--    a .unique() column (billing_provider_event_id_unique) to avoid reverse drift.
--    Postgres UNIQUE already permits multiple NULL rows, so unsettled rows are fine.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'billing_provider_event_id_unique'
  ) THEN
    ALTER TABLE "billing"
      ADD CONSTRAINT "billing_provider_event_id_unique" UNIQUE ("provider_event_id");
  END IF;
END $$;

-- ============================================================================
-- ROLLBACK (manual, fully reverses the above — run only if backing out Phase 0):
--   ALTER TABLE "billing" DROP CONSTRAINT IF EXISTS "billing_provider_event_id_unique";
--   ALTER TABLE "billing" DROP COLUMN IF EXISTS "provider_event_id";
--   ALTER TABLE "billing" DROP COLUMN IF EXISTS "provider";
-- (stripe_event_id and all existing data are untouched by this migration.)
-- ============================================================================
