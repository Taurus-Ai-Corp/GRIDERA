import { NextResponse } from 'next/server'
import { getScanResult } from '@/lib/scan-store'
import type { Algorithm, QrsScore, Recommendation } from '@taurus/pqc-engine'

export const dynamic = 'force-dynamic'

type QuantumRiskGrade = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'QUANTUM_SAFE'

const RISK_GRADE: Record<QrsScore['riskLevel'], QuantumRiskGrade> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  moderate: 'MODERATE',
  low: 'LOW',
}

const RECOMMENDED_ACTION: Record<QrsScore['migrationPriority'], string> = {
  immediate: 'Begin PQC migration immediately — quantum-vulnerable primitives are in active use.',
  high: 'Schedule PQC migration this quarter and inventory remaining exposure.',
  medium: 'Plan PQC migration into the next roadmap cycle and monitor exposure.',
  low: 'Maintain current posture and re-scan after infrastructure changes.',
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const scan = getScanResult(id)
  if (!scan) {
    return NextResponse.json(
      { error: 'QREP not found. It may have expired or the scan ID is incorrect.' },
      { status: 404 },
    )
  }

  const qrs = scan.qrsScore as QrsScore
  const algorithms = scan.algorithms as Algorithm[]
  const recommendations = scan.recommendations as Recommendation[]

  const vulnerableCount = qrs.vulnerableAlgorithms.length
  const quantumRiskGrade: QuantumRiskGrade =
    qrs.riskLevel === 'low' && vulnerableCount === 0 ? 'QUANTUM_SAFE' : RISK_GRADE[qrs.riskLevel]

  const headlineFinding =
    vulnerableCount > 0
      ? `${vulnerableCount} quantum-vulnerable algorithm${vulnerableCount === 1 ? '' : 's'} detected on ${scan.domain} — exposed to harvest-now-decrypt-later capture.`
      : `No quantum-vulnerable algorithms detected on ${scan.domain}.`

  return NextResponse.json({
    id: scan.scanId,
    generatedAt: scan.scannedAt,
    overallScore: qrs.overall,
    quantumRiskGrade,
    criticalAssets: algorithms.filter((a) => a.severity === 'critical').length,
    highAssets: algorithms.filter((a) => a.severity === 'high').length,
    headlineFinding,
    recommendedAction: RECOMMENDED_ACTION[qrs.migrationPriority],
    topRemediation: recommendations[0]?.title ?? 'Maintain current cryptographic posture.',
  })
}
