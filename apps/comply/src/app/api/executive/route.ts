/**
 * GET /api/executive — Executive Operating View
 *
 * Jurisdiction-scoped aggregation for the deployment cell.
 * Data only from Comply stores/DB for this org; pack from @taurus/jurisdiction.
 */

import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import {
  systems as systemsTable,
  assessments as assessmentsTable,
  reports as reportsTable,
} from '@taurus/db'
import type { Jurisdiction } from '@taurus/jurisdiction'
import { getCurrentUser } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { getServerJurisdiction } from '@/lib/jurisdiction'
import { systemsStore } from '@/lib/systems-store'
import { assessmentsStore } from '@/lib/assessment-store'
import { reportsStore } from '@/lib/report-store'
import { buildExecutiveView } from '@/lib/executive-view'

export async function GET() {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = authUser.organizationId ?? authUser.id
    const { jurisdiction } = await getServerJurisdiction()
    const j = jurisdiction as Jurisdiction

    const db = getDb()
    if (!db) {
      const systems = (systemsStore.get(orgId) ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        jurisdiction: s.jurisdiction ?? j,
      }))
      const assessments = (assessmentsStore.get(orgId) ?? []).map((a) => ({
        id: a.id,
        systemId: a.systemId,
        status: a.status ?? 'draft',
        score: a.score ?? null,
        jurisdiction: j,
      }))
      const reports = (reportsStore.get(orgId) ?? []).map((r) => ({
        id: r.id,
        assessmentId: r.assessmentId,
        documentType: r.documentType,
        pqcHash: r.pqcHash,
        hederaTxId: r.hederaTxId,
      }))
      const view = buildExecutiveView({ jurisdiction: j, systems, assessments, reports })
      return NextResponse.json(view)
    }

    const systems = await db
      .select()
      .from(systemsTable)
      .where(eq(systemsTable.organizationId, orgId))

    const assessments = await db
      .select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.organizationId, orgId))

    const reports = await db
      .select()
      .from(reportsTable)
      .where(eq(reportsTable.organizationId, orgId))

    const view = buildExecutiveView({
      jurisdiction: j,
      systems: systems.map((s) => ({
        id: s.id,
        name: s.name,
        jurisdiction: s.jurisdiction ?? j,
      })),
      assessments: assessments.map((a) => {
        const blob = (a.responses ?? {}) as Record<string, unknown>
        const meta = (blob['_meta'] ?? {}) as Record<string, unknown>
        return {
          id: a.id,
          systemId: a.systemId,
          status: a.status ?? 'draft',
          score: (typeof a.qrsScore === 'number' ? a.qrsScore : null) ??
            (typeof meta['score'] === 'number' ? meta['score'] : null),
          jurisdiction: a.jurisdiction ?? j,
        }
      }),
      reports: reports.map((r) => ({
        id: r.id,
        assessmentId: r.assessmentId,
        documentType: null,
        pqcHash: r.pqcHash,
        hederaTxId: r.hederaTxId,
      })),
    })

    return NextResponse.json(view)
  } catch (error) {
    console.error('[executive/GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
