/**
 * GRIDERA|Guard — Core Guard Module
 *
 * Wraps any LLM call with input/output guard rules and produces
 * an ML-DSA-65 signed attestation for every invocation.
 */

import {
  checkInputRules,
  checkOutputRules,
} from './rules.js'
import { estimateTokens, estimateCost } from './pricing.js'
import { signAttestation } from './attestation.js'
import { anchorAttestation } from './hedera.js'
import type { HederaConfig } from './hedera.js'
import { noopAdapter } from './audit.js'
import { PRESETS } from './presets/index.js'
import type {
  GuardInput,
  GuardResult,
  GuardAttestation,
  GuardVerdict,
  GuardContext,
  GuardVerdictStatus,
  GuardConfig,
  GuardInstance,
  GuardRule,
  JurisdictionPreset,
  AuditAdapter,
} from './types.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasBlockingFailure(verdicts: GuardVerdict[]): GuardVerdict | undefined {
  return verdicts.find((v) => !v.pass && v.severity === 'block')
}

function deriveOverallVerdict(verdicts: GuardVerdict[]): GuardVerdictStatus {
  if (verdicts.some((v) => !v.pass && v.severity === 'block')) return 'block'
  if (verdicts.some((v) => !v.pass && v.severity === 'warn')) return 'warn'
  return 'pass'
}

// ---------------------------------------------------------------------------
// createGuard — Factory Function
// ---------------------------------------------------------------------------

