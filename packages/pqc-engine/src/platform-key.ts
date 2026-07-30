/**
 * platform-key — load the GRIDERA platform's STABLE ML-DSA-65 signing key from
 * the environment, instead of minting an ephemeral key per bundle.
 *
 * The published public key IS GRIDERA's signer identity. Evidence bundles
 * (`.gridera/`, `docs/evidence/pilot-0/`) are signed with this key so that
 * verifiers can PIN the signer: `gridera-verify --signer <fingerprint>`.
 *
 * Env (delivered by KMS / OpenBao → Vercel env → process.env in production;
 *      `.env.local` for local runs). Generated once by
 *      `scripts/init-platform-key.ts`:
 *
 *   PLATFORM_PQC_SECRET_KEY  hex, ML-DSA-65 secret key (4032 bytes / 8064 hex)
 *   PLATFORM_PQC_PUBLIC_KEY  hex, ML-DSA-65 public key (1952 bytes / 3904 hex)
 *
 * NEVER commit the secret key. The public key and its SHA-256 fingerprint are
 * safe to publish — that is the entire point of a signer identity.
 */
import { createHash } from 'node:crypto'
import { sign, verify } from '@taurus/pqc-crypto'

const ML_DSA65_SECRET_BYTES = 4032
const ML_DSA65_PUBLIC_BYTES = 1952

export interface PlatformSigningKey {
  secretKey: Uint8Array
  publicKey: Uint8Array
  /** hex of the public key — this is what lands in `signature.publicKey`. */
  publicKeyHex: string
  /** SHA-256 (hex) of the public-key hex string — the pinnable fingerprint. */
  fingerprint: string
}

/**
 * SHA-256 (hex) of a public-key hex string — the canonical signer fingerprint.
 * Matches the existing `signerPublicKeySha256` convention in pilot0-resign.
 */
export function signerFingerprint(publicKeyHex: string): string {
  return createHash('sha256').update(publicKeyHex).digest('hex')
}

function requireHexKey(name: string, expectedBytes: number): { hex: string; bytes: Uint8Array } {
  const hex = (process.env[name] ?? '').trim().toLowerCase()
  if (!hex) {
    throw new Error(
      `${name} is not set. The platform signing key is required (no ephemeral fallback). ` +
        `Generate once with \`npx tsx scripts/init-platform-key.ts\`, then add ${name} to ` +
        `.env.local (local) and Vercel env vars (prod). NEVER commit the secret key.`,
    )
  }
  if (!/^[0-9a-f]+$/.test(hex)) {
    throw new Error(`${name} must be lowercase hex (got ${hex.length} non-hex or mixed chars).`)
  }
  if (hex.length !== expectedBytes * 2) {
    throw new Error(
      `${name} is ${hex.length / 2} bytes; expected ${expectedBytes} (ML-DSA-65). ` +
        `Wrong key or truncated value.`,
    )
  }
  return { hex, bytes: new Uint8Array(Buffer.from(hex, 'hex')) }
}

/**
 * Load and validate the platform ML-DSA-65 signing key from the environment.
 *
 * Performs a sign→verify self-consistency probe so that a mismatched
 * secret/public pair fails HERE, loudly, rather than silently producing
 * evidence bundles that never verify. (GRIDERA shipped a mismatched platform
 * pair once, 2026-07-14 — this guard makes that class of bug un-shippable.)
 */
export function loadPlatformSigningKey(): PlatformSigningKey {
  const secret = requireHexKey('PLATFORM_PQC_SECRET_KEY', ML_DSA65_SECRET_BYTES)
  const pub = requireHexKey('PLATFORM_PQC_PUBLIC_KEY', ML_DSA65_PUBLIC_BYTES)

  const probe = new TextEncoder().encode('gridera:platform-key:consistency-probe')
  const sig = sign(probe, secret.bytes)
  if (!verify(probe, sig, pub.bytes)) {
    throw new Error(
      'PLATFORM_PQC_SECRET_KEY and PLATFORM_PQC_PUBLIC_KEY are a MISMATCHED pair ' +
        '(probe signature does not verify). Regenerate BOTH together with ' +
        'scripts/init-platform-key.ts.',
    )
  }

  return {
    secretKey: secret.bytes,
    publicKey: pub.bytes,
    publicKeyHex: pub.hex,
    fingerprint: signerFingerprint(pub.hex),
  }
}
