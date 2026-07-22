/**
 * RED → GREEN: pure helpers for funnel smoke checks.
 * Run: pnpm exec tsx --test scripts/funnel-smoke/lib.test.ts
 * (or node --import tsx --test …)
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  extractCalendlyHref,
  isValidScanId,
  parseAuthProbe,
  parseRedirectLocation,
  assertPipeBrandLine,
} from './lib.ts'

describe('extractCalendlyHref', () => {
  it('finds executive-briefing Calendly URL in HTML/JS payload', () => {
    const html =
      'x href="https://calendly.com/taurusai/gridera-executive-briefing" target="_blank"'
    assert.equal(
      extractCalendlyHref(html),
      'https://calendly.com/taurusai/gridera-executive-briefing',
    )
  })

  it('returns null when only stale mailto sales CTA is present', () => {
    const html = 'href="mailto:admin@taurusai.io?subject=Enterprise%20PQC%20Assessment"'
    assert.equal(extractCalendlyHref(html), null)
  })
})

describe('isValidScanId', () => {
  it('accepts 16-char scan ids from /api/scan', () => {
    assert.equal(isValidScanId('abcdef0123456789'), true)
  })

  it('rejects short or missing ids', () => {
    assert.equal(isValidScanId(''), false)
    assert.equal(isValidScanId('short'), false)
    assert.equal(isValidScanId(null), false)
  })
})

describe('parseAuthProbe', () => {
  it('treats 401 Invalid email or password as healthy auth+DB spine', () => {
    const r = parseAuthProbe(401, JSON.stringify({ error: 'Invalid email or password' }))
    assert.equal(r.healthy, true)
    assert.equal(r.reason, 'auth_reject')
  })

  it('treats 500 Sign in failed as unhealthy (e.g. DB misconfig)', () => {
    const r = parseAuthProbe(500, JSON.stringify({ error: 'Sign in failed' }))
    assert.equal(r.healthy, false)
    assert.equal(r.reason, 'server_error')
  })
})

describe('parseRedirectLocation', () => {
  it('extracts Location header target for /ca interim routing', () => {
    assert.equal(
      parseRedirectLocation('https://q-grid-comply-ca.vercel.app/'),
      'https://q-grid-comply-ca.vercel.app/',
    )
  })
})

describe('assertPipeBrandLine', () => {
  it('accepts GRIDERA|Comply pipe form', () => {
    assert.doesNotThrow(() => assertPipeBrandLine('Ship GRIDERA|Comply to EU'))
  })

  it('rejects space-form product names without pipe', () => {
    assert.throws(
      () => assertPipeBrandLine('Ship GRIDERA Comply to EU'), // brand-allow
      /pipe/,
    )
  })
})
