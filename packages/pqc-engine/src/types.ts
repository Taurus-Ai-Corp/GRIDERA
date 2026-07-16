export interface Algorithm {
  name: string
  keySize: number
  grade: CryptoGrade
  vulnerable: boolean
  severity: 'critical' | 'high' | 'moderate' | 'low' | 'none'
}

export type CryptoGrade = 'CRITICAL' | 'WEAK' | 'MODERATE' | 'STRONG' | 'PQC_READY' | 'ERROR'

export interface CertificateInfo {
  subject: string
  issuer: string
  validFrom: string
  validTo: string
  daysUntilExpiry: number
  serialNumber: string
  fingerprint: string
}

// Result of probing whether the TLS endpoint negotiates a post-quantum
// hybrid key exchange (e.g. X25519MLKEM768). This is separate from the
// certificate's signature algorithm: a site can run quantum-safe key
// exchange today while still using a classical (RSA/ECDSA) certificate,
// because no browser-trusted CA issues PQC certificates yet.
export interface KeyExchangeInfo {
  // true = negotiated a PQC hybrid group; false = TLS 1.3 endpoint that
  // refused it; null = could not be determined (see `detected`/`note`).
  hybridPqcSupported: boolean | null
  // The PQC hybrid group confirmed, when supported (e.g. 'X25519MLKEM768').
  group?: string
  // false when the scanning runtime's OpenSSL (< 3.5) cannot negotiate
  // ML-KEM at all — in that case hybridPqcSupported is null, never false,
  // so we never report a capable server as unsupported.
  detected: boolean
  detectionMethod: 'tls13-negotiation-probe'
  note?: string
}

export interface ScanResult {
  domain: string
  scannedAt: string
  algorithms: Algorithm[]
  certificates: CertificateInfo[]
  tlsVersion: string
  keyExchange?: KeyExchangeInfo
  error?: string
}

export interface QrsScore {
  overall: number
  categories: {
    algorithms: number
    keySize: number
    pqcReadiness: number
    compliance: number
  }
  riskLevel: 'critical' | 'high' | 'moderate' | 'low'
  vulnerableAlgorithms: Algorithm[]
  migrationPriority: 'immediate' | 'high' | 'medium' | 'low'
}

export interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  framework?: string
}

export type Jurisdiction = 'na' | 'eu' | 'in' | 'ae'
