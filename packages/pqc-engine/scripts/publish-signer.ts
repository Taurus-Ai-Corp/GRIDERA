/**
 * publish-signer — write `.gridera/signer.json`, the PUBLIC, pinnable GRIDERA
 * signer identity, from PLATFORM_PQC_PUBLIC_KEY.
 *
 * Needs ONLY the public key (never the secret), so it can publish the identity
 * that `gridera-verify --signer <fingerprint>` pins against even before any
 * bundle is (re-)signed. The public key and its SHA-256 fingerprint are safe
 * to commit — that is the entire point of a signer identity.
 *
 * Usage:  tsx scripts/publish-signer.ts
 * Env:    PLATFORM_PQC_PUBLIC_KEY (hex, 1952 bytes) — read from <repoRoot>/.env.local.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { signerFingerprint } from '../src/platform-key.js'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '../../..') // packages/pqc-engine/scripts → repo root
const bundleDir = join(repoRoot, '.gridera')

/** Minimal .env parser: last non-empty value per key wins (file has dup keys). */
function loadEnvLocal(): void {
  const path = join(repoRoot, '.env.local')
  if (!existsSync(path)) return
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
    if (value === '') continue
    process.env[key] = value
  }
}

loadEnvLocal()

const publicKeyHex = (process.env['PLATFORM_PQC_PUBLIC_KEY'] ?? '').trim().toLowerCase()
if (!publicKeyHex) {
  throw new Error('PLATFORM_PQC_PUBLIC_KEY not set (add it to .env.local).')
}
if (!/^[0-9a-f]{3904}$/.test(publicKeyHex)) {
  throw new Error(
    `PLATFORM_PQC_PUBLIC_KEY must be 1952-byte (3904-hex) ML-DSA-65 public key; got ${publicKeyHex.length} hex chars.`,
  )
}

const fingerprint = signerFingerprint(publicKeyHex)
const signer = {
  algorithm: 'ML-DSA-65' as const,
  publicKey: publicKeyHex,
  fingerprintSha256: fingerprint,
  note:
    'GRIDERA platform signer identity. Pin with: gridera-verify --signer sha256:' +
    fingerprint +
    ' (or the full publicKey hex). The public key is safe to publish; the secret key is never committed.',
  generatedAt: new Date().toISOString(),
}

mkdirSync(bundleDir, { recursive: true })
writeFileSync(join(bundleDir, 'signer.json'), `${JSON.stringify(signer, null, 2)}\n`)
console.log(`Wrote ${join(bundleDir, 'signer.json')}`)
console.log(`  algorithm   : ML-DSA-65`)
console.log(`  fingerprint : sha256:${fingerprint}`)
