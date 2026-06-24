import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { assessments as assessmentsTable, systems as systemsTable } from '@taurus/db'
import { getDb } from '@/lib/db'
import { assessmentsStore, type AssessmentRecord } from '@/lib/assessment-store'
import { systemsStore } from '@/lib/systems-store'
import { updateAssessmentSchema } from '@/lib/validation'
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const orgId = authUser.organizationId ?? authUser.id

    const db = getDb()
    if (!db) {
      const assessments = assessmentsStore.get(orgId) ?? []
      const assessment = assessments.find((a) => a.id === id)
      if (!assessment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      const systems = systemsStore.get(orgId) ?? []
      const system = systems.find((s) => s.id === assessment.systemId)
      return NextResponse.json({ ...assessment, systemName: system?.name ?? 'Unknown System' })
    }

    const [row] = await db
      .select()
      .from(assessmentsTable)
      .where(and(eq(assessmentsTable.id, id), eq(assessmentsTable.organizationId, orgId)))

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [system] = await db
      .select()
      .from(systemsTable)
      .where(eq(systemsTable.id, row.systemId))

    return NextResponse.json({
      ...rowToAssessment(row),
      systemName: system?.name ?? 'Unknown System',
    })
  } catch (error) {
    console.error('[assessments/[id]/GET] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const orgId = authUser.organizationId ?? authUser.id

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const parsed = updateAssessmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const db = getDb()
    if (!db) {
      const assessments = assessmentsStore.get(orgId) ?? []
      const idx = assessments.findIndex((a) => a.id === id)
      if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      const current = assessments[idx]!
      const updated = {
        ...current,
        responses: parsed.data.responses !== undefined ? parsed.data.responses : current.responses,
        currentSection:
          parsed.data.currentSection !== undefined
            ? parsed.data.currentSection
            : current.currentSection,
        status: parsed.data.status !== undefined ? parsed.data.status : current.status,
      }

      assessments[idx] = updated
      assessmentsStore.set(orgId, assessments)
      return NextResponse.json(updated)
    }

    const [existing] = await db
      .select()
      .from(assessmentsTable)
      .where(and(eq(assessmentsTable.id, id), eq(assessmentsTable.organizationId, orgId)))

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const storedBlob = (existing.responses ?? {}) as Record<string, unknown>
    const existingMeta = (storedBlob['_meta'] ?? {}) as Record<string, unknown>

    const newAnswers =
      parsed.data.responses !== undefined
        ? parsed.data.responses
        : ((storedBlob['answers'] ?? {}) as Record<string, string | boolean>)

    const newMeta = {
      ...existingMeta,
      ...(parsed.data.currentSection !== undefined
        ? { currentSection: parsed.data.currentSection }
        : {}),
    }

    const newBlob = { answers: newAnswers, _meta: newMeta }
    const newStatus = parsed.data.status ?? existing.status

    const [updated] = await db
      .update(assessmentsTable)
      .set({ responses: newBlob, status: newStatus })
      .where(and(eq(assessmentsTable.id, id), eq(assessmentsTable.organizationId, orgId)))
      .returning()

    if (!updated) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

    return NextResponse.json(rowToAssessment(updated))
  } catch (error) {
    console.error('[assessments/[id]/PUT] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}