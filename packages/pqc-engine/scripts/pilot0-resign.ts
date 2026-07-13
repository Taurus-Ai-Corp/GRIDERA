/**
 * GRIDERA Pilot-0 — Definition-of-Done evidence run.
 *
 * Re-signs a non-critical enterprise service (TAURUS AI Corp's own) with ML-DSA-65:
 *   1. Live TLS scan of the service domain          → ScanResult
 *   2. CycloneDX 1.6 CBOM generation                → cbom.json
 *   3. Official-schema validation (ajv, draft-07)   → validated CBOM
 *   4. ML-DSA-65 detached signature over the CBOM   → cbom.signed.json
 *   5. ML-DSA-65 service attestation ("re-sign")    → service-attestation.signed.json
 *   6. HCS anchoring of all hashes (Hedera testnet) → txId + sequence + topic
 *
 * HONESTY NOTE (do not remove): the ML-DSA-65 signature covers the service
 * attestation artifact and CBOM — it does NOT replace the service's TLS
 * certificate, which remains classical and CDN-managed. This is a hybrid
 * "signature layered above classical TLS" — say exactly that in any
 * external material.
 *
 * Usage:
 *   HEDERA_OPERATOR_ID=0.0.x HEDERA_OPERATOR_KEY=... pnpm pilot0:resign [domain] [outDir]
 *   (omit Hedera env vars to skip anchoring — everything else still runs)
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { generateKeyPair, sign } from '@taurus/pqc-crypto'
import { scanDomain } from '../src/scanner.js'
import { generateCBOM, signCBOM, verifyCBOM } from '../src/cbom.js'
import { calculateQrsScore } from '../src/qrs-score.js'

const here = dirname(fileURLToPath(import.meta.url))
const domain = process.argv[2] ?? 'q-grid.net'
const outDir = process.argv[3] ?? join(here, '../../../..', 'docs/evidence/pilot-0')

const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
const sha256 = (data: string) => createHash('sha256').update(data).digest('hex')

async function main() {
  mkdirSync(outDir, { recursive: true })

  // 1. Live scan
  console.log(`[1/6] Scanning ${domain} ...`)
  const scan = await scanDomain(domain)
  if (scan.error) throw new Error(`Scan failed: ${scan.error}`)
  const qrs = calculateQrsScore(scan)
  console.log(`      TLS ${scan.tlsVersion}, ${scan.algorithms.length} algorithm(s), ${scan.certificates.length} cert(s), QRS ${qrs.overall}`)

  // 2. CBOM
  console.log('[2/6] Generating CycloneDX 1.6 CBOM ...')
  const cbom = generateCBOM(scan, { targetName: domain })
  const cbomJson = JSON.stringify(cbom, null, 2)
  writeFileSync(join(outDir, 'cbom.json'), cbomJson)

  // 3. Validate against the OFFICIAL CycloneDX 1.6 schema
  console.log('[3/6] Validating against official CycloneDX 1.6 schema ...')
  const ajv = new Ajv({ strict: false, allErrors: true })
  addFormats(ajv)
  ajv.addSchema(JSON.parse(readFileSync(join(here, 'schemas/spdx.schema.json'), 'utf8')))
  ajv.addSchema(JSON.parse(readFileSync(join(here, 'schemas/jsf-0.82.schema.json'), 'utf8')))
  const validate = ajv.compile(
    JSON.parse(readFileSync(join(here, 'schemas/bom-1.6.schema.json'), 'utf8')),
  )
  if (!validate(cbom)) {
    console.error(validate.errors)
    throw new Error('CBOM failed official CycloneDX 1.6 schema validation')
  }
  console.log('      VALID against bom-1.6.schema.json')

  // 4. Sign CBOM (detached ML-DSA-65 envelope)
  console.log('[4/6] Signing CBOM with ML-DSA-65 ...')
  const keys = generateKeyPair()
  const signedCbom = signCBOM(cbom, keys.secretKey, keys.publicKey)
  if (!verifyCBOM(signedCbom)) throw new Error('CBOM signature failed self-verification')
  writeFileSync(join(outDir, 'cbom.signed.json'), JSON.stringify(signedCbom, null, 2))
  console.log('      Signature verified (ML-DSA-65, 3309-byte signature)')

  // 5. Service attestation — the "re-sign" artifact
  console.log('[5/6] Re-signing service attestation with ML-DSA-65 ...')
  const attestation = {
    kind: 'gridera:service-attestation',
    version: 1,
    service: {
      name: `${domain} (TAURUS AI Corp marketing site — non-critical enterprise service)`,
      domain,
      tlsVersion: scan.tlsVersion,
      leafCertFingerprint: scan.certificates[0]?.fingerprint ?? null,
      classicalTlsNote:
        'TLS remains classical and CDN-managed. This ML-DSA-65 signature covers the service attestation + CBOM, layered above classical TLS.',
    },
    cbomSha256: sha256(cbomJson),
    qrs: { overall: qrs.overall, riskLevel: qrs.riskLevel },
    attestedAt: new Date().toISOString(),
    attestedBy: 'TAURUS AI Corp (GRIDERA pilot-0, self-serve design partner #0)',
  }
  const attestationJson = JSON.stringify(attestation)
  const attSignature = sign(new TextEncoder().encode(attestationJson), keys.secretKey)
  const signedAttestation = {
    attestation,
    signature: {
      algorithm: 'ML-DSA-65' as const,
      publicKey: hex(keys.publicKey),
      value: hex(attSignature),
      signedAt: new Date().toISOString(),
    },
  }
  writeFileSync(
    join(outDir, 'service-attestation.signed.json'),
    JSON.stringify(signedAttestation, null, 2),
  )

  // 6. Anchor on Hedera HCS (testnet)
  const summary: Record<string, unknown> = {
    domain,
    cbomSha256: attestation.cbomSha256,
    attestationSha256: sha256(attestationJson),
    signerPublicKeySha256: sha256(hex(keys.publicKey)),
  }
  if (process.env['HEDERA_OPERATOR_ID'] && process.env['HEDERA_OPERATOR_KEY']) {
    console.log('[6/6] Anchoring to Hedera HCS ...')
    const { loadHederaConfig, createHederaClient, createTopic, submitToHCS } = await import(
      '@taurus/hedera'
    )
    const config = loadHederaConfig()
    const client = createHederaClient(config)
    const topicId =
      process.env['PILOT0_TOPIC_ID'] ??
      (await createTopic(client, 'GRIDERA pilot-0 DoD evidence (self-serve design partner #0)'))
    const message = JSON.stringify({
      type: 'PILOT0_SERVICE_RESIGN',
      network: config.network,
      ...summary,
      anchoredAt: new Date().toISOString(),
    })
    const { txId, sequence } = await submitToHCS(client, topicId, message)
    client.close()
    summary['hcs'] = { network: config.network, topicId, txId, sequence }
    console.log(`      Anchored: topic ${topicId}, tx ${txId}, seq ${sequence}`)
  } else {
    summary['hcs'] = 'SKIPPED — no HEDERA_OPERATOR_ID/HEDERA_OPERATOR_KEY in env'
    console.log('[6/6] SKIPPED HCS anchoring (no operator credentials in env)')
  }

  writeFileSync(join(outDir, 'run-summary.json'), JSON.stringify(summary, null, 2))
  console.log(`\nEvidence written to ${outDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
