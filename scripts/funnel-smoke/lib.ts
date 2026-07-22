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

/** Throws if line uses forbidden space-form product brand. */
export function assertPipeBrandLine(line: string): void {
  if (/\bGRIDERA (Comply|Scan|Migrate|Guard|Certify|Lend|Pay|Arq|Shield)\b/.test(line)) {
    throw new Error('use pipe form GRIDERA|Verb, not space-form')
  }
}
