/**
 * GRIDERA Guard — EU AI Act Preset
 *
 * Maps guard rules to EU AI Act Articles 9, 11, 14, 15.
 * These are additional rules applied on top of the default input/output rules
 * when jurisdiction='eu' and preset='eu-ai-act'.
 */

import type { GuardRule } from '../types.js'

export const EU_AI_ACT_PRESET = {
  name: 'eu-ai-act',
  description: 'EU Artificial Intelligence Act compliance (Articles 9, 11, 14, 15)',
  articles: [
    { article: 9, title: 'Risk Management System', description: 'Input validation prevents unsafe prompts from reaching the LLM' },
    { article: 11, title: 'Technical Documentation', description: 'Every guard verdict is logged and signed for auditability' },
    { article: 14, title: 'Human Oversight', description: 'severity=block halts automation and requires human review' },
    { article: 15, title: 'Accuracy, Robustness, and Cybersecurity', description: 'Output validation checks regulation references and risk consistency' },
  ],
  rules: [
    {
      name: 'risk-management-art9',
      severity: 'block' as const,
      check(prompt: string) {
        // Risk management: detect risk-level escalation keywords
        const riskKeywords = /\b(critical\s+risk|high\s+risk|imminent\s+danger|severe\s+harm)\b/i
        if (riskKeywords.test(prompt)) {
          return { pass: false, reason: 'High-risk content detected per EU AI Act Art. 9 — requires human oversight' }
        }
        return { pass: true }
      },
    },
    {
      name: 'documentation-art11',
      severity: 'warn' as const,
      check(prompt: string) {
        // Documentation: flag prompts that reference regulations (for documentation requirements)
        const regulationRef = /\b(article\s+\d+|regulation\s+\d+|directive\s+\d+|GDPR|AI\s+Act)\b/i
        if (regulationRef.test(prompt)) {
          return { pass: true, reason: 'Regulatory reference detected — ensure documentation per Art. 11' }
        }
        return { pass: true }
      },
    },
    {
      name: 'human-oversight-art14',
      severity: 'block' as const,
      check(prompt: string) {
        // Human oversight: detect autonomous decision-making keywords
        const autonomousKeywords = /\b(autonomous\s+decision|auto\s+approve|automatic\s+approval|self\s+govern)\b/i
        if (autonomousKeywords.test(prompt)) {
          return { pass: false, reason: 'Autonomous decision-making detected per EU AI Act Art. 14 — requires human oversight' }
        }
        return { pass: true }
      },
    },
    {
      name: 'accuracy-art15',
      severity: 'warn' as const,
      check(_prompt: string) {
        // Accuracy: informational — actual accuracy checks happen in output rules
        return { pass: true, reason: 'Accuracy validation applied in output rules per Art. 15' }
      },
    },
  ] as GuardRule[],
}