export function createGuard(config: GuardConfig = {}): GuardInstance {
  const auditAdapter: AuditAdapter = config.auditAdapter ?? noopAdapter
  const defaultJurisdiction = config.defaultJurisdiction ?? 'eu'
  const defaultPreset = config.defaultPreset ?? 'default'
  const defaultMaxTokens = config.defaultMaxTokens ?? 8192
  const defaultModel = 'default'

  // -------------------------------------------------------------------------
  // execute — Main guard pipeline
  // -------------------------------------------------------------------------

  async function execute(input: GuardInput): Promise<GuardResult> {
    const model = input.model ?? defaultModel
    const jurisdiction = input.jurisdiction ?? defaultJurisdiction
    const maxTokens = input.maxTokens ?? defaultMaxTokens
    const preset = input.preset ?? defaultPreset

    const context: GuardContext = {
      jurisdiction,
      maxTokens,
      preset,
    }

    // 1. Collect all input rules (default + preset + custom)
    const presetRules = PRESETS[preset]?.rules ?? []
    const allInputRules = [...INPUT_RULES_INTERNAL, ...presetRules, ...(input.customRules ?? [])]

    // 2. Run input rules
    const inputVerdicts = runCustomRules(allInputRules, input.prompt, context)
    const tokensIn = estimateTokens(input.prompt)

    // 3. If any input verdict blocks, return early
    const inputBlock = inputVerdicts.find((v) => !v.pass && v.severity === 'block')
    if (inputBlock) {
      const attestation: GuardAttestation = {
        input_verdicts: inputVerdicts,
        output_verdicts: [],
        model,
        tokens_in: tokensIn,
        tokens_out: 0,
        cost_usd: 0,
        latency_ms: 0,
        jurisdiction,
        guard_verdict: 'block',
        signature: '',
        algorithm: 'ML-DSA-65',
        timestamp: new Date().toISOString(),
      }

      const signed = await signAttestation(attestation, config.pqc)
      void auditAdapter.write(signed).catch(() => {})

      return {
        blocked: true,
        blockReason: `Input blocked by rule '${inputBlock.rule}': ${inputBlock.reason}`,
        attestation: signed,
      }
    }

    // 4. Call the LLM with timing
    const startTime = Date.now()
    const response = await input.llmCall()
    const latencyMs = Date.now() - startTime

    // 5. Run output rules
    const outputVerdicts = runCustomRules(OUTPUT_RULES_INTERNAL, response, context)
    const tokensOut = estimateTokens(response)

    // 6. If any output verdict blocks, return blocked
    const outputBlock = outputVerdicts.find((v) => !v.pass && v.severity === 'block')
    if (outputBlock) {
      const allVerdicts = [...inputVerdicts, ...outputVerdicts]
      const attestation: GuardAttestation = {
        input_verdicts: inputVerdicts,
        output_verdicts: outputVerdicts,
        model,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_usd: estimateCost(model, tokensIn, tokensOut, config.pricing),
        latency_ms: latencyMs,
        jurisdiction,
        guard_verdict: deriveOverallVerdict(allVerdicts),
        signature: '',
        algorithm: 'ML-DSA-65',
        timestamp: new Date().toISOString(),
      }

      const signed = await signAttestation(attestation, config.pqc)
      void auditAdapter.write(signed).catch(() => {})

      return {
        blocked: true,
        blockReason: `Output blocked by rule '${outputBlock.rule}': ${outputBlock.reason}`,
        attestation: signed,
      }
    }

    // 7. Build passing attestation
    const allVerdicts = [...inputVerdicts, ...outputVerdicts]
    let attestation: GuardAttestation = {
      input_verdicts: inputVerdicts,
      output_verdicts: outputVerdicts,
      model,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_usd: estimateCost(model, tokensIn, tokensOut, config.pricing),
      latency_ms: latencyMs,
      jurisdiction,
      guard_verdict: deriveOverallVerdict(allVerdicts),
      signature: '',
      algorithm: 'ML-DSA-65',
      timestamp: new Date().toISOString(),
    }

    // 8. Sign attestation
    attestation = await signAttestation(attestation, config.pqc)

    // 9. Anchor to Hedera (optional)
    if (config.hedera) {
      attestation = await anchorAttestation(attestation, config.hedera)
    }

    // 10. Write to audit trail (non-blocking)
    void auditAdapter.write(attestation).catch(() => {})

    // 11. Return success
    return {
      response,
      blocked: false,
      attestation,
    }
  }

  // -------------------------------------------------------------------------
  // checkInput / checkOutput — Standalone checks (no LLM call)
  // -------------------------------------------------------------------------

  function checkInput(
    prompt: string,
    context?: Partial<GuardContext>,
  ): GuardVerdict[] {
    const fullContext: GuardContext = {
      jurisdiction: context?.jurisdiction ?? defaultJurisdiction,
      maxTokens: context?.maxTokens ?? defaultMaxTokens,
      preset: context?.preset ?? defaultPreset,
    }

    // Default rules only for standalone checks
    const verdicts = checkInputRules(prompt, fullContext)

    // Add preset rules
    const presetName = fullContext.preset ?? defaultPreset
    const presetRules = PRESETS[presetName as JurisdictionPreset]?.rules ?? []
    const presetVerdicts = runCustomRules(presetRules, prompt, fullContext)

    return [...verdicts, ...presetVerdicts]
  }

  function checkOutput(
    response: string,
    context?: Partial<GuardContext>,
  ): GuardVerdict[] {
    const fullContext: GuardContext = {
      jurisdiction: context?.jurisdiction ?? defaultJurisdiction,
      maxTokens: context?.maxTokens ?? defaultMaxTokens,
      preset: context?.preset ?? defaultPreset,
    }

    return checkOutputRules(response, fullContext)
  }

  // -------------------------------------------------------------------------
  // getAttestation / anchorAttestation — Audit trail queries
  // -------------------------------------------------------------------------

  async function getAttestation(id: string): Promise<GuardAttestation | null> {
    return auditAdapter.read(id)
  }

  async function anchorAttestationById(attestation: GuardAttestation): Promise<{ txId: string }> {
    if (!config.hedera) {
      throw new Error('Hedera configuration required for anchoring')
    }
    const anchored = await anchorAttestation(attestation, config.hedera)
    return { txId: anchored.hedera_tx_id ?? 'unknown' }
  }

  return {
    execute,
    checkInput,
    checkOutput,
    getAttestation,
    anchorAttestation: anchorAttestationById,
  }
}

// ---------------------------------------------------------------------------
// Internal rule references (for createGuard to use)
// ---------------------------------------------------------------------------

import { INPUT_RULES, OUTPUT_RULES } from './rules.js'

const INPUT_RULES_INTERNAL = INPUT_RULES
const OUTPUT_RULES_INTERNAL = OUTPUT_RULES

function runCustomRules(
  rules: GuardRule[],
  input: string,
  context: GuardContext,
): GuardVerdict[] {
  return rules.map((rule) => {
    const result = rule.check(input, context)
    return {
      pass: result.pass,
      rule: rule.name,
      reason: result.reason,
      severity: rule.severity,
      timestamp: new Date().toISOString(),
    }
  })
}

// ---------------------------------------------------------------------------
// Re-export checkInputRules / checkOutputRules for standalone use
// ---------------------------------------------------------------------------

export { checkInputRules, checkOutputRules, INPUT_RULES, OUTPUT_RULES } from './rules.js'
export { estimateTokens, estimateCost } from './pricing.js'
export { signAttestation } from './attestation.js'
export { EU_AI_ACT_PRESET } from './presets/eu-ai-act.js'
export { NIST_AI_RMF_PRESET } from './presets/nist-ai-rmf.js'
export { SOC2_PRESET } from './presets/soc2.js'
export { InMemoryAuditAdapter } from './audit.js'