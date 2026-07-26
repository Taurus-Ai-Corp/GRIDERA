/**
 * Characterization tests for src/resolve.ts.
 *
 * These lock in the behaviour of the data-residency routing decision.
 *
 * They were originally written as characterization tests labelled FAIL-OPEN,
 * pinning a real defect: the strict-residency set was matched case-sensitively
 * and without trimming, so JURISDICTION=CA bypassed Canadian residency
 * enforcement. That hole was closed on 2026-07-26 by normalising in
 * resolve.ts, and those seven tests were inverted — deliberately, as a
 * reviewed change — into the regression guards below.
 *
 * No database is touched here — resolveDatabaseUrl is a pure function over a
 * Record<string, string | undefined>.
 */

import { describe, expect, it, afterEach } from 'vitest'
import { isResidencyStrict, resolveDatabaseUrl } from '../src/resolve'

const CA_URL = 'postgresql://user:pw@db.ca-central-1.supabase.co:6543/postgres'
const EU_URL = 'postgresql://user:pw@eu.neon.tech/neondb'
const GENERIC_URL = 'postgresql://user:pw@generic.neon.tech/neondb'

describe('isResidencyStrict', () => {
  it("treats 'ca' as residency-strict", () => {
    expect(isResidencyStrict('ca')).toBe(true)
  })

  it.each(['eu', 'na', 'in', 'ae'])(
    "does not treat '%s' as residency-strict",
    (jurisdiction) => {
      expect(isResidencyStrict(jurisdiction)).toBe(false)
    },
  )

  it('does not treat an empty or unknown jurisdiction as residency-strict', () => {
    expect(isResidencyStrict('')).toBe(false)
    expect(isResidencyStrict('zz')).toBe(false)
  })

  // Regression guard (fail-open closed 2026-07-26). The strict set is matched
  // AFTER normalisation, so any casing or padding of the same jurisdiction is
  // still recognised. Previously these returned false, silently disabling
  // Canadian residency enforcement for a mis-cased env var.
  it.each(['CA', 'Ca', ' ca', 'ca ', ' CA '])(
    "recognises '%s' as residency-strict — normalised, not exact-matched",
    (jurisdiction) => {
      expect(isResidencyStrict(jurisdiction)).toBe(true)
    },
  )
})

describe('resolveDatabaseUrl — non-strict jurisdictions', () => {
  it('prefers the region-scoped URL over the generic DATABASE_URL', () => {
    const url = resolveDatabaseUrl('eu', {
      DATABASE_URL_EU: EU_URL,
      DATABASE_URL: GENERIC_URL,
    })
    expect(url).toBe(EU_URL)
  })

  it('derives the scoped key by upper-casing the jurisdiction', () => {
    // lowercase 'in' must read DATABASE_URL_IN, not DATABASE_URL_in
    expect(resolveDatabaseUrl('in', { DATABASE_URL_IN: EU_URL })).toBe(EU_URL)
    expect(resolveDatabaseUrl('in', { DATABASE_URL_in: EU_URL })).toBeNull()
  })

  it('falls back to the generic DATABASE_URL when no scoped URL is set', () => {
    expect(resolveDatabaseUrl('na', { DATABASE_URL: GENERIC_URL })).toBe(GENERIC_URL)
  })

  it('trims surrounding whitespace from the scoped URL', () => {
    expect(resolveDatabaseUrl('eu', { DATABASE_URL_EU: `  ${EU_URL}\n` })).toBe(EU_URL)
  })

  it('trims surrounding whitespace from the generic DATABASE_URL', () => {
    expect(resolveDatabaseUrl('na', { DATABASE_URL: `\t${GENERIC_URL}  ` })).toBe(GENERIC_URL)
  })

  it('treats a whitespace-only scoped URL as absent and falls back', () => {
    const url = resolveDatabaseUrl('eu', {
      DATABASE_URL_EU: '   ',
      DATABASE_URL: GENERIC_URL,
    })
    expect(url).toBe(GENERIC_URL)
  })

  it('treats an empty-string scoped URL as absent and falls back', () => {
    const url = resolveDatabaseUrl('eu', {
      DATABASE_URL_EU: '',
      DATABASE_URL: GENERIC_URL,
    })
    expect(url).toBe(GENERIC_URL)
  })

  // Guards the `.env.local` hazard: that file declares DATABASE_URL twice, the
  // first one empty. Whichever value the loader ends up exporting, an EMPTY one
  // must resolve to null (dev in-memory fallback) and never to an empty string,
  // because apps/comply/src/lib/db.ts branches on `if (!url) return null` and
  // would otherwise hand '' to createDb().
  it('returns null (not an empty string) for an empty generic DATABASE_URL', () => {
    expect(resolveDatabaseUrl('na', { DATABASE_URL: '' })).toBeNull()
  })

  it('returns null for a whitespace-only generic DATABASE_URL', () => {
    expect(resolveDatabaseUrl('na', { DATABASE_URL: '   \n' })).toBeNull()
  })

  it('returns null when neither scoped nor generic URL is set', () => {
    expect(resolveDatabaseUrl('na', {})).toBeNull()
  })

  it('returns null when the generic DATABASE_URL is explicitly undefined', () => {
    expect(resolveDatabaseUrl('na', { DATABASE_URL: undefined })).toBeNull()
  })

  it('does not validate the URL — malformed values are passed through verbatim', () => {
    // Characterization: resolve.ts is a lookup, not a validator. If this ever
    // starts throwing/returning null, that is a behaviour change.
    expect(resolveDatabaseUrl('na', { DATABASE_URL: 'not-a-url' })).toBe('not-a-url')
    expect(resolveDatabaseUrl('eu', { DATABASE_URL_EU: 'http://' })).toBe('http://')
    expect(resolveDatabaseUrl('na', { DATABASE_URL: 'mysql://x/y' })).toBe('mysql://x/y')
  })
})

