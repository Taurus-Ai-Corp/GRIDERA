import { NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit-logger'

const createOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(200),
  industry: z.string().max(100).optional().default('other'),
  size: z.string().max(20).optional().default('1-10'),
})

// POST /api/organizations — create organization + link user to it
export async function POST(req: Request) {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const parsed = createOrgSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { name, industry } = parsed.data
    const jurisdiction = (process.env['JURISDICTION'] ?? 'eu') as 'eu' | 'na' | 'in' | 'ae'
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const db = getDb()
    if (!db) {
      // In-memory fallback: just return success
      return NextResponse.json({ id: crypto.randomUUID(), name, slug, jurisdiction })
    }

    const { organizations, users } = await import('@taurus/db')

    // Create organization
    const [org] = await db.insert(organizations).values({
      name,
      slug,
      jurisdiction,
    }).returning({ id: organizations.id })

    if (!org) {
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Link user to organization
    await db.update(users)
      .set({ organizationId: org.id, jurisdiction })
      .where(eq(users.id, authUser.id))

    // Audit
    void logAuditEvent({
      userId: authUser.id,
      entityType: 'organization',
      entityId: org.id,
      action: 'created',
      details: `Organization created: ${name} (${industry}, ${jurisdiction})`,
    })

    return NextResponse.json({ id: org.id, name, slug, jurisdiction })
  } catch (error) {
    console.error('[api/organizations] Error:', error)
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}

// GET /api/organizations — get current user's organization
export async function GET() {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = getDb()
    if (!db) {
      return NextResponse.json({ organization: null })
    }

    const { users, organizations } = await import('@taurus/db')

    // Get user's org ID
    const user = await db.query.users.findFirst({
      where: eq(users.id, authUser.id),
      columns: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ organization: null })
    }

    // Get org details
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, user.organizationId),
    })

    return NextResponse.json({ organization: org ?? null })
  } catch (error) {
    console.error('[api/organizations] Error:', error)
    return NextResponse.json({ organization: null })
  }
}