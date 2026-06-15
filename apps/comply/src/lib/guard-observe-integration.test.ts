import { describe, it, expect } from 'vitest'
import { aiGuard } from './ai-guard'
import { checkInputRules, checkOutputRules } from './ai-guard-rules'
import { calculateCost, MODEL_RATES } from './observe-queries'

describe('guard → observe integration', () => {
  // Full guard flow: clean input → LLM → clean output → attestation
  it('complete guard pass flow produces valid attestation', async () => {
    const result = await aiGuard.execute({
      prompt: 'Analyze EU AI Act compliance for deployment scenario',
      llmCall: async () => JSON.stringify({
        score: 82,
        riskLevel: 'minimal',
        recommendations: [{ id: 'r1', title: 'Maintain documentation' }],
      }),
      jurisdiction: 'eu',
      model: 'gemini-1.5-flash',
    })

    // Guard should pass
    expect(result.blocked).toBe(false)
    expect(result.response).toBeDefined()

    // Attestation should have all fields OBSERVE needs
    const a = result.attestation
    expect(a.model).toBe('gemini-1.5-flash')
    expect(a.tokens_in).toBeGreaterThan(0)
    expect(a.tokens_out).toBeGreaterThan(0)
    expect(a.cost_usd).toBeGreaterThan(0) // cloud model = non-zero cost
    expect(a.latency_ms).toBeGreaterThanOrEqual(0)
    expect(a.guard_verdict).toBe('pass')
    expect(a.jurisdiction).toBe('eu')
    expect(a.signature).toBeDefined()
    expect(a.algorithm).toBe('ML-DSA-65')
    expect(a.timestamp).toBeDefined()
  })

  // Guard block flow: PII in input → blocked before LLM call
  it('blocked input produces attestation with zero output tokens', async () => {
    let llmCalled = false
    const result = await aiGuard.execute({
      prompt: 'Send report to admin@company.com immediately',
      llmCall: async () => { llmCalled = true; return '{}' },
      jurisdiction: 'eu',
    })

    expect(result.blocked).toBe(true)
    expect(llmCalled).toBe(false) // LLM should NOT be called
    expect(result.attestation.tokens_out).toBe(0)
    expect(result.attestation.guard_verdict).toBe('block')
    expect(result.attestation.latency_ms).toBe(0)
  })

  // Guard block flow: valid input, invalid output
  it('invalid LLM output blocks and still produces attestation', async () => {
    const result = await aiGuard.execute({
      prompt: 'Generate compliance report',
      llmCall: async () => '<html>This is not JSON</html>',
      jurisdiction: 'eu',
      model: 'ollama/qwen3-coder',
    })

    expect(result.blocked).toBe(true)
    expect(result.attestation.guard_verdict).toBe('block')
    expect(result.attestation.tokens_out).toBeGreaterThan(0) // LLM was called
    expect(result.attestation.cost_usd).toBe(0) // ollama = free
  })

  // Cost consistency: guard attestation cost matches observe calculation
  it('attestation cost matches observe calculateCost', async () => {
    const result = await aiGuard.execute({
      prompt: 'Analyze system risk',
      llmCall: async () => JSON.stringify({ score: 50 }),
      jurisdiction: 'eu',
      model: 'gemini-1.5-flash',
    })

    const expectedCost = calculateCost(
      'gemini-1.5-flash',
      result.attestation.tokens_in,
      result.attestation.tokens_out,
    )
    expect(result.attestation.cost_usd).toBeCloseTo(expectedCost, 8)
  })

  // Self-hosted detection: ollama models should be identifiable for selfHostedRatio
  it('self-hosted model attestation identifiable by model prefix', async () => {
    const result = await aiGuard.execute({
      prompt: 'Analyze risk',
      llmCall: async () => JSON.stringify({ score: 75 }),
      jurisdiction: 'eu',
      model: 'ollama/qwen3-coder',
    })

    expect(result.attestation.model.startsWith('ollama/')).toBe(true)
    expect(result.attestation.cost_usd).toBe(0)
  })

  // Jurisdiction propagation: jurisdiction flows from input to attestation
  it('jurisdiction propagates through guard to attestation', async () => {
    for (const j of ['eu', 'na', 'in']) {
      const result = await aiGuard.execute({
        prompt: 'Analyze compliance',
        llmCall: async () => JSON.stringify({ ok: true }),
        jurisdiction: j,
      })
      expect(result.attestation.jurisdiction).toBe(j)
    }
  })

  // Multiple sequential calls produce independent attestations
  it('sequential guard calls produce independent attestations', async () => {
    const r1 = await aiGuard.execute({
      prompt: 'First analysis',
      llmCall: async () => JSON.stringify({ id: 1 }),
      jurisdiction: 'eu',
    })
    const r2 = await aiGuard.execute({
      prompt: 'Second analysis',
      llmCall: async () => JSON.stringify({ id: 2 }),
      jurisdiction: 'na',
    })

    expect(r1.attestation.timestamp).not.toBe(r2.attestation.timestamp)
    expect(r1.attestation.jurisdiction).toBe('eu')
    expect(r2.attestation.jurisdiction).toBe('na')
  })

  // Input rules and output rules are independent
  it('input rules do not affect output rule checks', () => {
    // Clean input should pass all input rules
    const inputVerdicts = checkInputRules('Clean prompt about compliance', { jurisdiction: 'eu' })
    expect(inputVerdicts.every(v => v.pass)).toBe(true)

    // Invalid output should fail regardless of clean input
    const outputVerdicts = checkOutputRules('not json', { jurisdiction: 'eu' })
    expect(outputVerdicts.some(v => !v.pass)).toBe(true)
  })

  // All model rates are non-negative
  it('all MODEL_RATES have non-negative values', () => {
    for (const rates of Object.values(MODEL_RATES)) {
      expect(rates.input).toBeGreaterThanOrEqual(0)
      expect(rates.output).toBeGreaterThanOrEqual(0)
    }
  })
})
