/**
 * Pure helpers for production funnel smoke checks.
 * No network I/O — keeps unit tests deterministic.
 */

const CALENDLY_RE =
  /https:\/\/calendly\.com\/taurusai\/gridera-executive-briefing/i

export function extractCalendlyHref(html: string): string | null {
  const m = html.match(CALENDLY_RE)
  return m ? m[0].replace(/["'\\].*$/, '') : null
}

export function isValidScanId(id: unknown): boolean {
  return typeof id === 'string' && id.length === 16
}

export type AuthProbeResult = {
  healthy: boolean
  reason: 'auth_reject' | 'server_error' | 'unexpected'
}

export function parseAuthProbe(status: number, body: string): AuthProbeResult {
  if (status === 401) {
    return { healthy: true, reason: 'auth_reject' }
  }
  if (status >= 500) {
    return { healthy: false, reason: 'server_error' }
  }
  return { healthy: false, reason: 'unexpected' }
}

export function parseRedirectLocation(locationHeader: string | null): string | null {
  if (!locationHeader) return null
  return locationHeader.trim()
}

export type KexProbeResult = {
  quantumSafe: boolean
  reason: 'hybrid_pqc' | 'classical_only' | 'runtime_incapable' | 'malformed'
  group: string | null
}

/**
 * Interpret the `keyExchange` block returned by /api/scan.
 *
 * The three-way outcome is the whole point. `hybridPqcSupported` is deliberately
 * capability-gated to null — NOT false — when the scanning runtime predates
 * OpenSSL 3.5 and therefore cannot negotiate ML-KEM at all. Collapsing null into
 * false would report a quantum-safe server as classical, which is the exact
 * false-negative the Node 20 → 24 runtime bump was made to prevent.
 *
 *   true  → server negotiated a hybrid PQC group (a finding about the target)
 *   false → server negotiated a classical group  (a finding about the target)
 *   null  → our own runtime is too old to tell    (a finding about US)
 */
export function parseKexProbe(keyExchange: unknown): KexProbeResult {
  if (typeof keyExchange !== 'object' || keyExchange === null) {
    return { quantumSafe: false, reason: 'malformed', group: null }
  }
  const kex = keyExchange as { hybridPqcSupported?: unknown; group?: unknown }
  const group = typeof kex.group === 'string' ? kex.group : null

  if (kex.hybridPqcSupported === true) {
    return { quantumSafe: true, reason: 'hybrid_pqc', group }
  }
  if (kex.hybridPqcSupported === false) {
    return { quantumSafe: false, reason: 'classical_only', group }
  }
  // null / undefined / anything else — the scanner could not determine it.
  return { quantumSafe: false, reason: 'runtime_incapable', group }
}

/** Throws if line uses forbidden space-form product brand. */
export function assertPipeBrandLine(line: string): void {
  if (/\bGRIDERA (Comply|Scan|Migrate|Guard|Certify|Lend|Pay|Arq|Shield)\b/.test(line)) {
    throw new Error('use pipe form GRIDERA|Verb, not space-form')
  }
}
