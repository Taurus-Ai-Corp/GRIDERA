/**
 * GRIDERA Guard — SOC 2 Type II Preset
 *
 * Maps guard rules to SOC 2 Trust Services Criteria:
 * CC6 (Security), CC7 (Availability), CC8 (Change Management).
 */

import type { GuardRule } from '../types.js'

export const SOC2_PRESET = {
  name: 'soc2',
  description: 'SOC 2 Type II Trust Services Criteria (CC6, CC7, CC8)',
  criteria: [
    { criterion: 'CC6.1', title: 'Logical and Physical Access Controls', description: 'PII detection prevents unauthorized data exposure' },
    { criterion: 'CC7.1', title: 'Monitoring and Detection', description: 'Guard verdict logging provides continuous monitoring evidence' },
    { criterion: 'CC8.1', title: 'Change Management', description: 'Signed attestations prove no unauthorized changes to AI outputs' },
  ],
  rules: [
    {
      name: 'cc6-1-logical-access',
      severity: 'block' as const,
      check(prompt: string) {
        // CC6.1: Detect attempts to extract or access protected information
        const accessKeywords = /\b(password|secret\s+key|api\s+key|private\s+key|access\s+token|credential)\b/i
        if (accessKeywords.test(prompt)) {
          return { pass: false, reason: 'Access control violation detected per SOC 2 CC6.1' }
        }
        return { pass: true }
      },
    },
    {
      name: 'cc7-1-monitoring',
      severity: 'warn' as const,
      check(_prompt: string) {
        // CC7.1: Informational — monitoring is provided by attestation logging
        return { pass: true, reason: 'All guard calls logged for SOC 2 CC7.1 monitoring evidence' }
      },
    },
    {
      name: 'cc8-1-change-management',
      severity: 'block' as const,
      check(prompt: string) {
        // CC8.1: Detect attempts to modify system behavior without change control
        const changeKeywords = /\b(modify\s+system|change\s+config|update\s+rule|alter\s+behavior|bypass\s+control)\b/i
        if (changeKeywords.test(prompt)) {
          return { pass: false, reason: 'Unauthorized change attempt detected per SOC 2 CC8.1' }
        }
        return { pass: true }
      },
    },
  ] as GuardRule[],
}