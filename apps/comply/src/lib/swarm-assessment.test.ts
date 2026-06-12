/**
 * swarm-assessment integration tests.
 * @taurus-ai/swarm-spawner is mocked so tests run without Hedera / model calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock @taurus-ai/swarm-spawner ───────────────────────────────────────────
vi.mock('@taurus-ai/swarm-spawner', () => ({
  SwarmSpawner: class {
    constructor() {}
    async spawn(req: { tasks: Array<{ id: string; description: string }> }) {
      // Simulate one completed result per task
      return {
        totalAgents: req.tasks.length,
        successCount: req.tasks.length,
        failureCount: 0,
        successRate: 1,
        totalDuration: 10,
        results: req.tasks.map((_, i) => ({
          agentId: `mock-agent-${i}`,
          status: 'completed',
          output: { result: 'ok' },
          duration: 5,
        })),
        errors: [],
      }
    }
    destroy() {}
    getTier() {
      return 'free'
    }
    getActiveAgents() {
      return []
    }
  },
  defaultExecutor: async (_agent: unknown) => ({ result: 'ok' }),
}))

// ─── Import SUT after mock registration ──────────────────────────────────────
import { runSwarmAssessment } from './swarm-assessment'

// ─── Shared test input ────────────────────────────────────────────────────────
const VALID_RESPONSES = {
  intended_use: 'Automated document classification for legal review',
  deployment_scope: 'Enterprise clients across the EU, ~500 users',
  autonomous_decisions: false,
  fundamental_rights: false,
  safety_risks: 'Misclassification risk mitigated via human review layer',
  bias_assessment: 'Regular fairness audits using Fairlearn library',
  training_data: 'Licensed legal corpus, 1M+ labelled documents',
  data_quality: 'Schema validation, deduplication, outlier removal',
  gdpr_compliant: true,
  user_notification: 'Banner shown on each interaction: "AI-assisted review"',
  explainability: 'SHAP values exposed via API for each classification',
  documentation: true,
  oversight_measures: 'Legal experts validate 10% random sample weekly',
  override_capability: true,
  monitoring: 'Datadog dashboards, weekly accuracy reports to CTO',
  accuracy_metrics: 'F1=0.94, AUC=0.97, benchmarked monthly',
  security_measures: 'SOC 2 Type II, data encrypted at rest and in transit',
  adversarial_testing: true,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('runSwarmAssessment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('spawns exactly one agent per EU AI Act section (6 agents, 100% success)', async () => {
    const result = await runSwarmAssessment({
      assessmentId: 'test-001',
      responses: VALID_RESPONSES,
      jurisdiction: 'EU',
    })

    expect(result.assessmentId).toBe('test-001')
    expect(result.totalAgents).toBe(6)
    expect(result.successRate).toBe(1)
  })

  it('sectionResults contain correct fields (agentId, sectionId, score)', async () => {
    const result = await runSwarmAssessment({
      assessmentId: 'test-002',
      responses: VALID_RESPONSES,
      jurisdiction: 'EU',
    })

    expect(result.sectionResults).toHaveLength(6)

    for (const sr of result.sectionResults) {
      // Required fields are present
      expect(typeof sr.agentId).toBe('string')
      expect(sr.agentId.length).toBeGreaterThan(0)

      expect(typeof sr.sectionId).toBe('string')
      expect(sr.sectionId.length).toBeGreaterThan(0)

      expect(typeof sr.sectionTitle).toBe('string')
      expect(sr.sectionTitle.length).toBeGreaterThan(0)

      expect(typeof sr.score).toBe('number')
      expect(sr.score).toBeGreaterThanOrEqual(0)
      expect(sr.score).toBeLessThanOrEqual(100)

      expect(['completed', 'failed']).toContain(sr.status)
    }
  })

  it('overallScore is between 0-100 and riskLevel matches expected pattern', async () => {
    const result = await runSwarmAssessment({
      assessmentId: 'test-003',
      responses: VALID_RESPONSES,
      jurisdiction: 'EU',
    })

    // Score sanity
    expect(result.overallScore).toBeGreaterThanOrEqual(0)
    expect(result.overallScore).toBeLessThanOrEqual(100)

    // riskLevel must be one of the four defined bands
    expect(['unacceptable', 'high', 'limited', 'minimal']).toContain(result.riskLevel)

    // scoringResult is included and consistent
    expect(result.scoringResult).toBeDefined()
    expect(result.scoringResult.score).toBe(result.overallScore)
    expect(result.scoringResult.riskLevel).toBe(result.riskLevel)

    // With all positive responses, expect limited or minimal risk
    expect(['limited', 'minimal']).toContain(result.riskLevel)
  })
})
