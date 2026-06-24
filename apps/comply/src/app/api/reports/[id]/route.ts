import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { reports as reportsTable } from '@taurus/db'
import { getDb } from '@/lib/db'
import { reportsStore } from '@/lib/report-store'

// GET /api/reports/[id] — get a single report with full content
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = authUser.organizationId ?? authUser.id

    const { id } = await params

    const db = getDb()
    if (!db) {
      // Fallback: in-memory store
      const reports = reportsStore.get(orgId) ?? []
      const report = reports.find((r) => r.id === id)
      if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(report)
    }

    const [row] = await db
      .select()
      .from(reportsTable)
      .where(and(eq(reportsTable.id, id), eq(reportsTable.organizationId, orgId)))

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      id: row.id,
      assessmentId: row.assessmentId,
      userId: row.organizationId,
      content: row.contentMarkdown ?? '',
      mode: 'template', // not stored in schema; default
      model: row.aiModel ?? undefined,
      pqcHash: row.pqcHash ?? undefined,
      pqcSignature: row.pqcSignature ?? undefined,
      hederaTxId: row.hederaTxId ?? undefined,
      createdAt: row.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('[reports/[id]/GET] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}