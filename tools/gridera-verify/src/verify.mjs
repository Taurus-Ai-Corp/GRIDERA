// gridera-verify — prove a repo's committed crypto evidence is authentic and anchored.
//
// Two independent checks over a committed `.gridera/` bundle:
//   1. SIGNATURE — the ML-DSA-65 signature on the CBOM verifies (delegated to
//      `verifyCBOM` from @taurus/pqc-engine — NO crypto is reimplemented here).
//   2. ANCHOR    — SHA-256 of the canonical CBOM equals `anchor.cbomSha256`,
//      AND the Hedera mirror-node message at (topicId, sequenceNumber) carries
//      that same SHA-256 (base64-decoded).
//
// The mirror-node fetch is injectable so tests run fully offline with a stub.
//
// Canonicalization decision (see README): the anchored hash is
//   SHA-256( JSON.stringify(signed.cbom) )
// computed via `hashPayload` from @taurus/pqc-crypto. This binds the anchor to
// the EXACT canonical bytes the ML-DSA-65 signature covers (pqc-engine's
// `canonicalBytes` = `TextEncoder().encode(JSON.stringify(cbom))`), rather than
// the pretty-printed file bytes. `hashPayload(x)` === sha256(utf8(JSON.stringify(x))).

import { createHash, timingSafeEqual } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { verifyCBOM } from '@taurus/pqc-engine'
import { hashPayload } from '@taurus/pqc-crypto'

const MIRROR_HOSTS = {
  testnet: 'https://testnet.mirrornode.hedera.com',
  mainnet: 'https://mainnet.mirrornode.hedera.com',
  previewnet: 'https://previewnet.mirrornode.hedera.com',
}

/**
 * SHA-256 (hex) of the canonical CBOM — the same byte sequence the ML-DSA-65
 * signature is computed over. Reuses the audited @taurus/pqc-crypto hash.
 */
export function computeCbomSha256(signed) {
  return hashPayload(signed.cbom)
}

/** Constant-time hex-string compare; false (not throw) on length mismatch. */
function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
}

/**
 * Does the bundle's signer public key match the pinned GRIDERA identity?
 *
 * `--signer` accepts either form (issue #46):
 *   - the full ML-DSA-65 public-key hex (3904 chars), OR
 *   - its SHA-256 fingerprint (64 hex chars), with optional `sha256:` prefix.
 *
 * FAIL-CLOSED: a missing/empty bundle key, a missing pin, or a pin whose shape
 * is neither a 64-hex fingerprint nor a full public key → `false`. A pin is an
 * assertion; when in doubt we do NOT assert a match.
 *
 * (This is the security-critical matcher. If you want a stricter policy —
 * e.g. reject the full-pubkey form and require fingerprints only — this is the
 * single place to change it.)
 */
export function signerMatches(bundlePublicKeyHex, pin) {
  if (typeof bundlePublicKeyHex !== 'string' || bundlePublicKeyHex.length === 0) return false
  if (typeof pin !== 'string' || pin.length === 0) return false
  const pub = bundlePublicKeyHex.trim().toLowerCase()
  let p = pin.trim().toLowerCase()
  if (p.startsWith('sha256:')) p = p.slice('sha256:'.length)
  if (!/^[0-9a-f]+$/.test(p) || !/^[0-9a-f]+$/.test(pub)) return false
  if (p.length === 64) {
    return timingSafeEqualHex(p, createHash('sha256').update(pub).digest('hex'))
  }
  return timingSafeEqualHex(p, pub)
}

/** Public Hedera mirror-node REST URL for a single topic message. */
export function mirrorNodeUrl(network, topicId, sequenceNumber) {
  const host = MIRROR_HOSTS[network]
  if (!host) throw new Error(`Unknown Hedera network: ${network}`)
  return `${host}/api/v1/topics/${topicId}/messages/${sequenceNumber}`
}

/** Default fetch wrapper (uses global fetch, Node 20+). */
export const defaultFetch = (url) => fetch(url)

function makeBadge(ok) {
  return {
    schemaVersion: 1,
    label: 'gridera-verify',
    message: ok ? 'passing' : 'failing',
    color: ok ? 'brightgreen' : 'red',
  }
}

/**
 * Verify a committed .gridera bundle.
 * @param {object}   opts
 * @param {string}   opts.bundleDir   directory containing cbom.signed.json + anchor.json
 * @param {string}  [opts.network]    hedera network (default 'testnet')
 * @param {Function}[opts.fetchImpl]  injectable fetch(url) -> Response-like (for offline tests)
 * @param {string}  [opts.signer]     optional pinned signer (full pubkey hex or sha256 fingerprint)
 * @returns {Promise<{ok:boolean, checks:object, badge:object, message:string, exitCode:number}>}
 */
