import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import {
  generatePolicy,
  POLICY_TYPES,
  type PolicyType,
  type OrgContext,
} from '@/lib/policy-generator'
import { logAuditEvent } from '@/lib/audit-logger'

// ---------------------------------------------------------------------------
// GET /api/policies — return available policy types
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    return NextResponse.json({ types: POLICY_TYPES })
  } catch (error) {
    console.error('[policies/GET] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/policies — generate a policy
// ---------------------------------------------------------------------------

const VALID_TYPES = new Set<string>(POLICY_TYPES.map((t) => t.id))

export async function POST(req: Request) {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // Use authUser.id as fallback if no organization
    const userId = authUser.id

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const { type, org } = body as { type?: string; org?: Partial<OrgContext> }

    // Validate type
    if (!type || !VALID_TYPES.has(type)) {
      return NextResponse.json(
        { error: 'Invalid policy type', validTypes: Array.from(VALID_TYPES) },
        { status: 400 },
      )
    }

    // Validate org context
    if (
      !org ||
      !org.orgName ||
      !org.industry ||
      !org.dpoName ||
      !org.dpoEmail ||
      !org.jurisdiction ||
      !org.dataResidency ||
      !org.lastReviewDate
    ) {
      return NextResponse.json(
        {
          error: 'Missing org context fields',
          required: [
            'orgName',
            'industry',
            'dpoName',
            'dpoEmail',
            'jurisdiction',
            'dataResidency',
            'lastReviewDate',
          ],
        },
        { status: 400 },
      )
    }

    const policy = generatePolicy(type as PolicyType, org as OrgContext)

    void logAuditEvent({
      userId: authUser.id,
      entityType: 'report',
      entityId: `policy-${type}-${Date.now()}`,
      action: 'created',
      details: `Generated ${policy.title} for ${(org as OrgContext).orgName} (${(org as OrgContext).jurisdiction})`,
    })

    return NextResponse.json(policy, { status: 201 })
  } catch (error) {
    console.error('[policies/POST] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}