import { describe, it, expect } from 'vitest'
import { buildExecutiveView } from './executive-view'

describe('buildExecutiveView', () => {
  it('tags view with deployment jurisdiction and ca regulation pack when ca', () => {
    const view = buildExecutiveView({
      jurisdiction: 'ca',
      systems: [{ id: 's1', name: 'Core Banking API', jurisdiction: 'ca' }],
      assessments: [
        { id: 'a1', systemId: 's1', status: 'completed', score: 72, jurisdiction: 'ca' },
      ],
      reports: [
        {
          id: 'r1',
          assessmentId: 'a1',
          documentType: 'pqc_readiness_report',
          pqcHash: 'abc',
          hederaTxId: '0.0.1@1',
        },
      ],
    })

    expect(view.jurisdiction).toBe('ca')
    expect(view.regulationPack.length).toBeGreaterThan(0)
    expect(view.regulationPack.some((r) => r.id === 'osfi-b13' || r.id === 'pipeda')).toBe(
      true,
    )
    expect(view.documentTypes).toContain('pqc_readiness_report')
    expect(view.documentTypes).toContain('data_residency_certificate')
    expect(view.stats.systems).toBe(1)
    expect(view.stats.assessments).toBe(1)
    expect(view.stats.reports).toBe(1)
    expect(view.stats.signedReports).toBe(1)
    expect(view.stats.hcsAnchored).toBe(1)
    expect(view.dataSource).toBe('comply_api_jurisdiction_scoped')
  })

  it('only counts rows matching deployment jurisdiction', () => {
    const view = buildExecutiveView({
      jurisdiction: 'ca',
      systems: [
        { id: 's1', name: 'CA', jurisdiction: 'ca' },
        { id: 's2', name: 'EU leak', jurisdiction: 'eu' },
      ],
      assessments: [],
      reports: [],
    })
    expect(view.stats.systems).toBe(1)
    expect(view.systems.every((s) => s.jurisdiction === 'ca')).toBe(true)
  })
})
