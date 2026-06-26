/**
 * Generate platform ML-DSA-65 signing keypair and encryption key.
 *
 * Run once: npx tsx scripts/init-platform-key.ts
 *
 * Output goes to stdout — copy values to .env.local and Vercel env vars.
 * NEVER commit the secret key or encryption key to git.
 */
import { randomBytes } from 'node:crypto'

// 1. Platform encryption key (for encrypting org secret keys at rest)
const encryptionKey = randomBytes(32).toString('hex')

// 2. Platform ML-DSA-65 signing keypair
// We dynamically import to handle ESM
async function main() {
  const { ml_dsa65 } = await import('@noble/post-quantum/ml-dsa')
  const { randomBytes: nobleRandom } = await import('@noble/hashes/utils')
  const { bytesToHex } = await import('@noble/hashes/utils')

  const seed = nobleRandom(32)
  const kp = ml_dsa65.keygen(seed)

  console.log('# ============================================')
  console.log('# GRIDERA Platform Keys — Generated ' + new Date().toISOString())
  console.log('# Add these to .env.local AND Vercel env vars')
  console.log('# NEVER commit these values to git')
  console.log('# ============================================')
  console.log('')
  console.log('# AES-256-GCM key for encrypting org PQC secret keys')
  console.log(`PLATFORM_ENCRYPTION_KEY=${encryptionKey}`)
  console.log('')
  console.log('# ML-DSA-65 platform signing keypair (FIPS 204)')
  console.log(`PLATFORM_PQC_PUBLIC_KEY=${bytesToHex(kp.publicKey)}`)
  console.log(`PLATFORM_PQC_SECRET_KEY=${bytesToHex(kp.secretKey)}`)
  console.log('')
  console.log(`# Public key length: ${kp.publicKey.length} bytes`)
  console.log(`# Secret key length: ${kp.secretKey.length} bytes`)
  console.log('# Algorithm: ML-DSA-65 (NIST FIPS 204, Level 3)')
}

main().catch(console.error)
