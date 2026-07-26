import {
  generateKeyPair,
  sign,
  hashBytesQuantum,
  type Jurisdiction,
  type PqcKeyPair,
} from '@taurus/pqc-crypto'
import { stableStringify, verifyCertificate as verifyCert } from './verify.js'
import type { PqcCertificate, CertificateRequest, CertificateRole } from './types.js'

// ── Helpers ──────────────────────────────────────────────────────────

function bytesToHex(bytes: Uint8Array): string {
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, '0')
  }
  return hex
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// ── Certificate Authority ────────────────────────────────────────────

export class CertificateAuthority {
  readonly name: string
  readonly role: CertificateRole
  private readonly secretKey: Uint8Array
  private readonly publicKey: Uint8Array
  private readonly certificate: PqcCertificate

  private constructor(
    name: string,
    secretKey: Uint8Array,
    publicKey: Uint8Array,
    role: CertificateRole,
    certificate: PqcCertificate,
  ) {
    this.name = name
    this.secretKey = secretKey
    this.publicKey = publicKey
    this.role = role
    this.certificate = certificate
  }

  /**
   * Create a new self-signed Root CA.
   */
  static createRootCA(name: string): CertificateAuthority {
    const keyPair = generateKeyPair()
    const pubKeyHex = bytesToHex(keyPair.publicKey)
    const now = new Date()

    // Build unsigned certificate
    const unsignedCert: Omit<PqcCertificate, 'signature'> = {
      version: '1.0',
      serial: crypto.randomUUID(),
      subject: { cn: name, o: 'TAURUS AI Corp', c: 'na' },
      issuer: { cn: name, o: 'TAURUS AI Corp' },
      notBefore: now.toISOString(),
      notAfter: addDays(now, 3650).toISOString(), // 10 years
      publicKey: { algorithm: 'ML-DSA-65', key: pubKeyHex },
      extensions: { ca: true, role: 'root-ca' },
    }

    // Self-sign
    const signature = signCertificate(unsignedCert, keyPair)
    const certificate: PqcCertificate = {
      ...unsignedCert,
      signature,
    }

    return new CertificateAuthority(
      name,
      keyPair.secretKey,
      keyPair.publicKey,
      'root-ca',
      certificate,
    )
  }

  /**
   * Create an Org CA signed by a Root CA.
   */
  static createOrgCA(
    name: string,
    jurisdiction: Jurisdiction,
    rootCA: CertificateAuthority,
  ): CertificateAuthority {
    const keyPair = generateKeyPair()
    const pubKeyHex = bytesToHex(keyPair.publicKey)

    const request: CertificateRequest = {
      subject: { cn: name, o: 'TAURUS AI Corp', c: jurisdiction },
      role: 'org-ca',
      validityDays: 1825, // 5 years
      extensions: { ca: true, role: 'org-ca', jurisdiction },
    }

    // Root CA issues the certificate for this Org CA
    const orgCert = rootCA.issueCertificateWithKey(request, pubKeyHex)

    return new CertificateAuthority(
      name,
      keyPair.secretKey,
      keyPair.publicKey,
      'org-ca',
      orgCert,
    )
  }

  /**
   * Issue a certificate for a given request.
   * The certificate is signed by this CA's key.
   */
  issueCertificate(request: CertificateRequest): PqcCertificate {
    const keyPair = generateKeyPair()
    const pubKeyHex = bytesToHex(keyPair.publicKey)
    return this.issueCertificateWithKey(request, pubKeyHex)
  }

  /**
   * Issue a certificate for a given request using a pre-existing public key.
   * Used internally when the caller already has a keypair.
   */
  private issueCertificateWithKey(
    request: CertificateRequest,
    subjectPublicKeyHex: string,
  ): PqcCertificate {
    const now = new Date()

    const unsignedCert: Omit<PqcCertificate, 'signature'> = {
      version: '1.0',
      serial: crypto.randomUUID(),
      subject: request.subject,
      issuer: { cn: this.name, o: this.certificate.subject.o },
      notBefore: now.toISOString(),
      notAfter: addDays(now, request.validityDays).toISOString(),
      publicKey: { algorithm: 'ML-DSA-65', key: subjectPublicKeyHex },
      extensions: request.extensions ?? {},
    }

    const signature = signCertificate(unsignedCert, {
      publicKey: this.publicKey,
      secretKey: this.secretKey,
    })

    return { ...unsignedCert, signature }
  }

  /**
   * Verify a certificate that was issued by this CA.
   */
  verifyCertificate(cert: PqcCertificate): boolean {
    return verifyCert(cert, this.publicKey)
  }

  /**
   * Get this CA's own certificate.
   */
  getCertificate(): PqcCertificate {
    return this.certificate
  }

  /**
   * Get this CA's public key as raw bytes.
   */
  getPublicKey(): Uint8Array {
    return this.publicKey
  }
}

// ── Internal signing helper ──────────────────────────────────────────

function signCertificate(
  unsignedCert: Omit<PqcCertificate, 'signature'>,
  keyPair: PqcKeyPair,
): PqcCertificate['signature'] {
  const canonical = stableStringify(unsignedCert)
  const message = new TextEncoder().encode(canonical)
  const sig = sign(message, keyPair.secretKey)

  return {
    algorithm: 'ML-DSA-65',
    value: bytesToHex(sig),
    issuerKeyHash: hashBytesQuantum(keyPair.publicKey),
  }
}
