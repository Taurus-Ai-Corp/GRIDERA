import * as tls from 'tls'
import { probeHybridKex } from './kex.js'
import type { Algorithm, CertificateInfo, CryptoGrade, ScanResult } from './types.js'

const PQC_ALGORITHMS = ['DILITHIUM', 'KYBER', 'ML-KEM', 'ML-DSA', 'SLH-DSA', 'SPHINCS']

function classifyCrypto(algorithm: string, keySize: number): CryptoGrade {
  const algo = algorithm.toUpperCase()
  if (PQC_ALGORITHMS.some((pqc) => algo.includes(pqc))) return 'PQC_READY'
  if (algo.includes('RSA')) {
    if (keySize <= 1024) return 'CRITICAL'
    if (keySize <= 2048) return 'WEAK'
    if (keySize <= 3072) return 'MODERATE'
    return 'STRONG'
  }
  if (algo.includes('ECDSA') || algo.includes('EC')) {
    if (keySize <= 256) return 'WEAK'
    if (keySize <= 384) return 'MODERATE'
    return 'STRONG'
  }
  if (algo.includes('ED25519') || algo.includes('ED448')) return 'MODERATE'
  return 'WEAK'
}

function gradeToSeverity(grade: CryptoGrade): Algorithm['severity'] {
  switch (grade) {
    case 'CRITICAL':
      return 'critical'
    case 'WEAK':
      return 'high'
    case 'MODERATE':
      return 'moderate'
    case 'STRONG':
      return 'low'
    case 'PQC_READY':
      return 'none'
    default:
      return 'high'
  }
}

function gradeToVulnerable(grade: CryptoGrade): boolean {
  return grade === 'CRITICAL' || grade === 'WEAK'
}

function parseCertificate(cert: tls.PeerCertificate): { certInfo: CertificateInfo; algorithm: Algorithm } {
  const rawSubject = cert.subject?.CN ?? cert.subject?.O ?? 'Unknown'
  const subject = Array.isArray(rawSubject) ? rawSubject[0] ?? 'Unknown' : rawSubject
  const rawIssuer = cert.issuer?.CN ?? cert.issuer?.O ?? 'Unknown'
  const issuer = Array.isArray(rawIssuer) ? rawIssuer[0] ?? 'Unknown' : rawIssuer
  const validFrom = cert.valid_from ?? ''
  const validTo = cert.valid_to ?? ''

  let daysUntilExpiry = 0
  if (validTo) {
    const expiry = new Date(validTo)
    const now = new Date()
    daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const serialNumber = cert.serialNumber ?? ''
  const fingerprint = cert.fingerprint ?? ''

  // Extract algorithm info from the certificate's public key
  // Node.js tls exposes bits and pubkey info via the raw cert object
  const rawCert = cert as tls.PeerCertificate & {
    bits?: number
    pubkey?: { type?: string; name?: string }
    asn1Curve?: string
    nistCurve?: string
  }

  let algoName = 'RSA'
  let keySize = rawCert['bits'] ?? 2048

  if (rawCert['asn1Curve'] ?? rawCert['nistCurve']) {
    algoName = 'ECDSA'
    const curve = (rawCert['asn1Curve'] ?? rawCert['nistCurve'] ?? '').toUpperCase()
    if (curve.includes('521')) keySize = 521
    else if (curve.includes('384')) keySize = 384
    else keySize = 256
  } else if (rawCert['pubkey']) {
    const pubkeyType = rawCert['pubkey']['type'] ?? rawCert['pubkey']['name'] ?? ''
    algoName = pubkeyType || 'RSA'
  }

  const grade = classifyCrypto(algoName, keySize)

  const certInfo: CertificateInfo = {
    subject,
    issuer,
    validFrom,
    validTo,
    daysUntilExpiry,
    serialNumber,
    fingerprint,
  }

  const algorithm: Algorithm = {
    name: algoName,
    keySize,
    grade,
    vulnerable: gradeToVulnerable(grade),
    severity: gradeToSeverity(grade),
  }

  return { certInfo, algorithm }
}

export function scanDomain(domain: string): Promise<ScanResult> {
  return new Promise((resolve) => {
    const scannedAt = new Date().toISOString()

    const socket = tls.connect(
      {
        host: domain,
        port: 443,
        servername: domain,
        rejectUnauthorized: false,
        timeout: 10000,
      },
      () => {
        const peerCert = socket.getPeerCertificate(true)
        const tlsVersion = socket.getProtocol() ?? 'unknown'

        const algorithms: Algorithm[] = []
        const certificates: CertificateInfo[] = []

        if (peerCert && Object.keys(peerCert).length > 0) {
          const { certInfo, algorithm } = parseCertificate(peerCert)
          certificates.push(certInfo)
          algorithms.push(algorithm)

          // Walk the certificate chain (issuer certs)
          let current = peerCert
          let depth = 0
          while (current.issuerCertificate && depth < 5) {
            const issuer = current.issuerCertificate
            // Avoid circular reference (root cert points to itself)
            if (issuer.fingerprint === current.fingerprint) break
            const parsed = parseCertificate(issuer)
            certificates.push(parsed.certInfo)
            current = issuer
            depth++
          }
        }

        socket.destroy()

        // Probe for post-quantum hybrid key exchange on a second, short-lived
        // connection. Independent of the certificate: a site can run PQC key
        // exchange today while its cert stays classical (no PQC CA exists yet).
        probeHybridKex(domain).then((keyExchange) => {
          resolve({
            domain,
            scannedAt,
            algorithms,
            certificates,
            tlsVersion,
            keyExchange,
          })
        })
      },
    )

    socket.setTimeout(10000, () => {
      socket.destroy()
      resolve({
        domain,
        scannedAt,
        algorithms: [],
        certificates: [],
        tlsVersion: 'unknown',
        error: `Connection timed out after 10 seconds`,
      })
    })

    socket.on('error', (err: Error) => {
      socket.destroy()
      resolve({
        domain,
        scannedAt,
        algorithms: [],
        certificates: [],
        tlsVersion: 'unknown',
        error: err.message,
      })
    })
  })
}
