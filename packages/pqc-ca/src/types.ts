import type { Jurisdiction } from '@taurus/pqc-crypto'

export interface PqcCertificate {
  version: '1.0'
  serial: string
  subject: {
    cn: string
    o: string
    c: Jurisdiction
  }
  issuer: {
    cn: string
    o: string
  }
  notBefore: string
  notAfter: string
  publicKey: {
    algorithm: 'ML-DSA-65'
    key: string
  }
  extensions: Record<string, unknown>
  signature: {
    algorithm: 'ML-DSA-65'
    value: string
    issuerKeyHash: string
  }
}

export type CertificateRole = 'root-ca' | 'org-ca' | 'agent'

export interface CertificateRequest {
  subject: {
    cn: string
    o: string
    c: Jurisdiction
  }
  role: CertificateRole
  validityDays: number
  extensions?: Record<string, unknown>
}
