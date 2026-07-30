/**
 * gen-repo-bundle — produce a REAL, self-verifying `.gridera/` evidence bundle
 * at the repo root, anchored on Hedera TESTNET.
 *
 * Pipeline:
 *   1. scanDomain('q-grid.net')            → live TLS/crypto scan
 *   2. generateCBOM(scan)                  → CycloneDX 1.6 CBOM
 *   3. loadPlatformSigningKey() + signCBOM → detached ML-DSA-65 signature
 *   4. cbomSha256(cbom) (canonical hash)   → the SAME bytes signCBOM signs
 *   5. HCS anchor on testnet (message includes the canonical hash hex string)
 *   6. write <repoRoot>/.gridera/cbom.signed.json + anchor.json
 *
 * Anchoring is FORCED to testnet to match the CI verify workflow (`--network
 * testnet`), regardless of HEDERA_NETWORK in the environment.
 *
 * Usage:  tsx scripts/gen-repo-bundle.ts [domain]
 * Creds:  loaded from <repoRoot>/.env.local (HEDERA_OPERATOR_ID / _KEY,
 *         optional HEDERA_AUDIT_TOPIC_ID to reuse an existing testnet topic).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scanDomain } from '../src/scanner.js'
import { cbomSha256, generateCBOM, signCBOM, verifyCBOM } from '../src/cbom.js'
import { loadPlatformSigningKey } from '../src/platform-key.js'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '../../..') // packages/pqc-engine/scripts → repo root
const domain = process.argv[2] ?? 'q-grid.net'
const bundleDir = join(repoRoot, '.gridera')

const TESTNET_MIRROR = 'https://testnet.mirrornode.hedera.com'

/** Minimal .env parser: last non-empty value per key wins (file has dup keys). */
function loadEnvLocal(): void {
  const path = join(repoRoot, '.env.local')
  if (!existsSync(path)) {
    console.warn(`[env] no .env.local at ${path} — relying on process.env`)
    return
  }
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (value === '') continue // keep prior non-empty value for dup keys
    process.env[key] = value
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  loadEnvLocal()
  mkdirSync(bundleDir, { recursive: true })

  // 1. Live scan
  console.log(`[1/6] Scanning ${domain} (live TLS) ...`)
  const scan = await scanDomain(domain)
  if (scan.error) throw new Error(`Scan failed: ${scan.error}`)
  console.log(
    `      TLS ${scan.tlsVersion}, ${scan.algorithms.length} algorithm(s), ${scan.certificates.length} cert(s)`,
  )

  // 2. CBOM
  console.log('[2/6] Generating CycloneDX 1.6 CBOM ...')
  const cbom = generateCBOM(scan, { targetName: domain })

  // 3. Sign (detached ML-DSA-65) with the STABLE platform key (issue #46).
  //    loadPlatformSigningKey() reads PLATFORM_PQC_{SECRET,PUBLIC}_KEY from the
  //    env populated by loadEnvLocal() above — no ephemeral fallback.
  console.log('[3/6] Signing CBOM with the platform ML-DSA-65 key ...')
  const key = loadPlatformSigningKey()
  console.log(`      signer fingerprint = ${key.fingerprint}`)
  const signed = signCBOM(cbom, key.secretKey, key.publicKey)
  if (!verifyCBOM(signed)) throw new Error('CBOM signature failed self-verification')

  // 4. Canonical hash — EXACTLY the bytes signCBOM signs (Task 2 single source).
  const hash = cbomSha256(cbom)
  console.log(`      canonical cbomSha256 = ${hash}`)

  writeFileSync(join(bundleDir, 'cbom.signed.json'), JSON.stringify(signed, null, 2))

  // 5. Anchor on Hedera TESTNET (forced).
  const operatorId = process.env['HEDERA_OPERATOR_ID']
  const operatorKey = process.env['HEDERA_OPERATOR_KEY']
  if (!operatorId || !operatorKey) {
    throw new Error('HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY required (from .env.local)')
  }
  const envNetwork = process.env['HEDERA_NETWORK'] ?? '(unset)'
  if (envNetwork !== 'testnet') {
    console.log(`      NOTE: HEDERA_NETWORK=${envNetwork} — forcing TESTNET to match CI verify.`)
  }

  const { loadHederaConfig, createHederaClient, createTopic, submitToHCS } = await import(
    '@taurus/hedera'
  )
  // loadHederaConfig() reads env; force network=testnet regardless.
  const config = { ...loadHederaConfig(), network: 'testnet' as const }
  const client = createHederaClient(config)

  let topicId = process.env['HEDERA_AUDIT_TOPIC_ID']
  if (topicId) {
    console.log(`[5/6] Reusing testnet topic ${topicId} from env ...`)
  } else {
    console.log('[5/6] Creating a new testnet HCS topic ...')
    topicId = await createTopic(client, 'GRIDERA repo-root .gridera evidence anchor')
    console.log(`      Created topic ${topicId}`)
  }

  const message = JSON.stringify({
    type: 'GRIDERA_REPO_BUNDLE_ANCHOR',
    network: 'testnet',
    domain,
    cbomSha256: hash, // canonical hex — verifier does message.includes(hash)
    signerPublicKey: signed.signature.publicKey,
    signerFingerprint: key.fingerprint, // sha256(publicKeyHex) — pinnable identity
    anchoredAt: new Date().toISOString(),
  })
  const { txId, sequence } = await submitToHCS(client, topicId, message)
  client.close()
  console.log(`      Anchored: topic ${topicId}, tx ${txId}, seq ${sequence}`)

  // 6. Resolve the network-assigned consensus timestamp from the public
  //    testnet mirror node for (topic, sequence). submitToHCS surfaces only
  //    sequence+txId; the mirror-node record is the authoritative public source
  //    of the consensus timestamp the network assigned to this same message.
  console.log('[6/6] Polling testnet mirror-node for consensus timestamp ...')
  const url = `${TESTNET_MIRROR}/api/v1/topics/${topicId}/messages/${sequence}`
  let consensusTimestamp: string | null = null
  const deadline = Date.now() + 90_000
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        const body = (await res.json()) as { consensus_timestamp?: string }
        if (body?.consensus_timestamp) {
          consensusTimestamp = body.consensus_timestamp
          break
        }
      }
    } catch {
      /* transient — retry */
    }
    await sleep(3000)
  }
  if (!consensusTimestamp) {
    throw new Error(
      `Mirror-node did not index topic ${topicId}#${sequence} within 90s — cannot record consensusTimestamp`,
    )
  }
  console.log(`      consensusTimestamp = ${consensusTimestamp}`)

  const anchor = {
    topicId,
    sequenceNumber: sequence,
    consensusTimestamp,
    cbomSha256: hash,
    network: 'testnet' as const,
  }
  writeFileSync(join(bundleDir, 'anchor.json'), JSON.stringify(anchor, null, 2))

  console.log(`\nBundle written to ${bundleDir}`)
  console.log(JSON.stringify(anchor, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
