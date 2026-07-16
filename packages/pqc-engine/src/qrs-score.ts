import type { Algorithm, QrsScore, ScanResult } from './types.js'

const GRADE_SCORE: Record<string, number> = {
  CRITICAL: 0,
  WEAK: 35,
  MODERATE: 60,
  STRONG: 80,
  PQC_READY: 100,
  ERROR: 0,
}

const WEIGHTS = {
  algorithms: 0.40,
  keySize: 0.30,
  pqcReadiness: 0.20,
  compliance: 0.10,
}

function scoreAlgorithms(algorithms: Algorithm[]): number {
  if (algorithms.length === 0) return 0
  const total = algorithms.reduce((sum, algo) => sum + (GRADE_SCORE[algo.grade] ?? 0), 0)
  return total / algorithms.length
}

function scoreKeySize(algorithms: Algorithm[]): number {
  if (algorithms.length === 0) return 0

  const scores: number[] = algorithms.map((algo) => {
    const name = algo.name.toUpperCase()
    // PQC algorithms get full score
    if (['DILITHIUM', 'KYBER', 'ML-KEM', 'ML-DSA', 'SLH-DSA', 'SPHINCS'].some((pqc) => name.includes(pqc))) {
      return 100
    }
    if (name.includes('RSA')) {
      if (algo.keySize < 2048) return 0
      if (algo.keySize === 2048) return 30
      if (algo.keySize <= 3072) return 60
      return 80
    }
    if (name.includes('ECDSA') || name.includes('EC')) {
      if (algo.keySize <= 256) return 40
      if (algo.keySize <= 384) return 70
      return 85
    }
    // ED25519 / ED448 — modern, reasonable
    if (name.includes('ED25519') || name.includes('ED448')) return 65
    return 20
  })

  return scores.reduce((a, b) => a + b, 0) / scores.length
}

// Partial credit for running a post-quantum hybrid key exchange while the
// certificate is still classical. It mitigates harvest-now-decrypt-later on
// the session — roughly half the quantum threat surface — but leaves
// authentication (signatures) classical, so it is not full readiness.
const HYBRID_KEX_CREDIT = 50

function scorePqcReadiness(scan: ScanResult): number {
  const { algorithms, keyExchange } = scan
  // Full marks once a PQC certificate is actually present (no CA issues one
  // yet, but the scoring is ready for it).
  if (algorithms.length > 0) {
    const pqcCount = algorithms.filter((a) => a.grade === 'PQC_READY').length
    if (pqcCount > 0) return (pqcCount / algorithms.length) * 100
  }
  // Otherwise credit a confirmed PQC hybrid key exchange. `null`
  // (undetermined) earns nothing but is not penalised beyond the baseline.
  if (keyExchange?.hybridPqcSupported === true) return HYBRID_KEX_CREDIT
  return 0
}

function scoreTlsCompliance(tlsVersion: string): number {
  const v = tlsVersion.toLowerCase()
  if (v.includes('1.3') || v === 'tlsv1.3') return 100
  if (v.includes('1.2') || v === 'tlsv1.2') return 60
  return 20
}

function riskLevel(score: number): QrsScore['riskLevel'] {
  if (score >= 76) return 'low'
  if (score >= 51) return 'moderate'
  if (score >= 26) return 'high'
  return 'critical'
}

function migrationPriority(score: number): QrsScore['migrationPriority'] {
  if (score >= 76) return 'low'
  if (score >= 51) return 'medium'
  if (score >= 26) return 'high'
  return 'immediate'
}

export function calculateQrsScore(scan: ScanResult): QrsScore {
  // If no algorithms were detected (scan error or empty), return zero score
  if (scan.algorithms.length === 0) {
    return {
      overall: 0,
      categories: { algorithms: 0, keySize: 0, pqcReadiness: 0, compliance: 0 },
      riskLevel: 'critical',
      vulnerableAlgorithms: [],
      migrationPriority: 'immediate',
    }
  }

  const categories = {
    algorithms: scoreAlgorithms(scan.algorithms),
    keySize: scoreKeySize(scan.algorithms),
    pqcReadiness: scorePqcReadiness(scan),
    compliance: scoreTlsCompliance(scan.tlsVersion),
  }

  const overall = Math.round(
    categories.algorithms * WEIGHTS.algorithms +
      categories.keySize * WEIGHTS.keySize +
      categories.pqcReadiness * WEIGHTS.pqcReadiness +
      categories.compliance * WEIGHTS.compliance,
  )

  const vulnerableAlgorithms = scan.algorithms.filter((a) => a.vulnerable)

  return {
    overall,
    categories: {
      algorithms: Math.round(categories.algorithms),
      keySize: Math.round(categories.keySize),
      pqcReadiness: Math.round(categories.pqcReadiness),
      compliance: Math.round(categories.compliance),
    },
    riskLevel: riskLevel(overall),
    vulnerableAlgorithms,
    migrationPriority: migrationPriority(overall),
  }
}
