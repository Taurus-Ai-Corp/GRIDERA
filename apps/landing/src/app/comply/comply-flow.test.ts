/**
 * Integration test for the scan → QREP → dashboard flow (fix-plan Task 3).
 *
 * Exercises the exact seam the /comply?scan=<id> dashboard depends on:
 * a scan result persisted by POST /api/scan (simulated via storeScanResult)
 * must be retrievable through GET /api/qrep/[id] as a QrepCompact payload —
 * the shape ComplyInner renders (id, generatedAt, overallScore,
 * quantumRiskGrade, criticalAssets, highAssets, headlineFinding,
 * recommendedAction, topRemediation).
 *
 * The live-site smoke check formerly in this file moved to
 * scripts/smoke-comply-flow.ts.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { GET } from '@/app/api/qrep/[id]/route'
import { scanStore, storeScanResult, type StoredScanResult } from '@/lib/scan-store'

const GRADES = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'QUANTUM_SAFE']

function storedScan(overrides: Partial<StoredScanResult> = {}): StoredScanResult {
  return {
    scanId: 'abc123def456ab78',
    domain: 'example.com',
    qrsScore: {
      overall: 34,
      categories: { algorithms: 20, keySize: 40, pqcReadiness: 30, compliance: 45 },
      riskLevel: 'critical',
      vulnerableAlgorithms: [
        { name: 'RSA', keySize: 2048, grade: 'CRITICAL', vulnerable: true, severity: 'critical' },
      ],
      migrationPriority: 'immediate',
    },
    algorithms: [
      { name: 'RSA', keySize: 2048, grade: 'CRITICAL', vulnerable: true, severity: 'critical' },
      { name: 'ECDSA', keySize: 256, grade: 'WEAK', vulnerable: true, severity: 'high' },
      { name: 'AES', keySize: 256, grade: 'STRONG', vulnerable: false, severity: 'none' },
    ],
    certificates: [],
    recommendations: [
      {
        id: 'rec-1',
        title: 'Migrate RSA-2048 signatures to ML-DSA-65',
        description: 'Replace RSA signing with NIST FIPS 204 ML-DSA-65.',
        priority: 'critical',
      },
    ],
    tlsVersion: 'TLSv1.3',
    scannedAt: '2026-07-14T00:00:00.000Z',
    pqcStamp: { hash: 'abc123def456ab7890', algorithm: 'ML-DSA-65' },
    createdAt: Date.now(),
    ...overrides,
  }
}

async function fetchQrep(id: string): Promise<Response> {
  return GET(new Request(`http://localhost/api/qrep/${id}`), {
    params: Promise.resolve({ id }),
  })
}

describe('scan → QREP retrieval → dashboard contract', () => {
  beforeEach(() => {
    scanStore.clear()
  })

  it('returns the full QrepCompact contract for a stored scan', async () => {
    const scan = storedScan()
    storeScanResult(scan)

    const res = await fetchQrep(scan.scanId)
    expect(res.status).toBe(200)

    const qrep = await res.json()
    expect(qrep.id).toBe(scan.scanId)
    expect(typeof qrep.generatedAt).toBe('string')
    expect(Number.isNaN(Date.parse(qrep.generatedAt))).toBe(false)
    expect(qrep.overallScore).toBe(34)
    expect(GRADES).toContain(qrep.quantumRiskGrade)
    expect(qrep.quantumRiskGrade).toBe('CRITICAL')
    expect(qrep.criticalAssets).toBe(1)
    expect(qrep.highAssets).toBe(1)
    expect(typeof qrep.headlineFinding).toBe('string')
    expect(qrep.headlineFinding.length).toBeGreaterThan(0)
    expect(typeof qrep.recommendedAction).toBe('string')
    expect(qrep.recommendedAction.length).toBeGreaterThan(0)
    expect(qrep.topRemediation).toBe('Migrate RSA-2048 signatures to ML-DSA-65')
  })

  it('grades a clean scan QUANTUM_SAFE', async () => {
    const scan = storedScan({
      scanId: 'cafe0000cafe0000',
      qrsScore: {
        overall: 96,
        categories: { algorithms: 95, keySize: 95, pqcReadiness: 98, compliance: 96 },
        riskLevel: 'low',
        vulnerableAlgorithms: [],
        migrationPriority: 'low',
      },
      algorithms: [
        { name: 'ML-KEM', keySize: 768, grade: 'PQC_READY', vulnerable: false, severity: 'none' },
      ],
      recommendations: [],
    })
    storeScanResult(scan)

    const res = await fetchQrep(scan.scanId)
    expect(res.status).toBe(200)
    const qrep = await res.json()
    expect(qrep.quantumRiskGrade).toBe('QUANTUM_SAFE')
    expect(qrep.criticalAssets).toBe(0)
    expect(qrep.highAssets).toBe(0)
  })

  it('404s for an unknown scan id', async () => {
    const res = await fetchQrep('does-not-exist-00')
    expect(res.status).toBe(404)
  })

  it('404s for an expired scan (store TTL is 60 minutes)', async () => {
    const scan = storedScan({
      scanId: 'dead0000dead0000',
      createdAt: Date.now() - 61 * 60 * 1000,
    })
    storeScanResult(scan)

    const res = await fetchQrep(scan.scanId)
    expect(res.status).toBe(404)
  })
})
