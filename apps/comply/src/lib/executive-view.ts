/**
 * Executive Operating View — Comply-only, jurisdiction-scoped.
 * For CA cell: regulation pack + document types come from caConfig only.
 */

import type { Jurisdiction, Regulation } from '@taurus/jurisdiction'
import {
  getJurisdictionConfig,
  getJurisdictionDocumentTypes,
  A1_REQUIRED_DOCUMENT_TYPES,
} from '@taurus/jurisdiction'

export type ExecutiveSystem = {
  id: string
  name: string
  jurisdiction: string
}

export type ExecutiveAssessment = {
  id: string
  systemId: string
  status: string
  score?: number | null
  jurisdiction: string
}

export type ExecutiveReport = {
  id: string
  assessmentId: string
  documentType?: string | null
  pqcHash?: string | null
  hederaTxId?: string | null
}

export type ExecutiveViewInput = {
  jurisdiction: Jurisdiction
  systems: ExecutiveSystem[]
  assessments: ExecutiveAssessment[]
  reports: ExecutiveReport[]
}

export type ExecutiveView = {
  jurisdiction: Jurisdiction
  cellDomain: string
  dataResidencyRegion: string
  regulationPack: Regulation[]
  documentTypes: string[]
  a1RequiredDocumentTypes: readonly string[]
  dataSource: 'comply_api_jurisdiction_scoped'
  stats: {
    systems: number
    assessments: number
    reports: number
    signedReports: number
    hcsAnchored: number
    avgScore: number | null
  }
  systems: ExecutiveSystem[]
  recentAssessments: ExecutiveAssessment[]
  recentReports: ExecutiveReport[]
}

function scopeToJurisdiction<T extends { jurisdiction?: string | null }>(
  rows: T[],
  jurisdiction: string,
): T[] {
  return rows.filter((r) => {
    const j = (r.jurisdiction ?? jurisdiction).toLowerCase()
    return j === jurisdiction.toLowerCase()
  })
}

export function buildExecutiveView(input: ExecutiveViewInput): ExecutiveView {
  const { jurisdiction } = input
  const config = getJurisdictionConfig(jurisdiction)
  const systems = scopeToJurisdiction(input.systems, jurisdiction)
  const assessments = scopeToJurisdiction(input.assessments, jurisdiction)
  // Reports inherit cell via deployment; keep all org reports but prefer scoped assessments
  const assessmentIds = new Set(assessments.map((a) => a.id))
  const reports =
    assessmentIds.size > 0
      ? input.reports.filter((r) => assessmentIds.has(r.assessmentId) || !r.assessmentId)
      : input.reports

  const scores = assessments
    .map((a) => a.score)
    .filter((s): s is number => typeof s === 'number')
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null

  return {
    jurisdiction,
    cellDomain: config.domain,
    dataResidencyRegion: config.dataResidencyRegion,
    regulationPack: config.regulations,
    documentTypes: getJurisdictionDocumentTypes(jurisdiction),
    a1RequiredDocumentTypes: A1_REQUIRED_DOCUMENT_TYPES,
    dataSource: 'comply_api_jurisdiction_scoped',
    stats: {
      systems: systems.length,
      assessments: assessments.length,
      reports: reports.length,
      signedReports: reports.filter((r) => !!r.pqcHash).length,
      hcsAnchored: reports.filter((r) => !!r.hederaTxId).length,
      avgScore,
    },
    systems,
    recentAssessments: assessments.slice(0, 10),
    recentReports: reports.slice(0, 10),
  }
}