describe('resolveDatabaseUrl — residency-strict jurisdictions', () => {
  it("returns the scoped URL for 'ca' when DATABASE_URL_CA is set", () => {
    expect(resolveDatabaseUrl('ca', { DATABASE_URL_CA: CA_URL })).toBe(CA_URL)
  })

  it("prefers DATABASE_URL_CA over the generic DATABASE_URL for 'ca'", () => {
    const url = resolveDatabaseUrl('ca', {
      DATABASE_URL_CA: CA_URL,
      DATABASE_URL: GENERIC_URL,
    })
    expect(url).toBe(CA_URL)
  })

  it('throws when the strict jurisdiction has no scoped URL', () => {
    expect(() => resolveDatabaseUrl('ca', {})).toThrow(/requires DATABASE_URL_CA/)
  })

  // The single most important test in this file: residency must FAIL CLOSED.
  it('THROWS rather than falling back to the generic DATABASE_URL', () => {
    expect(() => resolveDatabaseUrl('ca', { DATABASE_URL: GENERIC_URL })).toThrow(
      /Refusing to fall back to the generic DATABASE_URL/,
    )
  })

  it('throws when the scoped URL is empty or whitespace-only, even with a generic fallback available', () => {
    expect(() =>
      resolveDatabaseUrl('ca', { DATABASE_URL_CA: '', DATABASE_URL: GENERIC_URL }),
    ).toThrow(/requires DATABASE_URL_CA/)
    expect(() =>
      resolveDatabaseUrl('ca', { DATABASE_URL_CA: '   ', DATABASE_URL: GENERIC_URL }),
    ).toThrow(/requires DATABASE_URL_CA/)
  })

  it('names the region in the error so the operator knows which DB to provision', () => {
    expect(() => resolveDatabaseUrl('ca', {})).toThrow(/Canadian \(ca-central-1\)/)
  })

  it('never returns null for a strict jurisdiction — it either resolves or throws', () => {
    expect(resolveDatabaseUrl('ca', { DATABASE_URL_CA: CA_URL })).not.toBeNull()
    expect(() => resolveDatabaseUrl('ca', {})).toThrow()
  })

  // Regression guards (fail-open closed 2026-07-26). apps/comply/src/lib/db.ts
  // passes process.env['JURISDICTION'] straight through, so a deployment
  // configured JURISDICTION=CA used to miss the strict set entirely and route
  // Canadian data to the generic (US) database. It must now throw instead.
  it('uppercase "CA" must NOT fall back to the generic DATABASE_URL', () => {
    expect(() => resolveDatabaseUrl('CA', { DATABASE_URL: GENERIC_URL })).toThrow(
      /requires DATABASE_URL_CA/,
    )
  })

  it('uppercase "CA" throws rather than returning null when nothing is set', () => {
    expect(() => resolveDatabaseUrl('CA', {})).toThrow(/requires DATABASE_URL_CA/)
  })

  it('a padded " ca" resolves the scoped key instead of falling back', () => {
    const url = resolveDatabaseUrl(' ca', {
      DATABASE_URL_CA: CA_URL,
      DATABASE_URL: GENERIC_URL,
    })
    expect(url).toBe(CA_URL)
  })
})

describe('resolveDatabaseUrl — env source', () => {
  const saved = { ...process.env }

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in saved)) delete process.env[key]
    }
    Object.assign(process.env, saved)
  })

  it('defaults to process.env when no env argument is given', () => {
    delete process.env['DATABASE_URL_EU']
    process.env['DATABASE_URL'] = GENERIC_URL
    expect(resolveDatabaseUrl('eu')).toBe(GENERIC_URL)
  })

  it('reads the scoped key from process.env when no env argument is given', () => {
    process.env['DATABASE_URL_EU'] = EU_URL
    process.env['DATABASE_URL'] = GENERIC_URL
    expect(resolveDatabaseUrl('eu')).toBe(EU_URL)
  })

  it('enforces residency against process.env when no env argument is given', () => {
    delete process.env['DATABASE_URL_CA']
    process.env['DATABASE_URL'] = GENERIC_URL
    expect(() => resolveDatabaseUrl('ca')).toThrow(/requires DATABASE_URL_CA/)
  })

  it('does not mutate the env object it is given', () => {
    const env: Record<string, string | undefined> = { DATABASE_URL: `  ${GENERIC_URL}  ` }
    const snapshot = { ...env }
    resolveDatabaseUrl('na', env)
    expect(env).toEqual(snapshot)
  })
})
