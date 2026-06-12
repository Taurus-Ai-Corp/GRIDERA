/**
 * SOC 2 Type II mapper — unit tests
 *
 * 7 tests verifying TSC category coverage, control presence,
 * mapping integrity, PQC/audit mappings, scoring, and gap detection.
 */

import { describe, it, expect } from 'vitest'
import {
  SOC2_CONTROLS,
  getSoc2ReadinessScore,
  getSoc2Gaps,
} from './soc2-mapper'

describe('SOC 2 Controls — data integrity', () => {
  it('defines all 5 Trust Services Criteria categories', () => {
    const categories = [...new Set(SOC2_CONTROLS.map((c) => c.category))]
    expect(categories).toContain('Security')
    expect(categories).toContain('Availability')
    expect(categories).toContain('Processing Integrity')
    expect(categories).toContain('Confidentiality')
    expect(categories).toContain('Privacy')
    expect(categories).toHaveLength(5)
  })

  it('includes CC1 through CC9 security controls', () => {
    const securityIds = SOC2_CONTROLS.filter((c) => c.category === 'Security').map((c) => c.id)
    // At least one control from each CC group
    for (let i = 1; i <= 9; i++) {
      const prefix = `CC${i}.`
      const hasGroup = securityIds.some((id) => id.startsWith(prefix))
      expect(hasGroup, `Expected at least one control starting with ${prefix}`).toBe(true)
    }
  })
})

describe('SOC 2 Mapper — platform mapping', () => {
  it('returns non-empty mapping with valid status values', () => {
    const mappings = mapPlatformToSoc2()
    expect(mappings.length).toBe(SOC2_CONTROLS.length)
    expect(mappings.length).toBeGreaterThanOrEqual(33)

    for (const m of mappings) {
      expect(m.controlId).toBeTruthy()
      expect(m.controlTitle).toBeTruthy()
      expect(m.category).toBeTruthy()
      expect(['met', 'partial', 'not-met']).toContain(m.status)
    }
  })

  it('maps PQC signing to CC6.6 Encryption as met', () => {
    const mappings = mapPlatformToSoc2()
    const cc66 = mappings.find((m) => m.controlId === 'CC6.6')
    expect(cc66).toBeDefined()
    expect(cc66!.status).toBe('met')
    expect(cc66!.platformFeature).toBeDefined()
    expect(cc66!.platformFeature!.toLowerCase()).toContain('ml-dsa-65')
  })

  it('maps audit trail / monitoring features to CC7 controls', () => {
    const mappings = mapPlatformToSoc2()
    const cc7Controls = mappings.filter((m) => m.controlId.startsWith('CC7.'))
    expect(cc7Controls.length).toBeGreaterThanOrEqual(2)

    // At least CC7.1 and CC7.2 should reference platform features
    const cc71 = cc7Controls.find((m) => m.controlId === 'CC7.1')
    const cc72 = cc7Controls.find((m) => m.controlId === 'CC7.2')
    expect(cc71).toBeDefined()
    expect(cc72).toBeDefined()
    expect(cc71!.platformFeature).toBeTruthy()
    expect(cc72!.platformFeature).toBeTruthy()
  })
})

describe('SOC 2 Mapper — readiness score', () => {
  it('calculates overall score 0-100 with per-category breakdown for all 5 categories', () => {
    const score = getSoc2ReadinessScore()

    // 14 met (×100) + 15 partial (×50) + 4 not-met (×0) = 2150 / 33 = 65.15 → 65
    expect(score.overall).toBe(65)
    expect(score.metControls).toBe(14)
    expect(score.partialControls).toBe(15)
    expect(score.gapControls).toBe(4)
    expect(score.totalControls).toBeGreaterThanOrEqual(33)
    expect(score.metControls + score.partialControls + score.gapControls).toBe(score.totalControls)

    // All 5 categories in breakdown
    const categories = Object.keys(score.byCategory)
    expect(categories).toContain('Security')
    expect(categories).toContain('Availability')
    expect(categories).toContain('Processing Integrity')
    expect(categories).toContain('Confidentiality')
    expect(categories).toContain('Privacy')

    // Each category score is 0-100
    for (const [, catScore] of Object.entries(score.byCategory)) {
      expect(catScore).toBeGreaterThanOrEqual(0)
      expect(catScore).toBeLessThanOrEqual(100)
    }
  })
})

describe('SOC 2 Mapper — gap detection', () => {
  it('identifies controls with not-met status as gaps', () => {
    const gaps = getSoc2Gaps()
    expect(gaps.length).toBeGreaterThan(0)

    for (const gap of gaps) {
      expect(gap.status).toBe('not-met')
      expect(gap.gap).toBeTruthy()
    }

    // Known gaps: CC1.2, CC3.2, P2.1, P5.1
    const gapIds = gaps.map((g) => g.controlId)
    expect(gapIds).toContain('CC1.2')
    expect(gapIds).toContain('CC3.2')
    expect(gapIds).toContain('P2.1')
    expect(gapIds).toContain('P5.1')
  })
})
