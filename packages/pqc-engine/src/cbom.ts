import { randomUUID } from 'node:crypto'
import { sign, verify } from '@taurus/pqc-crypto'
import type { Algorithm, CertificateInfo, ScanResult } from './types.js'

// --- CycloneDX 1.6 CBOM types (subset used by GRIDERA) ---

export interface CbomAlgorithmProperties {
  primitive: 'signature' | 'kem' | 'ae' | 'hash' | 'other'
  parameterSetIdentifier?: string
  nistQuantumSecurityLevel?: number
  cryptoFunctions: string[]
}

export interface CbomCertificateProperties {
  subjectName: string
  issuerName: string
  notValidBefore?: string
  notValidAfter?: string
  certificateFormat: 'X.509'
}

export interface CbomProtocolProperties {
  type: 'tls'
  version: string
}

export interface CbomCryptoProperties {
  assetType: 'algorithm' | 'certificate' | 'protocol' | 'related-crypto-material'
  algorithmProperties?: CbomAlgorithmProperties
  certificateProperties?: CbomCertificateProperties
  protocolProperties?: CbomProtocolProperties
}

export interface CbomComponent {
  type: 'cryptographic-asset'
  'bom-ref': string
  name: string
  cryptoProperties: CbomCryptoProperties
  properties?: Array<{ name: string; value: string }>
}

export interface CycloneDXDocument {
  bomFormat: 'CycloneDX'
  specVersion: '1.6'
  serialNumber: string
  version: number
  metadata: {
    timestamp: string
    tools: {
      components: Array<{ type: 'application'; name: string; version: string }>
    }
    component: {
      type: 'application'
      'bom-ref': string
      name: string
      version?: string
    }
  }
  components: CbomComponent[]
}

export interface SignedCBOM {
  cbom: CycloneDXDocument
  signature: {
    algorithm: 'ML-DSA-65'
    publicKey: string
    value: string
    signedAt: string
  }
}

export interface CbomMeta {
  targetName?: string
  targetVersion?: string
}

// NIST PQC security levels for known parameter sets only.
// Unknown PQC algorithms get no level rather than an invented one.
const PQC_SECURITY_LEVELS: Record<string, number> = {
  'ML-KEM-512': 1,
  'ML-KEM-768': 3,
  'ML-KEM-1024': 5,
  'ML-DSA-44': 2,
  'ML-DSA-65': 3,
  'ML-DSA-87': 5,
}

const PQC_NAMES = ['DILITHIUM', 'KYBER', 'ML-KEM', 'ML-DSA', 'SLH-DSA', 'SPHINCS']
const KEM_NAMES = ['ML-KEM', 'KYBER']

function isPqc(name: string): boolean {
  const upper = name.toUpperCase()
  return PQC_NAMES.some((pqc) => upper.includes(pqc))
}

function primitiveFor(name: string): CbomAlgorithmProperties['primitive'] {
  const upper = name.toUpperCase()
  if (KEM_NAMES.some((kem) => upper.includes(kem))) return 'kem'
  return 'signature'
}

