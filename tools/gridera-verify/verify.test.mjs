// gridera-verify — TDD test suite (node:test runner, pure ESM).
//
// Runner: `node --test tools/gridera-verify/verify.test.mjs`
// (vitest was the nominal requirement; node:test is used because the tool dir
//  lives OUTSIDE the pnpm workspace globs and node:test resolves the
//  `@taurus/*` workspace dist through local symlinks with zero config —
//  see README "Test runner" note. The test API is trivially portable to vitest.)
//
// Three required cases:
//   (a) happy path      — real ML-DSA-65 round-trip + stubbed mirror-node match → verify passes
//   (b) tampered CBOM   — verifyCBOM() returns false                            → action fails
//   (c) anchor mismatch — stub mirror-node returns the wrong hash               → action fails

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { generateCBOM, signCBOM } from '@taurus/pqc-engine'
import { generateKeyPair } from '@taurus/pqc-crypto'

import { verifyBundle, computeCbomSha256, signerMatches } from './src/verify.mjs'

// --- helpers ---------------------------------------------------------------

const SCAN = {
  domain: 'example.test',
  tlsVersion: 'TLSv1.3',
  algorithms: [
    { name: 'RSA', keySize: 2048, grade: 'F', severity: 'high', vulnerable: true },
  ],
  certificates: [],
  scannedAt: '2026-07-27T00:00:00.000Z',
}

/** Build a fresh, internally-consistent .gridera bundle in a temp dir. */
function buildBundle() {
  const dir = mkdtempSync(join(tmpdir(), 'gridera-verify-'))
  const bundleDir = join(dir, '.gridera')
  mkdirSync(bundleDir, { recursive: true })

  const cbom = generateCBOM(SCAN, { targetName: SCAN.domain })
  const keys = generateKeyPair()
  const signed = signCBOM(cbom, keys.secretKey, keys.publicKey)
  const cbomSha256 = computeCbomSha256(signed)

  const anchor = {
    topicId: '0.0.9551792',
    sequenceNumber: 7,
    consensusTimestamp: '1753660800.000000001',
    cbomSha256,
  }

  writeFileSync(join(bundleDir, 'cbom.signed.json'), JSON.stringify(signed, null, 2))
  writeFileSync(join(bundleDir, 'anchor.json'), JSON.stringify(anchor, null, 2))
  return { dir, bundleDir, signed, cbomSha256 }
}

/** A fake mirror-node fetch that returns an HCS message carrying `hashInMessage`. */
function stubMirror(hashInMessage) {
  return async (url) => {
    const payload = JSON.stringify({
      type: 'PILOT0_SERVICE_RESIGN',
      network: 'testnet',
      cbomSha256: hashInMessage,
      anchoredAt: '2026-07-27T00:00:00.000Z',
    })
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          consensus_timestamp: '1753660800.000000001',
          topic_id: '0.0.9551792',
          sequence_number: 7,
          message: Buffer.from(payload, 'utf8').toString('base64'),
          _url: url,
        }
      },
    }
  }
}

// --- (a) happy path --------------------------------------------------------