export async function verifyBundle({
  bundleDir,
  network = 'testnet',
  fetchImpl = defaultFetch,
  signer = null,
}) {
  const checks = {
    signature: { ok: false, message: '' },
    signer: { ok: true, applicable: false, message: 'signer not pinned (no --signer)' },
    anchorHash: { ok: false, message: '', expected: null, actual: null },
    mirror: { ok: false, message: '', url: null },
  }

  // --- load bundle ---
  let signed
  let anchor
  try {
    signed = JSON.parse(readFileSync(join(bundleDir, 'cbom.signed.json'), 'utf8'))
    anchor = JSON.parse(readFileSync(join(bundleDir, 'anchor.json'), 'utf8'))
  } catch (err) {
    const message = `Could not read bundle from ${bundleDir}: ${err.message}`
    return finalize({ checks, loadError: message })
  }

  // --- 1. signature check (delegated to @taurus/pqc-engine) ---
  try {
    checks.signature.ok = verifyCBOM(signed) === true
    checks.signature.message = checks.signature.ok
      ? `ML-DSA-65 signature valid (signer ${short(signed?.signature?.publicKey)})`
      : 'ML-DSA-65 signature INVALID — CBOM does not match its signature (tampered or wrong key)'
  } catch (err) {
    checks.signature.ok = false
    checks.signature.message = `Signature verification threw: ${err.message}`
  }

  // --- 1b. signer pin check (only when --signer is supplied) ---
  if (signer) {
    const bundleKey = signed?.signature?.publicKey
    checks.signer.applicable = true
    checks.signer.ok = signerMatches(bundleKey, signer)
    checks.signer.message = checks.signer.ok
      ? `signer matches pinned identity (${short(signer)})`
      : `signer MISMATCH — bundle signer ${short(bundleKey)} does not match pinned ${short(signer)}`
  }

  // --- 2a. local anchor hash check ---
  const computed = computeCbomSha256(signed)
  checks.anchorHash.expected = anchor?.cbomSha256 ?? null
  checks.anchorHash.actual = computed
  checks.anchorHash.ok = typeof anchor?.cbomSha256 === 'string' && anchor.cbomSha256 === computed
  checks.anchorHash.message = checks.anchorHash.ok
    ? `CBOM SHA-256 matches anchor.json (${short(computed)})`
    : `CBOM SHA-256 mismatch: anchor.json=${short(checks.anchorHash.expected)} computed=${short(computed)}`

  // --- 2b. mirror-node anchor check (public Hedera REST) ---
  try {
    const url = mirrorNodeUrl(network, anchor.topicId, anchor.sequenceNumber)
    checks.mirror.url = url
    const res = await fetchImpl(url)
    if (!res || res.ok === false) {
      throw new Error(`mirror-node HTTP ${res ? res.status : 'no-response'}`)
    }
    const body = await res.json()
    if (!body || typeof body.message !== 'string') {
      throw new Error('mirror-node response missing base64 `message` field')
    }
    const decoded = Buffer.from(body.message, 'base64').toString('utf8')
    checks.mirror.ok = decoded.includes(computed)
    checks.mirror.message = checks.mirror.ok
      ? `Hedera ${network} topic ${anchor.topicId}#${anchor.sequenceNumber} anchors SHA-256 ${short(computed)}`
      : `Mirror-node message at ${anchor.topicId}#${anchor.sequenceNumber} does NOT contain CBOM SHA-256 ${short(computed)}`
  } catch (err) {
    checks.mirror.ok = false
    checks.mirror.message = `Mirror-node resolution failed: ${err.message}`
  }

  return finalize({ checks })
}

function finalize({ checks, loadError }) {
  const ok =
    !loadError &&
    checks.signature.ok &&
    checks.signer.ok &&
    checks.anchorHash.ok &&
    checks.mirror.ok
  const badge = makeBadge(ok)
  const message = loadError
    ? loadError
    : ok
      ? 'gridera-verify: PASS — signature valid and CBOM anchored on Hedera.'
      : 'gridera-verify: FAIL — ' +
        [
          !checks.signature.ok && 'signature',
          !checks.signer.ok && 'signer-pin',
          !checks.anchorHash.ok && 'anchor-hash',
          !checks.mirror.ok && 'mirror-node',
        ]
          .filter(Boolean)
          .join(', ') +
        ' check(s) failed.'
  return { ok, checks, badge, message, exitCode: ok ? 0 : 1 }
}

function short(hex) {
  if (!hex || typeof hex !== 'string') return String(hex)
  return hex.length > 16 ? `${hex.slice(0, 16)}…` : hex
}

// --- CLI --------------------------------------------------------------------

function parseArgs(argv) {
  const args = { bundleDir: '.gridera', network: 'testnet', drift: false, signer: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--bundle-dir') args.bundleDir = argv[++i]
    else if (a === '--network') args.network = argv[++i]
    else if (a === '--signer') args.signer = argv[++i]
    else if (a === '--drift') args.drift = true
  }
  return args
}

/** Run as a CLI/GitHub Action. Returns the process exit code. */
export async function runCli(argv) {
  const args = parseArgs(argv)

  if (args.drift) {
    // v1 scope: drift is DEFERRED. Recomputing the CBOM from HEAD requires the
    // live TLS scanner (@taurus/pqc-engine scanDomain) + network egress, which
    // is out of scope for the offline verifier. Documented in README.
    console.log(
      '⚠  --drift is DEFERRED (v1): recomputing the CBOM from HEAD needs the scanner. Skipping drift; running signature+anchor verification only.',
    )
  }

  const result = await verifyBundle({
    bundleDir: args.bundleDir,
    network: args.network,
    signer: args.signer,
  })

  console.log(`gridera-verify — bundle: ${args.bundleDir}  network: ${args.network}`)
  console.log(`  [${mark(result.checks.signature.ok)}] signature : ${result.checks.signature.message}`)
  console.log(
    `  [${result.checks.signer.applicable ? mark(result.checks.signer.ok) : 'SKIP'}] signer    : ${result.checks.signer.message}`,
  )
  console.log(`  [${mark(result.checks.anchorHash.ok)}] anchor    : ${result.checks.anchorHash.message}`)
  console.log(`  [${mark(result.checks.mirror.ok)}] mirror    : ${result.checks.mirror.message}`)
  console.log('')
  if (result.ok) {
    console.log(`✅ ${result.message}`)
  } else {
    console.error(`❌ ${result.message}`)
  }
  console.log(`badge: ${JSON.stringify(result.badge)}`)
  return result.exitCode
}

function mark(ok) {
  return ok ? 'PASS' : 'FAIL'
}

// Execute when invoked directly (node src/verify.mjs ...).
if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(`gridera-verify crashed: ${err.stack || err.message}`)
      process.exit(2)
    })
}
