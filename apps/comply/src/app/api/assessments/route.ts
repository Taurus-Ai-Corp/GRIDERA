import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { assessments as assessmentsTable, systems as systemsTable } from '@taurus/db'
import { getDb } from '@/lib/db'
import { assessmentsStore, type AssessmentRecord } from '@/lib/assessment-store'
import { systemsStore } from '@/lib/systems-store'
import { createAssessmentSchema } from '@/lib/validation'
import { getCurrentUser } from '@/lib/auth'

function rowToAssessment(row: typeof assessmentsTable.$inferSelect): AssessmentRecord {
  const stored = (row.responses ?? {}) as Record<string, unknown>
  const meta = (stored['_meta'] ?? {}) as Record<string, unknown>

  return {
    id: row.id,
    systemId: row.systemId,
    userId: row.organizationId,
    status: (row.status as AssessmentRecord['status']) ?? 'draft',
    responses: (stored['answers'] as Record<string, string | boolean>) ?? {},
    currentSection: typeof meta['currentSection'] === 'number' ? meta['currentSection'] : 0,
    score: typeof meta['score'] === 'number' ? meta['score'] : undefined,
    riskLevel: typeof meta['riskLevel'] === 'string' ? meta['riskLevel'] : undefined,
    recommendations: Array.isArray(meta['recommendations'])
      ? (meta['recommendations'] as AssessmentRecord['recommendations'])
      : undefined,
    keyFindings: Array.isArray(meta['keyFindings'])
      ? (meta['keyFindings'] as string[])
      : undefined,
    categoryScores:
      meta['categoryScores'] !== null && typeof meta['categoryScores'] === 'object'
        ? (meta['categoryScores'] as Record<string, number>)
        : undefined,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : undefined,
  }
}

export async function GET() {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = getDb()
    const orgId = authUser.organizationId ?? authUser.id

    if (!db) {
      const assessments = assessmentsStore.get(orgId) ?? []
      const systems = systemsStore.get(orgId) ?? []
      const enriched = assessments.map((a) => {
        const system = systems.find((s) => s.id === a.systemId)
        return { ...a, systemName: system?.name ?? 'Unknown System' }
      })
      return NextResponse.json({ assessments: enriched })
    }

    const rows = await db
      .select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.organizationId, orgId))

    const systemIds = [...new Set(rows.map((r) => r.systemId))]
    const systemRows =
      systemIds.length > 0
        ? await db
            .select()
            .from(systemsTable)
            .where(eq(systemsTable.organizationId, orgId))
        : []

    const systemMap = new Map(systemRows.map((s) => [s.id, s.name]))

    const enriched = rows.map((row) => ({
      ...rowToAssessment(row),
      systemName: systemMap.get(row.systemId) ?? 'Unknown System',
    }))

    return NextResponse.json({ assessments: enriched })
  } catch (error) {
    console.error('[assessments/GET] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const parsed = createAssessmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { systemId } = parsed.data
    const jurisdiction = (process.env['JURISDICTION'] ?? 'eu') as 'eu' | 'na' | 'in' | 'ae'
    const orgId = authUser.organizationId ?? authUser.id

    const db = getDb()
    if (!db) {
      const systems = systemsStore.get(orgId) ?? []
      const system = systems.find((s) => s.id === systemId)
      if (!system) {
        return NextResponse.json({ error: 'System not found' }, { status: 404 })
      }

      const assessment: AssessmentRecord = {
        id: crypto.randomUUID(),
        systemId,
        userId: orgId,
        status: 'draft',
        responses: {},
        currentSection: 0,
        createdAt: new Date().toISOString(),
      }

      const existing = assessmentsStore.get(orgId) ?? []
      existing.push(assessment)
      assessmentsStore.set(orgId, existing)

      return NextResponse.json(assessment, { status: 201 })
    }

    const [system] = await db
      .select()
      .from(systemsTable)
      .where(eq(systemsTable.id, systemId))

    if (!system || system.organizationId !== orgId) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 })
    }

    const initialResponses = {
      answers: {},
      _meta: { currentSection: 0 },
    }

    const [row] = await db
      .insert(assessmentsTable)
      .values({
        systemId,
        organizationId: orgId,
        jurisdiction,
        framework: 'eu-ai-act',
        status: 'draft',
        responses: initialResponses,
      })
      .returning()

    if (!row) {
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
    }

    return NextResponse.json(rowToAssessment(row), { status: 201 })
  } catch (error) {
    console.error('[assessments/POST] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}