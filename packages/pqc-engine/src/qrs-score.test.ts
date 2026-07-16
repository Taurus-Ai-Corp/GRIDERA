import { describe, expect, it } from 'vitest'
import { calculateQrsScore } from './qrs-score.js'
import type { KeyExchangeInfo, ScanResult } from './types.js'

const rsaOnly: ScanResult = {
  domain: 'classic.example.com',
  scannedAt: '2026-07-16T00:00:00.000Z',
  tlsVersion: 'TLSv1.3',
  certificates: [],
  algorithms: [
    { name: 'RSA', keySize: 2048, grade: 'WEAK', vulnerable: true, severity: 'high' },
  ],
}

const kex = (hybridPqcSupported: boolean | null): KeyExchangeInfo => ({
  hybridPqcSupported,
  detected: hybridPqcSupported !== null,
  detectionMethod: 'tls13-negotiation-probe',
  ...(hybridPqcSupported === true ? { group: 'X25519MLKEM768' } : {}),
})

describe('calculateQrsScore — PQC hybrid key exchange credit', () => {
  it('scores pqcReadiness 0 with a classical cert and no KEX info', () => {
    expect(calculateQrsScore(rsaOnly).categories.pqcReadiness).toBe(0)
  })

  it('credits pqcReadiness 50 when a PQC hybrid KEX is confirmed', () => {
    const score = calculateQrsScore({ ...rsaOnly, keyExchange: kex(true) })
    expect(score.categories.pqcReadiness).toBe(50)
  })

  it('lifts the overall score when hybrid KEX is present (0.20 weight → +10)', () => {
    const without = calculateQrsScore(rsaOnly).overall
    const with_ = calculateQrsScore({ ...rsaOnly, keyExchange: kex(true) }).overall
    expect(with_ - without).toBe(10)
  })

  it('gives no credit when hybrid KEX is undetermined (null)', () => {
    const score = calculateQrsScore({ ...rsaOnly, keyExchange: kex(null) })
    expect(score.categories.pqcReadiness).toBe(0)
  })

  it('gives no credit when the endpoint refuses the hybrid group', () => {
    const score = calculateQrsScore({ ...rsaOnly, keyExchange: kex(false) })
    expect(score.categories.pqcReadiness).toBe(0)
  })

  it('still awards full readiness for an actual PQC certificate', () => {
    const pqcCert: ScanResult = {
      ...rsaOnly,
      algorithms: [
        { name: 'ML-DSA-65', keySize: 1952, grade: 'PQC_READY', vulnerable: false, severity: 'none' },
      ],
      keyExchange: kex(true),
    }
    expect(calculateQrsScore(pqcCert).categories.pqcReadiness).toBe(100)
  })
})
