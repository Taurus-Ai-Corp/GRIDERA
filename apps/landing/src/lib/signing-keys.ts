// Loads the platform ML-DSA-65 signing keypair from env, proving the pair
// actually corresponds before using it. A mismatched pair shipped to
// production once (rotated 2026-07-14) and silently produced unverifiable
// signatures on every /api/scan stamp and /api/cbom envelope — this guard
// makes that failure mode impossible: a bad pair falls back to a fresh
// ephemeral keypair, whose signatures at least verify against the public
// key we publish alongside them.

export interface SigningKeys {
  publicKey: Uint8Array
  secretKey: Uint8Array
  source: 'platform' | 'ephemeral'
}

interface KeyEnv {
  publicKeyHex?: string | undefined
  secretKeyHex?: string | undefined
}

// Cached per lambda instance so the self-check signature runs once, not per request
let cached: SigningKeys | undefined

export async function getSigningKeys(): Promise<SigningKeys> {
  if (!cached) {
    cached = await loadSigningKeys({
      publicKeyHex: process.env['PLATFORM_PQC_PUBLIC_KEY'],
      secretKeyHex: process.env['PLATFORM_PQC_SECRET_KEY'],
    })
  }
  return cached
}

// Exported for tests; dynamic import avoids build issues with Node.js modules
// (same pattern as the API routes)
export async function loadSigningKeys(env: KeyEnv): Promise<SigningKeys> {
  const { generateKeyPair, sign, verify } = await import('@taurus/pqc-crypto')

  if (env.publicKeyHex && env.secretKeyHex) {
    try {
      const publicKey = Uint8Array.from(Buffer.from(env.publicKeyHex, 'hex'))
      const secretKey = Uint8Array.from(Buffer.from(env.secretKeyHex, 'hex'))
      const probe = new TextEncoder().encode('platform-key-self-check')
      if (verify(probe, sign(probe, secretKey), publicKey)) {
        return { publicKey, secretKey, source: 'platform' }
      }
      console.error(
        'PLATFORM_PQC key pair failed self-verification (public key does not match secret key) — signing with ephemeral keypair instead',
      )
    } catch (error) {
      console.error('PLATFORM_PQC keys unusable — signing with ephemeral keypair instead', error)
    }
  }
  return { ...generateKeyPair(), source: 'ephemeral' }
}
