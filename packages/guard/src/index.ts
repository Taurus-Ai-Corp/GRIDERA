/**
 * @taurus/guard — GRIDERA Guard
 *
 * PQC-attested AI guardrails with EU AI Act compliance.
 *
 * @example
 * ```typescript
 * import { createGuard } from '@taurus/guard'
 *
 * const guard = createGuard({ defaultJurisdiction: 'eu' })
 * const result = await guard.execute({
 *   prompt: 'What is the capital of France?',
 *   llmCall: () => model.generate('What is the capital of France?'),
 *   jurisdiction: 'eu',
 * })
 *
 * console.log(result.blocked)        // false
 * console.log(result.response)        // "Paris"
 * console.log(result.attestation.signature) // ML-DSA-65 signed
 * ```
 */

// Types (public API surface)
export type {
  GuardInput,
  GuardResult,
  GuardAttestation,
  GuardVerdict,
  GuardContext,
  GuardRule,
  GuardVerdictStatus,
  JurisdictionCode,
  JurisdictionPreset,
  GuardConfig,
  GuardInstance,
  AuditAdapter,
  AuditFilter,
  ModelPricing,
  ModelPricingTable,
} from './types'

// Factory function
export { createGuard } from './guard'

// Re-exports for standalone use
export { checkInputRules, checkOutputRules, INPUT_RULES, OUTPUT_RULES } from './rules'
export { estimateTokens, estimateCost, DEFAULT_PRICING } from './pricing'
export { signAttestation } from './attestation'
export { EU_AI_ACT_PRESET } from './presets/eu-ai-act'
export { NIST_AI_RMF_PRESET } from './presets/nist-ai-rmf'
export { SOC2_PRESET } from './presets/soc2'
export { InMemoryAuditAdapter } from './audit'