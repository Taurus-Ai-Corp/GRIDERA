import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { assessments as assessmentsTable } from '@taurus/db'
import { getDb } from '@/lib/db'
import { assessmentsStore } from '@/lib/assessment-store'
import { scoreAssessment } from '@/lib/assessment-scorer'
import { createStamp } from '@taurus/pqc-crypto'
import { logAuditEvent } from '@/lib/audit-logger'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
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
      const idx = assessments.findIndex((a) => a.id === id)
      if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      const current = assessments[idx]!
      if (current.status === 'completed') {
        return NextResponse.json({ error: 'Assessment already completed' }, { status: 400 })
      }

      const result = scoreAssessment(current.responses)

      let pqcHash: string | undefined
      let pqcSignature: string | undefined
      let pqcPublicKey: string | undefined
      const platformPkHex = process.env['PLATFORM_PQC_PUBLIC_KEY']
      const platformSkHex = process.env['PLATFORM_PQC_SECRET_KEY']
      if (platformPkHex && platformSkHex) {
        try {
          const pk = Uint8Array.from(Buffer.from(platformPkHex, 'hex'))
          const sk = Uint8Array.from(Buffer.from(platformSkHex, 'hex'))
          const stamp = createStamp(
            {
              type: 'assessment',
              id,
              payload: { score: result.score, riskLevel: result.riskLevel, categoryScores: result.categoryScores },
              jurisdiction: (process.env['JURISDICTION'] ?? 'eu') as 'eu' | 'na' | 'in' | 'ae',
            },
            sk,
            pk,
          )
          pqcHash = stamp.hash
          pqcSignature = stamp.signature
          pqcPublicKey = stamp.publicKey
        } catch (err) {
          console.error('[assessments/submit] PQC signing failed (dev mode):', err)
        }
      }

      const completed = {
        ...current,
        status: 'completed' as const,
        score: result.score,
        riskLevel: result.riskLevel,
        categoryScores: result.categoryScores,
        recommendations: result.recommendations,
        keyFindings: result.keyFindings,
        pqcHash,
        pqcSignature,
        pqcPublicKey,
        completedAt: new Date().toISOString(),
      }
      assessments[idx] = completed
      assessmentsStore.set(orgId, assessments)

      void logAuditEvent({
        userId: authUser.id,
        entityType: 'assessment',
        entityId: id,
        action: 'completed',
        details: `Assessment completed with score ${result.score}/100 (${result.riskLevel} risk)`,
      })

      return NextResponse.json(completed)
    }

    // Neon DB path
    const [existing] = await db
      .select()
      .from(assessmentsTable)
      .where(and(eq(assessmentsTable.id, id), eq(assessmentsTable.organizationId, orgId)))

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.status === 'completed') {
      return NextResponse.json({ error: 'Assessment already completed' }, { status: 400 })
    }

    const storedBlob = (existing.responses ?? {}) as Record<string, unknown>
    const answers = (storedBlob['answers'] ?? {}) as Record<string, string | boolean>

    const result = scoreAssessment(answers)

    let pqcHash: string | undefined
    let pqcSignature: string | undefined
    let pqcPublicKey: string | undefined
    const platformPkHex = process.env['PLATFORM_PQC_PUBLIC_KEY']
    const platformSkHex = process.env['PLATFORM_PQC_SECRET_KEY']
    if (platformPkHex && platformSkHex) {
      try {
        const pk = Uint8Array.from(Buffer.from(platformPkHex, 'hex'))
        const sk = Uint8Array.from(Buffer.from(platformSkHex, 'hex'))
        const stamp = createStamp(
          {
            type: 'assessment',
            id,
            payload: { score: result.score, riskLevel: result.riskLevel, categoryScores: result.categoryScores },
            jurisdiction: (process.env['JURISDICTION'] ?? 'eu') as 'eu' | 'na' | 'in' | 'ae',
          },
          sk,
          pk,
        )
        pqcHash = stamp.hash
        pqcSignature = stamp.signature
        pqcPublicKey = stamp.publicKey
      } catch (err) {
        console.error('[assessments/submit] PQC signing failed:', err)
      }
    }

    const updatedBlob = {
      ...storedBlob,
      _meta: {
        ...((storedBlob['_meta'] ?? {}) as Record<string, unknown>),
        score: result.score,
        riskLevel: result.riskLevel,
        categoryScores: result.categoryScores,
        recommendations: result.recommendations,
        keyFindings: result.keyFindings,
      },
    }

    const [updated] = await db
      .update(assessmentsTable)
      .set({
        status: 'completed',
        qrsScore: result.score,
        completedAt: new Date(),
        responses: updatedBlob,
        pqcHash,
        pqcSignature,
      })
      .where(and(eq(assessmentsTable.id, id), eq(assessmentsTable.organizationId, orgId)))
      .returning()

    if (!updated) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

    const completedRecord = {
      id: updated.id,
      systemId: updated.systemId,
      userId: updated.organizationId,
      status: 'completed' as const,
      responses: answers,
      currentSection: 0,
      score: result.score,
      riskLevel: result.riskLevel,
      categoryScores: result.categoryScores,
      recommendations: result.recommendations,
      keyFindings: result.keyFindings,
      pqcHash,
      pqcSignature,
      pqcPublicKey,
      completedAt: updated.completedAt?.toISOString() ?? new Date().toISOString(),
      createdAt: updated.createdAt.toISOString(),
    }

    void logAuditEvent({
      userId: authUser.id,
      entityType: 'assessment',
      entityId: id,
      action: 'completed',
      details: `Assessment completed with score ${result.score}/100 (${result.riskLevel} risk)`,
    })

    return NextResponse.json(completedRecord)
  } catch (error) {
    console.error('[assessments/[id]/submit/POST] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}