function quantumSecurityLevel(algo: Algorithm): number | undefined {
  const upper = algo.name.toUpperCase()
  if (!isPqc(upper)) return 0
  for (const [paramSet, level] of Object.entries(PQC_SECURITY_LEVELS)) {
    if (upper.includes(paramSet)) return level
  }
  return undefined
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function algorithmComponent(algo: Algorithm, index: number): CbomComponent {
  const level = quantumSecurityLevel(algo)
  const algorithmProperties: CbomAlgorithmProperties = {
    primitive: primitiveFor(algo.name),
    parameterSetIdentifier: `${algo.name}-${algo.keySize}`,
    cryptoFunctions: ['keygen', 'sign', 'verify'],
  }
  if (level !== undefined) algorithmProperties.nistQuantumSecurityLevel = level

  return {
    type: 'cryptographic-asset',
    'bom-ref': `crypto/algorithm/${slugify(algo.name)}-${algo.keySize}@${index}`,
    name: algo.name,
    cryptoProperties: {
      assetType: 'algorithm',
      algorithmProperties,
    },
    properties: [
      { name: 'gridera:grade', value: algo.grade },
      { name: 'gridera:severity', value: algo.severity },
      { name: 'gridera:quantumVulnerable', value: String(algo.vulnerable) },
    ],
  }
}

function certificateComponent(cert: CertificateInfo, index: number): CbomComponent {
  const ref = cert.fingerprint ? slugify(cert.fingerprint) : `cert-${index}`
  const certificateProperties: CbomCertificateProperties = {
    subjectName: cert.subject,
    issuerName: cert.issuer,
    certificateFormat: 'X.509',
  }
  // Node TLS reports cert dates as e.g. "Jan  1 00:00:00 2026 GMT" —
  // CycloneDX 1.6 requires RFC 3339 date-time, so normalize (omit if unparseable).
  const iso = (value: string): string | undefined => {
    const ms = Date.parse(value)
    return Number.isNaN(ms) ? undefined : new Date(ms).toISOString()
  }
  const notBefore = cert.validFrom ? iso(cert.validFrom) : undefined
  const notAfter = cert.validTo ? iso(cert.validTo) : undefined
  if (notBefore) certificateProperties.notValidBefore = notBefore
  if (notAfter) certificateProperties.notValidAfter = notAfter

  return {
    type: 'cryptographic-asset',
    'bom-ref': `crypto/certificate/${ref}@${index}`,
    name: cert.subject,
    cryptoProperties: {
      assetType: 'certificate',
      certificateProperties,
    },
  }
}

function protocolComponent(tlsVersion: string): CbomComponent {
  return {
    type: 'cryptographic-asset',
    'bom-ref': `crypto/protocol/tls-${slugify(tlsVersion)}`,
    name: `TLS (${tlsVersion})`,
    cryptoProperties: {
      assetType: 'protocol',
      protocolProperties: { type: 'tls', version: tlsVersion },
    },
  }
}

/**
 * Generate a CycloneDX 1.6 Cryptographic Bill of Materials from a GRIDERA scan.
 * Components cover: discovered public-key algorithms, X.509 certificates, and
 * the negotiated TLS protocol version.
 */
export function generateCBOM(scan: ScanResult, meta: CbomMeta = {}): CycloneDXDocument {
  const components: CbomComponent[] = [
    ...scan.algorithms.map((algo, i) => algorithmComponent(algo, i)),
    ...scan.certificates.map((cert, i) => certificateComponent(cert, i)),
  ]
  if (scan.tlsVersion && scan.tlsVersion !== 'unknown') {
    components.push(protocolComponent(scan.tlsVersion))
  }

  const targetName = meta.targetName ?? scan.domain
  const metadataComponent: CycloneDXDocument['metadata']['component'] = {
    type: 'application',
    'bom-ref': `target/${slugify(targetName)}`,
    name: targetName,
  }
  if (meta.targetVersion) metadataComponent.version = meta.targetVersion

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    serialNumber: `urn:uuid:${randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: scan.scannedAt || new Date().toISOString(),
      tools: {
        components: [{ type: 'application', name: 'GRIDERA pqc-engine', version: '0.1.0' }],
      },
      component: metadataComponent,
    },
    components,
  }
}

function canonicalBytes(cbom: CycloneDXDocument): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(cbom))
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

/**
 * Detached ML-DSA-65 signature over the canonical JSON of the CBOM.
 * The signature lives in an envelope, NOT inside the BOM, so the BOM itself
 * stays valid against the strict CycloneDX 1.6 schema.
 */
export function signCBOM(
  cbom: CycloneDXDocument,
  secretKey: Uint8Array,
  publicKey: Uint8Array,
): SignedCBOM {
  const signature = sign(canonicalBytes(cbom), secretKey)
  return {
    cbom,
    signature: {
      algorithm: 'ML-DSA-65',
      publicKey: bytesToHex(publicKey),
      value: bytesToHex(signature),
      signedAt: new Date().toISOString(),
    },
  }
}

export function verifyCBOM(signed: SignedCBOM): boolean {
  return verify(
    canonicalBytes(signed.cbom),
    hexToBytes(signed.signature.value),
    hexToBytes(signed.signature.publicKey),
  )
}
