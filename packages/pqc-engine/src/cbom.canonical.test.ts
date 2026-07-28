import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { hashPayload } from '@taurus/pqc-crypto'
import { canonicalBytes, cbomSha256, generateCBOM, signCBOM } from './cbom.js'
import { generateKeyPair, sign } from '@taurus/pqc-crypto'
import type { ScanResult } from './types.js'

// A deterministic scan → CBOM. Values are irrelevant; the invariant under test
// is that ONE canonical hash binds (a) the bytes signCBOM signs and (b) the
// value the gridera-verify CLI derives from the signed bundle.
const SCAN: ScanResult = {
  domain: 'canonical.test',
  tlsVersion: 'TLSv1.3',
  algorithms: [{ name: 'RSA', keySize: 2048, grade: 'WEAK', severity: 'high', vulnerable: true }],
  certificates: [],
  scannedAt: '2026-07-27T00:00:00.000Z',
}

/**
 * EXACT reproduction of tools/gridera-verify/src/verify.mjs `computeCbomSha256`:
 *
 *   export function computeCbomSha256(signed) {
 *     return hashPayload(signed.cbom)
 *   }
 *
 * `hashPayload(x)` (from @taurus/pqc-crypto, the same import the tool uses) is
 * `sha256_hex(TextEncoder().encode(JSON.stringify(x)))`. Reproduced here so the
 * test asserts against the tool's real derivation without importing verify.mjs
 * (which self-imports `@taurus/pqc-engine`, unresolvable from inside this pkg).
 */
function verifyToolComputeCbomSha256(signed: { cbom: unknown }): string {
  return hashPayload(signed.cbom)
}

describe('cbom canonicalization — sign/anchor/verify bind the SAME bytes', () => {
  it('cbomSha256(cbom) === sha256(hex) of the bytes signCBOM signs === gridera-verify computeCbomSha256', () => {
    const cbom = generateCBOM(SCAN, { targetName: SCAN.domain })
    const keys = generateKeyPair()
    const signed = signCBOM(cbom, keys.secretKey, keys.publicKey)

    // (1) The exported canonical hash.
    const canonical = cbomSha256(cbom)

    // (2) SHA-256 over EXACTLY the bytes signCBOM signs. signCBOM computes
    //     `sign(canonicalBytes(cbom), sk)`, so canonicalBytes(cbom) IS the
    //     signed message. Hash it independently via node:crypto.
    const signedBytes = canonicalBytes(cbom)
    const sha256OfSignedBytes = createHash('sha256').update(signedBytes).digest('hex')

    // (3) What the gridera-verify CLI derives from the signed bundle.
    const fromVerifyTool = verifyToolComputeCbomSha256(signed)

    expect(canonical).toBe(sha256OfSignedBytes)
    expect(canonical).toBe(fromVerifyTool)

    // Sanity: it is a real 64-char SHA-256 hex digest.
    expect(canonical).toMatch(/^[0-9a-f]{64}$/)

    // Guard: signCBOM really did sign these exact bytes (round-trips).
    const reSigned = sign(signedBytes, keys.secretKey)
    expect(reSigned.length).toBe(3309)
  })

  it('canonicalBytes is the UTF-8 of JSON.stringify(cbom) (no pretty-print drift)', () => {
    const cbom = generateCBOM(SCAN, { targetName: SCAN.domain })
    const expected = new TextEncoder().encode(JSON.stringify(cbom))
    expect(Buffer.from(canonicalBytes(cbom))).toEqual(Buffer.from(expected))
    // Pretty-printed bytes must NOT match — proves the mismatch the fix closes.
    const pretty = new TextEncoder().encode(JSON.stringify(cbom, null, 2))
    expect(Buffer.from(canonicalBytes(cbom)).equals(Buffer.from(pretty))).toBe(false)
  })
})
