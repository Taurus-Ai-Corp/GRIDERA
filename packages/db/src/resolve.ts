/**
 * Resolve the database connection URL for a jurisdiction (Phase B of the
 * data-sovereignty plan — docs/canada-data-sovereignty-strategy.md).
 *
 * Data-residency jurisdictions (RESIDENCY_STRICT) MUST use their own
 * region-scoped database and must NEVER silently fall back to the generic
 * DATABASE_URL — that would route residency-protected data (e.g. Canadian PII)
 * out of its region. For those, a missing region URL is a hard failure.
 *
 * Non-strict jurisdictions prefer their region-scoped URL if present, else fall
 * back to the generic DATABASE_URL (backward compatible with single-DB deploys).
 */

// 'ca' is enforced now: Canadian data must stay in ca-central-1, and the CA
// deployment is new so requiring DATABASE_URL_CA breaks nothing.
// 'eu' SHOULD join once DATABASE_URL_EU is provisioned — it is deliberately
// omitted today because the LIVE eu deployment still runs on the generic
// DATABASE_URL, and enforcing it here without that env would break production.
const RESIDENCY_STRICT = new Set<string>(['ca'])

export function isResidencyStrict(jurisdiction: string): boolean {
  return RESIDENCY_STRICT.has(jurisdiction)
}

export function resolveDatabaseUrl(
  jurisdiction: string,
  env: Record<string, string | undefined> = process.env,
): string | null {
  const scopedKey = `DATABASE_URL_${jurisdiction.toUpperCase()}`
  const scoped = env[scopedKey]?.trim()
  if (scoped) return scoped

  if (RESIDENCY_STRICT.has(jurisdiction)) {
    throw new Error(
      `Data-residency jurisdiction '${jurisdiction}' requires ${scopedKey}. ` +
        `Refusing to fall back to the generic DATABASE_URL — that would route ` +
        `${jurisdiction.toUpperCase()} data outside its residency region. Set ${scopedKey} to the ` +
        `${jurisdiction === 'ca' ? 'Canadian (ca-central-1)' : jurisdiction} database URL.`,
    )
  }

  const generic = env['DATABASE_URL']?.trim()
  return generic && generic.length > 0 ? generic : null
}
