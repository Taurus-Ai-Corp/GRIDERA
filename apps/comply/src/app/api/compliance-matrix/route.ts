import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import {
  getComplianceMatrix,
  getComplianceCoverage,
  getComplianceGaps,
} from '@/lib/compliance-matrix'
import { getServerJurisdiction } from '@/lib/jurisdiction'
import {
  getJurisdictionDocumentTypes,
  A1_REQUIRED_DOCUMENT_TYPES,
  type Jurisdiction,
} from '@taurus/jurisdiction'

/**
 * GET /api/compliance-matrix
 *
 * Query params:
 *   ?view=full|coverage|gaps|jurisdiction-pack  (default: full)
 *   ?framework=GDPR|EU AI Act|DORA|NIS2|SOC 2|ENISA PQC  (filter by framework)
 *
 * jurisdiction-pack: default CA/EU pack from @taurus/jurisdiction (source of truth for A1)
 */
export async function GET(req: Request) {
  const authUser = await getCurrentUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view') ?? 'full'
  const framework = searchParams.get('framework') || undefined
  const { jurisdiction, config } = await getServerJurisdiction()

  switch (view) {
    case 'jurisdiction-pack': {
      return NextResponse.json({
        jurisdiction,
        domain: config.domain,
        dataResidencyRegion: config.dataResidencyRegion,
        regulations: config.regulations,
        documentTypes: getJurisdictionDocumentTypes(jurisdiction as Jurisdiction),
        a1RequiredDocumentTypes: A1_REQUIRED_DOCUMENT_TYPES,
        source: 'packages/jurisdiction',
      })
    }

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
        jurisdiction,
        regulationPack: config.regulations,
        documentTypes: getJurisdictionDocumentTypes(jurisdiction as Jurisdiction),
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
