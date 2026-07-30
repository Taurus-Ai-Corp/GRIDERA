/**
 * diagnose-platform-pair — resolve a fractured platform key set.
 *
 * Given the platform SECRET key (from PLATFORM_PQC_SECRET_KEY in env) and any
 * number of CANDIDATE public keys (env vars whose name starts with CAND_),
 * find which public key actually PAIRS with the secret — by signing a probe
 * with the secret and checking which public verifies it. Ground truth, not a
 * guess.
 *
 * If a match is found, rewrites <repoRoot>/.env.local so PLATFORM_PQC_PUBLIC_KEY
 * is the matching public and PLATFORM_PQC_SECRET_KEY is the secret (touching
 * only those two lines), and prints the signer fingerprint. If none match, it
 * says so — the secret's public was never saved and the key must be rotated.
 *
 * Never prints any key value. Usage (candidates supplied via env):
 *   PLATFORM_PQC_SECRET_KEY=... CAND_landing=... CAND_comply=... CAND_envlocal=... \
 *     tsx scripts/diagnose-platform-pair.ts
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sign, verify } from '@taurus/pqc-crypto'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '../../..')
const envPath = join(repoRoot, '.env.local')

const toBytes = (hex: string) => new Uint8Array(Buffer.from(hex, 'hex'))
const fp = (hex: string) => createHash('sha256').update(hex).digest('hex')

function envLocalValue(key: string): string {
  if (!existsSync(envPath)) return ''
  let out = ''
  for (const raw of readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim()
    const eq = line.indexOf('=')
    if (eq === -1) continue
    if (line.slice(0, eq).trim() === key) {
      const v = line.slice(eq + 1).trim()
      if (v) out = v
    }
  }
  return out
}

const secret = (process.env['PLATFORM_PQC_SECRET_KEY'] ?? envLocalValue('PLATFORM_PQC_SECRET_KEY'))
  .trim()
  .toLowerCase()
if (secret.length !== 8064) {
  console.error(`Secret key is ${secret.length} hex chars; expected 8064. Aborting.`)
  process.exit(2)
}

// Candidate public keys: every CAND_* env var, plus the current .env.local one.
const candidates: Record<string, string> = {}
for (const [k, v] of Object.entries(process.env)) {
  if (k.startsWith('CAND_') && v) candidates[k.slice(5)] = v.trim().toLowerCase()
}
const envlocalPub = envLocalValue('PLATFORM_PQC_PUBLIC_KEY')
if (envlocalPub) candidates['envlocal'] = envlocalPub.trim().toLowerCase()

const probe = new TextEncoder().encode('gridera:diagnose-platform-pair')
const sig = sign(probe, toBytes(secret))

let match: string | null = null
for (const [name, pub] of Object.entries(candidates)) {
  if (pub.length !== 3904) {
    console.log(`  ${name}: pubkey len ${pub.length} (expected 3904) — skipped`)
    continue
  }
  const ok = verify(probe, sig, toBytes(pub))
  console.log(`  ${name}: ${ok ? 'MATCH ✓' : 'no match'}  fp=${fp(pub).slice(0, 12)}…`)
  if (ok && !match) match = pub
}

if (!match) {
  console.log(
    '\nNO candidate public key pairs with this secret — its public was never saved. Rotate the key.',
  )
  process.exit(1)
}

// Rewrite only the two PLATFORM_PQC_* lines in .env.local.
const kept = readFileSync(envPath, 'utf8')
  .split('\n')
  .filter((l) => !/^PLATFORM_PQC_(SECRET|PUBLIC)_KEY=/.test(l.trim()))
  .join('\n')
  .replace(/\n+$/, '\n')
writeFileSync(
  envPath,
  `${kept}PLATFORM_PQC_PUBLIC_KEY=${match}\nPLATFORM_PQC_SECRET_KEY=${secret}\n`,
)
console.log(`\nWROTE consistent pair to .env.local. Signer fingerprint = ${fp(match)}`)
