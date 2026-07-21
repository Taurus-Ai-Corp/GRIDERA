import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeon, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index'

type Schema = typeof schema

// Neon's serverless HTTP driver only speaks to Neon. Non-Neon Postgres — e.g.
// the Canadian Supabase database used for data residency (see
// docs/canada-data-sovereignty-strategy.md) — connects with postgres.js over
// the connection pooler instead. Route by the connection host so callers keep
// passing a plain URL and never pick a driver themselves.
function isNeonUrl(databaseUrl: string): boolean {
  return databaseUrl.includes('neon.tech')
}

export function createDb(databaseUrl: string): NeonHttpDatabase<Schema> {
  if (isNeonUrl(databaseUrl)) {
    return drizzleNeon(neon(databaseUrl), { schema })
  }
  // Supabase / standard Postgres via the pooler. prepare:false is required for
  // Supabase's transaction-mode pooler (port 6543), which does not support
  // prepared statements. The result is a PgDatabase over the same schema with an
  // identical query API, so we present one return type; the cast is safe because
  // callers only use standard drizzle CRUD, supported by both drivers.
  const client = postgres(databaseUrl, { prepare: false })
  return drizzlePostgres(client, { schema }) as unknown as NeonHttpDatabase<Schema>
}

export type Database = ReturnType<typeof createDb>
