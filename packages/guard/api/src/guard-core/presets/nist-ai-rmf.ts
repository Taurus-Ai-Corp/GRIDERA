/**
 * GRIDERA|Guard — NIST AI Risk Management Framework Preset
 *
 * Maps guard rules to NIST AI RMF functions:
 * Govern, Map, Measure, Manage.
 */

import type { GuardRule } from '../types.js'

export const NIST_AI_RMF_PRESET = {
  name: 'nist-ai-rmf',
  description: 'NIST AI Risk Management Framework (AI RMF 1.0)',
  functions: [
    { function: 'Govern', description: 'Establish policies and accountability' },
    { function: 'Map', description: 'Understand context and risks' },
    { function: 'Measure', description: 'Assess and quantify risks' },
    { function: 'Manage', description: 'Act on risks and document decisions' },
  ],
  rules: [
    {
      name: 'govern-function',
      severity: 'warn' as const,
      check(prompt: string) {
        // Govern: detect policy-adjacent content that needs governance review
        const policyKeywords = /\b(policy|governance|compliance|regulation|mandate|directive)\b/i
        if (policyKeywords.test(prompt)) {
          return { pass: true, reason: 'Policy content detected — governance review recommended per NIST Govern function' }
        }
        return { pass: true }
      },
    },
    {
      name: 'map-function',
      severity: 'warn' as const,
      check(prompt: string) {
        // Map: detect risk context keywords
        const riskKeywords = /\b(risk|threat|vulnerability|impact|likelihood|severity)\b/i
        if (riskKeywords.test(prompt)) {
          return { pass: true, reason: 'Risk context detected — map to AI RMF categories' }
        }
        return { pass: true }
      },
    },
    {
      name: 'measure-function',
      severity: 'warn' as const,
      check(prompt: string) {
        // Measure: detect quantitative/statistical content
        const measureKeywords = /\b(accuracy|precision|recall|f1|metric|benchmark|score|rating)\b/i
        if (measureKeywords.test(prompt)) {
          return { pass: true, reason: 'Quantitative content detected — validate measurement methodology per NIST Measure function' }
        }
        return { pass: true }
      },
    },
    {
      name: 'manage-function',
      severity: 'block' as const,
      check(prompt: string) {
        // Manage: block prompts requesting to bypass risk management
        const bypassKeywords = /\b(bypass\s+risk|ignore\s+risk|skip\s+risk|override\s+safety|disable\s+safeguard)\b/i
        if (bypassKeywords.test(prompt)) {
          return { pass: false, reason: 'Risk management bypass detected per NIST Manage function' }
        }
        return { pass: true }
      },
    },
  ] as GuardRule[],
}