test('(a) happy path: valid signature + matching anchor + matching mirror-node message → passes', async () => {
  const { dir, bundleDir, cbomSha256 } = buildBundle()
  try {
    const result = await verifyBundle({
      bundleDir,
      network: 'testnet',
      fetchImpl: stubMirror(cbomSha256), // mirror echoes the correct hash
    })

    assert.equal(result.ok, true, 'overall verification should pass')
    assert.equal(result.checks.signature.ok, true, 'signature check passes')
    assert.equal(result.checks.anchorHash.ok, true, 'anchor hash check passes')
    assert.equal(result.checks.mirror.ok, true, 'mirror-node check passes')
    assert.equal(result.badge.message, 'passing')
    assert.equal(result.badge.color, 'brightgreen')
    assert.equal(result.exitCode, 0)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// --- (b) tampered CBOM -----------------------------------------------------

test('(b) tampered CBOM: signature no longer verifies → fails', async () => {
  const { dir, bundleDir, signed, cbomSha256 } = buildBundle()
  try {
    // Mutate the signed CBOM in place WITHOUT re-signing.
    signed.cbom.metadata.component.name = 'attacker-controlled.test'
    writeFileSync(join(bundleDir, 'cbom.signed.json'), JSON.stringify(signed, null, 2))

    const result = await verifyBundle({
      bundleDir,
      network: 'testnet',
      fetchImpl: stubMirror(cbomSha256),
    })

    assert.equal(result.checks.signature.ok, false, 'signature check must fail on tamper')
    assert.equal(result.ok, false, 'overall verification must fail')
    assert.equal(result.badge.message, 'failing')
    assert.notEqual(result.exitCode, 0, 'must exit non-zero')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// --- (c) anchor mismatch (mirror returns wrong hash) -----------------------

test('(c) anchor mismatch: mirror-node message carries a different hash → fails', async () => {
  const { dir, bundleDir } = buildBundle()
  try {
    const wrongHash = '0'.repeat(64)
    const result = await verifyBundle({
      bundleDir,
      network: 'testnet',
      fetchImpl: stubMirror(wrongHash), // mirror does NOT contain our hash
    })

    assert.equal(result.checks.signature.ok, true, 'signature still valid')
    assert.equal(result.checks.anchorHash.ok, true, 'local anchor.json still matches')
    assert.equal(result.checks.mirror.ok, false, 'mirror-node hash must not match')
    assert.equal(result.ok, false, 'overall verification must fail')
    assert.notEqual(result.exitCode, 0, 'must exit non-zero')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// --- (d) signer pin: full public-key hex matches → passes (issue #46) -------

test('(d) signer pin: full public-key hex matches bundle signer → passes', async () => {
  const { dir, bundleDir, signed, cbomSha256 } = buildBundle()
  try {
    const result = await verifyBundle({
      bundleDir,
      network: 'testnet',
      fetchImpl: stubMirror(cbomSha256),
      signer: signed.signature.publicKey, // full ML-DSA-65 pubkey hex
    })
    assert.equal(result.checks.signer.applicable, true, 'signer check is applicable when pinned')
    assert.equal(result.checks.signer.ok, true, 'full-hex signer pin should match')
    assert.equal(result.ok, true, 'overall passes when signer matches')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// --- (e) signer pin: sha256 fingerprint (with prefix) matches → passes ------

test('(e) signer pin: sha256 fingerprint matches bundle signer → passes', async () => {
  const { dir, bundleDir, signed, cbomSha256 } = buildBundle()
  try {
    const fp = createHash('sha256').update(signed.signature.publicKey).digest('hex')
    const result = await verifyBundle({
      bundleDir,
      network: 'testnet',
      fetchImpl: stubMirror(cbomSha256),
      signer: `sha256:${fp}`,
    })
    assert.equal(result.checks.signer.ok, true, 'fingerprint signer pin should match')
    assert.equal(result.ok, true, 'overall passes when fingerprint matches')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// --- (f) signer pin: wrong identity → fails despite a valid signature -------

test('(f) signer pin: mismatched identity → fails even though signature is valid', async () => {
  const { dir, bundleDir, cbomSha256 } = buildBundle()
  try {
    const result = await verifyBundle({
      bundleDir,
      network: 'testnet',
      fetchImpl: stubMirror(cbomSha256),
      signer: `sha256:${'0'.repeat(64)}`, // not our key
    })
    assert.equal(result.checks.signature.ok, true, 'signature itself is still valid')
    assert.equal(result.checks.signer.ok, false, 'signer pin must not match')
    assert.equal(result.ok, false, 'overall must FAIL on signer mismatch (fail-closed)')
    assert.notEqual(result.exitCode, 0, 'must exit non-zero')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// --- (g) signerMatches unit: fail-closed on empty/garbage input -------------

test('(g) signerMatches is fail-closed on empty/garbage input', () => {
  assert.equal(signerMatches('', 'abc'), false, 'empty bundle key → false')
  assert.equal(signerMatches('deadbeef', ''), false, 'empty pin → false')
  assert.equal(signerMatches('deadbeef', 'not-hex!!'), false, 'non-hex pin → false')
  assert.equal(signerMatches('deadbeef', 'deadbeef'), true, 'exact full-key match → true')
  assert.equal(signerMatches('DEADBEEF', 'deadbeef'), true, 'case-insensitive full-key match')
})
