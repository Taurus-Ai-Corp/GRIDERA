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
  parseKexProbe,
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

describe('parseKexProbe', () => {
  it('reports quantum-safe when the server negotiated a hybrid PQC group', () => {
    const r = parseKexProbe({
      group: 'X25519MLKEM768',
      hybridPqcSupported: true,
      detected: true,
    })
    assert.equal(r.quantumSafe, true)
    assert.equal(r.reason, 'hybrid_pqc')
    assert.equal(r.group, 'X25519MLKEM768')
  })

  it('reports classical_only when the server genuinely lacks hybrid PQC', () => {
    const r = parseKexProbe({ group: 'x25519', hybridPqcSupported: false })
    assert.equal(r.quantumSafe, false)
    assert.equal(r.reason, 'classical_only')
  })

  // The regression guard. A runtime older than OpenSSL 3.5 cannot negotiate
  // ML-KEM, so the scanner returns null rather than false. Collapsing null into
  // false would silently report quantum-safe infrastructure as classical.
  it('distinguishes "our runtime cannot tell" from "the server does not support it"', () => {
    const incapable = parseKexProbe({ group: null, hybridPqcSupported: null })
    assert.equal(incapable.reason, 'runtime_incapable')

    const classical = parseKexProbe({ group: 'x25519', hybridPqcSupported: false })
    assert.equal(classical.reason, 'classical_only')

    assert.notEqual(incapable.reason, classical.reason)
  })

  it('treats a missing hybridPqcSupported field as runtime_incapable, not safe', () => {
    const r = parseKexProbe({ group: 'X25519MLKEM768' })
    assert.equal(r.quantumSafe, false)
    assert.equal(r.reason, 'runtime_incapable')
  })

  it('handles malformed payloads without throwing', () => {
    for (const bad of [null, undefined, 'nope', 42]) {
      const r = parseKexProbe(bad)
      assert.equal(r.quantumSafe, false)
      assert.equal(r.reason, 'malformed')
    }
  })
})
