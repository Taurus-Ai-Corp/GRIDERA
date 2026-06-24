import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { systems as systemsTable } from '@taurus/db'
import { getDb } from '@/lib/db'
import { systemsStore } from '@/lib/systems-store'

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
      const systems = systemsStore.get(orgId) ?? []
      const system = systems.find((s) => s.id === id)
      if (!system) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(system)
    }

    const [row] = await db
      .select()
      .from(systemsTable)
      .where(and(eq(systemsTable.id, id), eq(systemsTable.organizationId, orgId)))

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      deploymentScope: '',
      useCase: '',
      industry: '',
      autonomyLevel: '',
      riskLevel: row.riskLevel ?? 'unknown',
      status: row.status,
      jurisdiction: row.jurisdiction,
      createdAt: row.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('[systems/[id]/GET] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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
      const systems = systemsStore.get(orgId) ?? []
      const filtered = systems.filter((s) => s.id !== id)
      if (filtered.length === systems.length) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      systemsStore.set(orgId, filtered)
      return NextResponse.json({ success: true })
    }

    const deleted = await db
      .delete(systemsTable)
      .where(and(eq(systemsTable.id, id), eq(systemsTable.organizationId, orgId)))
      .returning()

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[systems/[id]/DELETE] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}