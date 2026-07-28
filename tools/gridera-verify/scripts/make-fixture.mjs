// Regenerate the committed sample .gridera bundle used by the tests / README.
//
//   node tools/gridera-verify/scripts/make-fixture.mjs
//
// Produces fixtures/sample/.gridera/{cbom.signed.json, anchor.json} with a real
// ML-DSA-65 signature and a matching cbomSha256. The anchor points at the
// pilot-0 testnet topic (0.0.9551792) for illustration; the mirror-node message
// there will NOT carry this locally-generated hash, so a live `--network testnet`
// run of the CLI is expected to PASS signature+anchor-hash and FAIL mirror
// (that is the honest, offline-reproducible state — real anchoring needs a real
// HCS submit, which the verifier deliberately does not perform).

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { generateCBOM, signCBOM } from '@taurus/pqc-engine'
import { generateKeyPair } from '@taurus/pqc-crypto'

import { computeCbomSha256 } from '../src/verify.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'fixtures', 'sample', '.gridera')

const scan = {
  domain: 'example.test',
  tlsVersion: 'TLSv1.3',
  algorithms: [
    { name: 'RSA', keySize: 2048, grade: 'F', severity: 'high', vulnerable: true },
    { name: 'ML-DSA-65', keySize: 1952, grade: 'A', severity: 'none', vulnerable: false },
  ],
  certificates: [],
  scannedAt: '2026-07-27T00:00:00.000Z',
}

const cbom = generateCBOM(scan, { targetName: scan.domain })
const keys = generateKeyPair()
const signed = signCBOM(cbom, keys.secretKey, keys.publicKey)
const cbomSha256 = computeCbomSha256(signed)

const anchor = {
  topicId: '0.0.9551792',
  sequenceNumber: 7,
  consensusTimestamp: '1753660800.000000001',
  cbomSha256,
}

mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'cbom.signed.json'), JSON.stringify(signed, null, 2))
writeFileSync(join(outDir, 'anchor.json'), JSON.stringify(anchor, null, 2))

console.log(`Wrote sample bundle to ${outDir}`)
console.log(`  cbomSha256: ${cbomSha256}`)
