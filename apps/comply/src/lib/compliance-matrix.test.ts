/**
 * GRIDERA Compliance Matrix — unit tests
 *
 * 8 tests verifying matrix completeness, field integrity,
 * guard/GDPR mapping, coverage calculation, and gap detection.
 */

import { describe, it, expect } from 'vitest'
import {
  COMPLIANCE_MATRIX,
  getComplianceCoverage,
  getComplianceGaps,
} from './compliance-matrix'

describe('Compliance Matrix — data integrity', () => {
  it('contains at least 27 entries (18 covered/partial + 9 gaps)', () => {
    expect(COMPLIANCE_MATRIX).toBeInstanceOf(Array)
    expect(COMPLIANCE_MATRIX.length).toBeGreaterThanOrEqual(27)
  })

  it('every entry has required fields: featureId, featureName, category, description, status, implementationPath, regulations[]', () => {
    for (const entry of COMPLIANCE_MATRIX) {
      expect(entry.featureId).toBeTruthy()
      expect(typeof entry.featureId).toBe('string')
      expect(entry.featureName).toBeTruthy()
      expect(typeof entry.featureName).toBe('string')
      expect(entry.category).toBeTruthy()
      expect(entry.description).toBeTruthy()
      expect(['covered', 'partial', 'gap']).toContain(entry.status)
      expect(entry.implementationPath).toBeTruthy()
      expect(entry.regulations).toBeInstanceOf(Array)
      expect(entry.regulations.length).toBeGreaterThan(0)

      // Each regulation ref has required fields
      for (const reg of entry.regulations) {
        expect(reg.framework).toBeTruthy()
        expect(reg.article).toBeTruthy()
        expect(reg.description).toBeTruthy()
      }
    }
  })
})

describe('Compliance Matrix — guard rule mapping', () => {
  it('maps all 3 input guard rules to the matrix', () => {
    const guardFeatureIds = ['guard-pii-filter', 'guard-injection-filter', 'guard-token-limit']
    for (const id of guardFeatureIds) {
      const entry = COMPLIANCE_MATRIX.find((e) => e.featureId === id)
      expect(entry).toBeDefined()
      expect(entry!.status).toBe('covered')
    }
  })

  it('guard rules reference EU AI Act articles', () => {
    const guardEntries = COMPLIANCE_MATRIX.filter((e) => e.featureId.startsWith('guard-'))
    expect(guardEntries.length).toBeGreaterThanOrEqual(4) // 3 input + output validation + attestation

    for (const entry of guardEntries) {
      const euAiActRefs = entry.regulations.filter((r) => r.framework === 'EU AI Act')
      expect(euAiActRefs.length).toBeGreaterThan(0)
    }
  })

  it('PQC attestation signing maps to GDPR Article 32 (security of processing)', () => {
    const attestation = COMPLIANCE_MATRIX.find((e) => e.featureId === 'guard-pqc-attestation')
    expect(attestation).toBeDefined()
    expect(attestation!.status).toBe('covered')

    const gdpr32 = attestation!.regulations.find(
      (r) => r.framework === 'GDPR' && r.article === 'Article 32',
    )
    expect(gdpr32).toBeDefined()
    expect(gdpr32!.description).toContain('cryptographic')
  })
})

describe('Compliance Matrix — coverage calculation', () => {
  it('calculates correct coverage percentages and totals', () => {
    const coverage = getComplianceCoverage()

    expect(coverage.total).toBe(COMPLIANCE_MATRIX.length)
    expect(coverage.covered + coverage.partial + coverage.gap).toBe(coverage.total)
    expect(coverage.coveragePercent).toBeGreaterThan(0)
    expect(coverage.coveragePercent).toBeLessThanOrEqual(100)

    // Framework breakdowns exist
    expect(Object.keys(coverage.byFramework).length).toBeGreaterThanOrEqual(5)
    expect(coverage.byFramework['EU AI Act']).toBeDefined()
    expect(coverage.byFramework['GDPR']).toBeDefined()
    expect(coverage.byFramework['ENISA PQC']).toBeDefined()

    // Category breakdowns exist
    expect(Object.keys(coverage.byCategory).length).toBeGreaterThanOrEqual(5)
  })
})

describe('Compliance Matrix — gap detection', () => {
  it('identifies at least 9 compliance gaps', () => {
    const gaps = getComplianceGaps()
    expect(gaps.length).toBeGreaterThanOrEqual(9)

    // All gaps have status 'gap' and 'NOT IMPLEMENTED' path
    for (const gap of gaps) {
      expect(gap.status).toBe('gap')
      expect(gap.implementationPath).toBe('NOT IMPLEMENTED')
    }
  })

  it('filters matrix by framework name', () => {
    const full = getComplianceMatrix()
    expect(full.length).toBe(COMPLIANCE_MATRIX.length)

    const gdprOnly = getComplianceMatrix('GDPR')
    expect(gdprOnly.length).toBeGreaterThan(0)
    expect(gdprOnly.length).toBeLessThan(COMPLIANCE_MATRIX.length)

    // Every returned entry references GDPR
    for (const entry of gdprOnly) {
      const hasGdpr = entry.regulations.some((r) =>
        r.framework.toLowerCase().includes('gdpr'),
      )
      expect(hasGdpr).toBe(true)
    }

    // Case-insensitive filtering
    const gdprLower = getComplianceMatrix('gdpr')
    expect(gdprLower.length).toBe(gdprOnly.length)
  })
})
