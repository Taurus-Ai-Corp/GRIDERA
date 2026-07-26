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

/**
 * Normalise a jurisdiction before ANY comparison against RESIDENCY_STRICT.
 *
 * Callers read this straight from an environment variable — see
 * apps/comply/src/lib/db.ts, `process.env['JURISDICTION'] ?? 'na'` — and env
 * values are not reliably cased. Before this existed, the scoped-key lookup
 * normalised (`.toUpperCase()`) but the residency guard did not, so
 * `JURISDICTION=CA` missed the strict set and fell through to the generic
 * DATABASE_URL: a silent fail-open in the exact control that enforces Canadian
 * data residency, triggered precisely when DATABASE_URL_CA was absent — the
 * case the throw exists to catch.
 *
 * Normalising in one place keeps the lookup and the guard from ever disagreeing
 * again. Callers in this repo already disagreed with each other about whether
 * the env var could be trusted to be lowercase.
 */
function normalizeJurisdiction(jurisdiction: string): string {
  return jurisdiction.trim().toLowerCase()
}

export function isResidencyStrict(jurisdiction: string): boolean {
  return RESIDENCY_STRICT.has(normalizeJurisdiction(jurisdiction))
}

export function resolveDatabaseUrl(
  jurisdiction: string,
  env: Record<string, string | undefined> = process.env,
): string | null {
  const normalized = normalizeJurisdiction(jurisdiction)
  const scopedKey = `DATABASE_URL_${normalized.toUpperCase()}`
  const scoped = env[scopedKey]?.trim()
  if (scoped) return scoped

  if (RESIDENCY_STRICT.has(normalized)) {
    throw new Error(
      `Data-residency jurisdiction '${normalized}' requires ${scopedKey}. ` +
        `Refusing to fall back to the generic DATABASE_URL — that would route ` +
        `${normalized.toUpperCase()} data outside its residency region. Set ${scopedKey} to the ` +
        `${normalized === 'ca' ? 'Canadian (ca-central-1)' : normalized} database URL.`,
    )
  }

  return env['DATABASE_URL']?.trim() || null
}
