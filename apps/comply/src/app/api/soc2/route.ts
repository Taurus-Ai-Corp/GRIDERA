import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import {
  mapPlatformToSoc2,
  getSoc2ReadinessScore,
  getSoc2Gaps,
} from '@/lib/soc2-mapper'

/**
 * GET /api/soc2
 *
 * Query params:
 *   ?view=full|score|gaps  (default: full)
 */
export async function GET(req: Request) {
  const authUser = await getCurrentUser()
if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view') ?? 'full'

  switch (view) {
    case 'score': {
      const score = getSoc2ReadinessScore()
      return NextResponse.json(score)
    }

    case 'gaps': {
      const gaps = getSoc2Gaps()
      return NextResponse.json({ gaps, total: gaps.length })
    }

    case 'full':
    default: {
      const mappings = mapPlatformToSoc2()
      const score = getSoc2ReadinessScore()
      return NextResponse.json({
        mappings,
        total: mappings.length,
        score,
      })
    }
  }
}
