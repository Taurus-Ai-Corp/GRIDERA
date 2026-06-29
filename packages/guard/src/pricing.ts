/**
 * GRIDERA|Guard — Pricing Calculator
 *
 * Model pricing table (USD per 1K tokens) and estimation functions.
 */

import type { ModelPricing, ModelPricingTable } from './types'

// ---------------------------------------------------------------------------
// Default pricing table (USD per 1K tokens)
// ---------------------------------------------------------------------------

export const DEFAULT_PRICING: ModelPricingTable = {
  'ollama/qwen3-coder': { inputPer1K: 0, outputPer1K: 0 },
  'ollama/deepseek-v3.1': { inputPer1K: 0, outputPer1K: 0 },
  'gemini-1.5-flash': { inputPer1K: 0.000075, outputPer1K: 0.0003 },
  'gemini-1.5-pro': { inputPer1K: 0.00125, outputPer1K: 0.005 },
  'claude-sonnet-4-6': { inputPer1K: 0.003, outputPer1K: 0.015 },
  'gpt-4o': { inputPer1K: 0.0025, outputPer1K: 0.01 },
  'gpt-4o-mini': { inputPer1K: 0.00015, outputPer1K: 0.0006 },
  'default': { inputPer1K: 0, outputPer1K: 0 },
}

// ---------------------------------------------------------------------------
// Token estimation (heuristic: ~4 chars per token)
// ---------------------------------------------------------------------------

export function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

// ---------------------------------------------------------------------------
// Cost estimation
// ---------------------------------------------------------------------------

export function estimateCost(
  model: string,
  tokensIn: number,
  tokensOut: number,
  pricingTable?: ModelPricingTable,
): number {
  const table = pricingTable ?? DEFAULT_PRICING
  const rates = table[model] ?? table['default'] ?? { inputPer1K: 0, outputPer1K: 0 }
  return (tokensIn / 1000) * rates.inputPer1K + (tokensOut / 1000) * rates.outputPer1K
}