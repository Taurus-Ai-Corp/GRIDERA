import { verify, hashBytesQuantum } from '@taurus/pqc-crypto'
import type { PqcCertificate } from './types.js'

/**
 * Produce canonical JSON of the signable fields (everything except signature).
 * Keys are sorted recursively for deterministic output.
 */
export function canonicalize(cert: PqcCertificate): string {
  const { signature: _sig, ...signable } = cert
  return stableStringify(signable)
}

/**
 * Deterministic JSON.stringify with recursively sorted keys.
 */
export function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return JSON.stringify(obj)
  if (typeof obj !== 'object') return JSON.stringify(obj)
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => stableStringify(item)).join(',') + ']'
  }
  const record = obj as Record<string, unknown>
  const keys = Object.keys(record).sort()
  const pairs = keys.map((k) => JSON.stringify(k) + ':' + stableStringify(record[k]))
  return '{' + pairs.join(',') + '}'
}

/**
 * Verify a certificate's signature against a known issuer public key.
 */
export function verifyCertificate(
  cert: PqcCertificate,
  issuerPublicKey: Uint8Array,
): boolean {
  const canonical = canonicalize(cert)
  const message = new TextEncoder().encode(canonical)
  const signature = hexToBytes(cert.signature.value)

  // Verify issuer key hash matches
  const expectedKeyHash = hashBytesQuantum(issuerPublicKey)
  if (cert.signature.issuerKeyHash !== expectedKeyHash) {
    return false
  }

  return verify(message, signature, issuerPublicKey)
}

/**
 * Verify a full certificate chain: Agent -> Org CA -> Root CA.
 *
 * 1. Root CA cert is self-signed (issuer = subject)
 * 2. Org CA cert is signed by Root CA
 * 3. Agent cert is signed by Org CA
 */
export function verifyCertificateChain(
  cert: PqcCertificate,
  orgCACert: PqcCertificate,
  rootCACert: PqcCertificate,
): boolean {
  // 1. Verify root CA is self-signed
  const rootPubKey = hexToBytes(rootCACert.publicKey.key)
  if (!verifyCertificate(rootCACert, rootPubKey)) {
    return false
  }

  // 2. Verify org CA cert was signed by root CA
  if (!verifyCertificate(orgCACert, rootPubKey)) {
    return false
  }

  // 3. Verify agent cert was signed by org CA
  const orgPubKey = hexToBytes(orgCACert.publicKey.key)
  if (!verifyCertificate(cert, orgPubKey)) {
    return false
  }

  // 4. Verify issuer chain matches subjects
  if (
    orgCACert.issuer.cn !== rootCACert.subject.cn ||
    orgCACert.issuer.o !== rootCACert.subject.o
  ) {
    return false
  }
  if (cert.issuer.cn !== orgCACert.subject.cn || cert.issuer.o !== orgCACert.subject.o) {
    return false
  }

  return true
}

/**
 * Check if a certificate is expired or not yet valid.
 */
export function isCertificateExpired(cert: PqcCertificate): boolean {
  const now = Date.now()
  const notBefore = new Date(cert.notBefore).getTime()
  const notAfter = new Date(cert.notAfter).getTime()
  return now < notBefore || now > notAfter
}

// ── Helpers ──────────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const len = hex.length / 2
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}
