/**
 * GRIDERA|Guard — Input/Output Guard Rules Engine
 *
 * Validates LLM inputs (prompts) and outputs (responses) against
 * configurable security, privacy, and quality rules.
 */

import type { GuardRule, GuardVerdict, GuardContext } from './types'

// ---------------------------------------------------------------------------
// PII Patterns
// ---------------------------------------------------------------------------

const PII_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ },
  { label: 'phone', pattern: /\+\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/ },
  { label: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/ },
  { label: 'Aadhaar', pattern: /\b\d{4}\s\d{4}\s\d{4}\b/ },
]

// ---------------------------------------------------------------------------
// Injection Patterns
// ---------------------------------------------------------------------------

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /system\s+prompt/i,
  /pretend\s+you\s+are/i,
  /you\s+are\s+now/i,
  /disregard\s+(all\s+)?(prior|previous|above)/i,
  /reveal\s+(your|the)\s+(system|initial)\s+(prompt|instructions)/i,
  /override\s+(your|all)\s+(rules|instructions|safeguards)/i,
  /act\s+as\s+if\s+you\s+have\s+no\s+restrictions/i,
  /jailbreak/i,
  /do\s+anything\s+now/i,
]

// ---------------------------------------------------------------------------
// Input Rules
// ---------------------------------------------------------------------------

export const INPUT_RULES: GuardRule[] = [
  {
    name: 'no-pii',
    severity: 'block',
    check(prompt: string) {
      for (const { label, pattern } of PII_PATTERNS) {
        if (pattern.test(prompt)) {
          return { pass: false, reason: `PII detected: ${label}` }
        }
      }
      return { pass: true }
    },
  },
  {
    name: 'no-injection',
    severity: 'block',
    check(prompt: string) {
      for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(prompt)) {
          return { pass: false, reason: 'Prompt injection pattern detected' }
        }
      }
      return { pass: true }
    },
  },
  {
    name: 'token-limit',
    severity: 'block',
    check(prompt: string, context: GuardContext) {
      const maxTokens = context.maxTokens ?? 8192
      const estimatedTokens = Math.ceil(prompt.length / 4)
      if (estimatedTokens > maxTokens) {
        return {
          pass: false,
          reason: `Estimated ${estimatedTokens} tokens exceeds limit of ${maxTokens}`,
        }
      }
      return { pass: true }
    },
  },
]

// ---------------------------------------------------------------------------
// Output Rules
// ---------------------------------------------------------------------------

export const OUTPUT_RULES: GuardRule[] = [
  {
    name: 'non-empty',
    severity: 'block',
    check(response: string) {
      if (!response || response.trim().length === 0) {
        return { pass: false, reason: 'Response is empty' }
      }
      return { pass: true }
    },
  },
  {
    name: 'valid-json',
    severity: 'warn',
    check(response: string) {
      try {
        JSON.parse(response)
        return { pass: true }
      } catch {
        return { pass: false, reason: 'Response is not valid JSON' }
      }
    },
  },
  {
    name: 'response-length',
    severity: 'warn',
    check(response: string) {
      const MAX_RESPONSE_LENGTH = 100_000
      if (response.length > MAX_RESPONSE_LENGTH) {
        return {
          pass: false,
          reason: `Response length ${response.length} exceeds ${MAX_RESPONSE_LENGTH} chars`,
        }
      }
      return { pass: true }
    },
  },
]

// ---------------------------------------------------------------------------
// Rule Runner
// ---------------------------------------------------------------------------

function runRules(
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

export function checkInputRules(
  prompt: string,
  context: GuardContext,
): GuardVerdict[] {
  return runRules(INPUT_RULES, prompt, context)
}

export function checkOutputRules(
  response: string,
  context: GuardContext,
): GuardVerdict[] {
  return runRules(OUTPUT_RULES, response, context)
}