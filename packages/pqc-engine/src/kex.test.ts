import { describe, expect, it } from 'vitest'
import {
  PQC_HYBRID_GROUP,
  interpretProbeOutcome,
  runtimeSupportsMlKem,
} from './kex.js'

describe('runtimeSupportsMlKem', () => {
  it('rejects OpenSSL 3.0 (Node 20/22 — no ML-KEM)', () => {
    expect(runtimeSupportsMlKem('3.0.13')).toBe(false)
    expect(runtimeSupportsMlKem('3.0.0+quic')).toBe(false)
  })

  it('rejects OpenSSL 3.4 and below', () => {
    expect(runtimeSupportsMlKem('3.4.0')).toBe(false)
  })

  it('accepts OpenSSL 3.5+ (Node 24) and 3.6 (Node 25)', () => {
    expect(runtimeSupportsMlKem('3.5.0')).toBe(true)
    expect(runtimeSupportsMlKem('3.6.2')).toBe(true)
  })

  it('accepts a hypothetical OpenSSL 4.x', () => {
    expect(runtimeSupportsMlKem('4.0.0')).toBe(true)
  })

  it('is conservative on unparseable version strings', () => {
    expect(runtimeSupportsMlKem('unknown')).toBe(false)
    expect(runtimeSupportsMlKem('')).toBe(false)
  })
})

describe('interpretProbeOutcome', () => {
  it('reports null (undetermined), never false, on an incapable runtime', () => {
    const info = interpretProbeOutcome(false, null)
    expect(info.hybridPqcSupported).toBeNull()
    expect(info.detected).toBe(false)
    expect(info.note).toMatch(/cannot negotiate ML-KEM/)
  })

  it('reports supported + group when the handshake connects', () => {
    const info = interpretProbeOutcome(true, { connected: true, handshakeFailure: false })
    expect(info.hybridPqcSupported).toBe(true)
    expect(info.group).toBe(PQC_HYBRID_GROUP)
    expect(info.detected).toBe(true)
  })

  it('reports unsupported when a forced-TLS1.3 endpoint refuses the group', () => {
    const info = interpretProbeOutcome(true, { connected: false, handshakeFailure: true })
    expect(info.hybridPqcSupported).toBe(false)
    expect(info.group).toBeUndefined()
  })

  it('reports null on an inconclusive transport error (not a TLS refusal)', () => {
    const info = interpretProbeOutcome(true, null)
    expect(info.hybridPqcSupported).toBeNull()
    expect(info.detected).toBe(true)
    expect(info.note).toMatch(/inconclusive/)
  })

  it('does not read a non-handshake failure as unsupported', () => {
    const info = interpretProbeOutcome(true, { connected: false, handshakeFailure: false })
    expect(info.hybridPqcSupported).toBeNull()
  })
})
