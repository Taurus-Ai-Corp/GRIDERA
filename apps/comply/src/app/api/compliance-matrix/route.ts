import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import {
  getComplianceMatrix,
  getComplianceCoverage,
  getComplianceGaps,
} from '@/lib/compliance-matrix'

/**
 * GET /api/compliance-matrix
 *
 * Query params:
 *   ?view=full|coverage|gaps  (default: full)
 *   ?framework=GDPR|EU AI Act|DORA|NIS2|SOC 2|ENISA PQC  (filter by framework)
 */
export async function GET(req: Request) {
  const authUser = await getCurrentUser()
if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view') ?? 'full'
  const framework = searchParams.get('framework') || undefined

  switch (view) {
    case 'coverage': {
      const coverage = getComplianceCoverage()
      return NextResponse.json(coverage)
    }

    case 'gaps': {
      const gaps = getComplianceGaps()
      // Optionally filter gaps by framework too
      const filtered = framework
        ? gaps.filter((g) =>
            g.regulations.some((r) =>
              r.framework.toLowerCase().includes(framework.toLowerCase()),
            ),
          )
        : gaps
      return NextResponse.json({ gaps: filtered, total: filtered.length })
    }

    case 'full':
    default: {
      const matrix = getComplianceMatrix(framework)
      const coverage = getComplianceCoverage()
      return NextResponse.json({
        matrix,
        total: matrix.length,
        coverage: {
          covered: coverage.covered,
          partial: coverage.partial,
          gap: coverage.gap,
          coveragePercent: coverage.coveragePercent,
        },
      })
    }
  }
}
