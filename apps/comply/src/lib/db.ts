/**
 * Jurisdiction-aware Drizzle DB client for the comply app (Phase B of the
 * data-sovereignty plan — docs/canada-data-sovereignty-strategy.md).
 *
 * The DB is selected by the deployment's JURISDICTION so a `ca` deployment
 * connects to the Canadian (ca-central-1) database and never the US default.
 * `resolveDatabaseUrl` throws for residency-strict jurisdictions (e.g. `ca`)
 * whose region-scoped URL is unset — a deliberate fail-loud so residency-
 * protected data never routes out of its region.
 *
 * Returns null (dev in-memory fallback) only for non-strict jurisdictions with
 * no URL configured.
 */

import { createDb, resolveDatabaseUrl } from '@taurus/db'

const _dbByJurisdiction = new Map<string, ReturnType<typeof createDb>>()

export function getDb(): ReturnType<typeof createDb> | null {
  const jurisdiction = process.env['JURISDICTION'] ?? 'na'

  const cached = _dbByJurisdiction.get(jurisdiction)
  if (cached) return cached

  const url = resolveDatabaseUrl(jurisdiction)
  if (!url) return null

  const db = createDb(url)
  _dbByJurisdiction.set(jurisdiction, db)
  return db
}
