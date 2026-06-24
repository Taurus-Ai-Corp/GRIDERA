import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { auditTrail as auditTrailTable } from '@taurus/db'
import { getDb } from '@/lib/db'
import { getAuditEvents } from '@/lib/audit-store'

export async function GET(req: Request) {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = authUser.organizationId ?? authUser.id

    const url = new URL(req.url)
    const entityType = url.searchParams.get('entityType') ?? undefined

    const db = getDb()
    if (!db) {
      // Fallback: in-memory store
      let events = getAuditEvents(orgId)
      if (entityType) events = events.filter((e) => e.entityType === entityType)
      return NextResponse.json({ events: events.slice(0, 50) })
    }

    // Note: auditTrail table has no userId column — return the 50 most recent events.
    // For a multi-tenant production system, add a userId/organizationId column to this table.
    const rows = await db
      .select()
      .from(auditTrailTable)
      .orderBy(desc(auditTrailTable.createdAt))
      .limit(50)

    const events = rows
      .filter((r) => !entityType || r.entityType === entityType)
      .map((r) => ({
        id: r.id,
        userId: authUser.id,
        entityType: r.entityType,
        entityId: r.entityId,
        action: r.action,
        details: '',
        pqcHash: r.hash ?? undefined,
        pqcSignature: r.pqcSignature ?? undefined,
        hederaTopicId: r.hederaTopicId ?? undefined,
        hederaTxId: r.hederaTxId ?? undefined,
        hederaStatus: r.hederaTxId ? 'anchored' : 'skipped',
        createdAt: r.createdAt.toISOString(),
      }))

    return NextResponse.json({ events })
  } catch (error) {
    console.error('[audit/GET] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}