/**
 * SOC 2 Type II platform-to-control mapper.
 *
 * Maps GRIDERA platform features to SOC 2 Trust Services Criteria controls,
 * calculates readiness scores, and identifies gaps for remediation.
 *
 * Dual-purpose: internal audit prep AND customer-facing readiness dashboard.
 */

import { SOC2_CONTROLS } from './soc2-controls'

// Re-export for convenience
export { SOC2_CONTROLS } from './soc2-controls'
export type { Soc2Control } from './soc2-controls'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Soc2ControlMapping {
  controlId: string
  controlTitle: string
  category: string
  status: 'met' | 'partial' | 'not-met'
  platformFeature?: string
  evidence?: string
  gap?: string
}

export interface Soc2ReadinessScore {
  overall: number
  byCategory: Record<string, number>
  totalControls: number
  metControls: number
  partialControls: number
  gapControls: number
}

// ---------------------------------------------------------------------------
// Static mapping — what the platform already covers
// ---------------------------------------------------------------------------

const CONTROL_MAPPINGS: Record<
  string,
  { status: 'met' | 'partial' | 'not-met'; platformFeature?: string; evidence?: string; gap?: string }
> = {
  // ─── MET ──────────────────────────────────────────────────────────────────

  'CC3.1': {
    status: 'met',
    platformFeature: 'QRS Engine + AI Act Assessment',
    evidence:
      'Quantum Readiness Score (QRS) engine performs risk identification across cryptographic posture. EU AI Act conformity assessment covers 22-question risk analysis across 6 sections.',
  },
  'CC4.1': {
    status: 'met',
    platformFeature: 'OBSERVE Dashboard',
    evidence:
      'Real-time AI observability dashboard monitors guard pass/block/warn rates, cost tracking, latency metrics (avg + P95), and self-hosted ratio.',
  },
  'CC6.1': {
    status: 'met',
    platformFeature: 'Clerk Auth + PQC Signing',
    evidence:
      'Clerk v7 authentication with SSO and MFA protecting all dashboard routes via proxy.ts. ML-DSA-65 post-quantum signing for all attestations.',
  },
  'CC6.2': {
    status: 'met',
    platformFeature: 'Clerk User Registration',
    evidence:
      'Clerk handles user registration with email verification, identity provider integration, and account provisioning workflows.',
  },
  'CC6.3': {
    status: 'met',
    platformFeature: 'Route Protection + Clerk RBAC',
    evidence:
      'Next.js proxy.ts enforces route-level access control. Dashboard routes require authenticated sessions. Role-based access managed through Clerk organisations.',
  },
  'CC6.6': {
    status: 'met',
    platformFeature: 'ML-DSA-65 + ML-KEM-768 + AES-256-GCM + TLS 1.3',
    evidence:
      'Post-quantum cryptography: ML-DSA-65 (FIPS 204) signing, ML-KEM-768 (FIPS 203) key encapsulation, AES-256-GCM symmetric encryption. TLS 1.3 for all connections via Vercel edge.',
  },
  'CC7.1': {
    status: 'met',
    platformFeature: 'OBSERVE System Monitoring',
    evidence:
      'OBSERVE dashboard provides system-level monitoring of AI guard invocations, application metrics, cost tracking, and performance indicators.',
  },
  'CC7.2': {
    status: 'met',
    platformFeature: 'Guard Attestation Analysis',
    evidence:
      'ML-DSA-65 signed guard attestations enable pattern analysis across input/output verdicts. Anomalous guard block rates trigger investigation.',
  },
  'CC8.1': {
    status: 'met',
    platformFeature: 'Git + Vercel CI/CD + Hedera HCS',
    evidence:
      'All changes go through Git with pull request review. Vercel CI/CD runs lint, type-check, test, build pipeline. Audit events anchored to Hedera HCS for immutable change evidence.',
  },
  'CC9.1': {
    status: 'met',
    platformFeature: 'PQC Migration + Guard Rules',
    evidence:
      'PQC migration wizard provides 5-step LEGACY to PQC_ONLY pathway for cryptographic risk. AI guard rules mitigate injection, PII exposure, and resource exhaustion risks.',
  },
  'PI1.1': {
    status: 'met',
    platformFeature: 'Guard Output Validation',
    evidence:
      'Three output guard rules validate AI responses: non-empty check, valid JSON schema, and response length limits before delivery to users.',
  },
  'PI1.2': {
    status: 'met',
    platformFeature: 'Guard Input Rules',
    evidence:
      'Input guard rules validate all prompts: PII detection and blocking, prompt injection prevention (10+ patterns), and token limit enforcement.',
  },
  'C1.1': {
    status: 'met',
    platformFeature: 'PII Detection + Data Classification',
    evidence:
      'Guard no-pii rule detects email, phone, SSN, and Aadhaar patterns. PII is blocked before reaching LLM, enforcing confidential data handling in AI pipelines.',
  },
  'P3.1': {
    status: 'met',
    platformFeature: 'PII Guard + Data Minimisation',
    evidence:
      'PII guard rule enforces collection limitation by blocking personal data from AI processing. Only minimum necessary data reaches the LLM.',
  },

  // ─── PARTIAL ──────────────────────────────────────────────────────────────

  'CC1.1': {
    status: 'partial',
    platformFeature: 'Security Policies (Generated)',
    evidence:
      'Policy generator produces information security, data protection, and incident response policies.',
    gap: 'Policies are template-generated. Needs formal adoption, leadership sign-off, and employee acknowledgement tracking.',
  },
  'CC2.1': {
    status: 'partial',
    platformFeature: 'Audit Trail + Dashboard',
    evidence:
      'Audit trail logs and OBSERVE dashboard provide internal visibility into system operations.',
    gap: 'No formal internal security communication programme (bulletins, training, onboarding security awareness).',
  },
  'CC2.2': {
    status: 'partial',
    platformFeature: 'Status Page + API Docs',
    evidence:
      'Platform provides API documentation and public-facing compliance information.',
    gap: 'No formal vulnerability disclosure policy or external security contact published.',
  },
  'CC5.1': {
    status: 'partial',
    platformFeature: 'Policy Generator',
    evidence:
      'Six policy types generated: information security, data protection, incident response, data retention, key management, and third-party risk.',
    gap: 'Policies exist as documents but lack formal implementation tracking, exception management, and annual review cadence.',
  },
  'CC7.3': {
    status: 'partial',
    platformFeature: 'Guard Block Events',
    evidence:
      'Guard attestations record block events with reasons. OBSERVE dashboard shows block rates.',
    gap: 'No formal security event triage process with severity classification and escalation thresholds.',
  },
  'CC7.4': {
    status: 'partial',
    platformFeature: 'Incident Response Policy',
    evidence:
      'Generated incident response policy defines roles and procedures.',
    gap: 'Policy is document-only. Needs automated incident workflow, war room procedures, and regular tabletop exercises.',
  },
  'CC9.2': {
    status: 'partial',
    platformFeature: 'Third-Party Risk Policy',
    evidence:
      'Generated third-party risk policy outlines vendor assessment framework.',
    gap: 'No vendor register, due diligence questionnaires, or ongoing vendor monitoring in place.',
  },
  'A1.1': {
    status: 'partial',
    platformFeature: 'Vercel Edge Hosting',
    evidence:
      'Vercel provides global edge deployment with built-in DDoS protection and CDN.',
    gap: 'No formal SLA targets documented, no synthetic monitoring, no capacity planning procedures.',
  },
  'A1.2': {
    status: 'partial',
    platformFeature: 'Vercel + Neon Database',
    evidence:
      'Vercel provides automatic failover. Neon offers point-in-time recovery for database.',
    gap: 'No documented RPO/RTO targets, disaster recovery runbook, or regular recovery testing.',
  },
  'C1.2': {
    status: 'partial',
    platformFeature: 'Data Retention Policy',
    evidence:
      'Generated data retention policy defines retention periods by data category.',
    gap: 'No automated disposal workflows or cryptographic key destruction procedures implemented.',
  },
  'P1.1': {
    status: 'partial',
    platformFeature: 'Privacy Policy Page',
    evidence:
      'Landing page includes privacy policy content.',
    gap: 'Privacy notice needs to be comprehensive and cover all data processing activities specific to the platform.',
  },
  'P4.1': {
    status: 'partial',
    platformFeature: 'Data Retention Policy',
    evidence:
      'Generated data retention policy defines use and retention parameters.',
    gap: 'No automated purge schedules or data usage auditing against stated purposes.',
  },
  'P6.1': {
    status: 'partial',
    platformFeature: 'Audit Trail Logging',
    evidence:
      'All data access events are logged in the audit trail.',
    gap: 'No formal third-party data sharing register or data sharing agreements.',
  },
  'P7.1': {
    status: 'partial',
    platformFeature: 'Clerk Profile Management',
    evidence:
      'Clerk provides user self-service profile management and correction.',
    gap: 'No periodic data quality reviews or data quality standards documented.',
  },
  'P8.1': {
    status: 'partial',
    platformFeature: 'OBSERVE + Audit Trail',
    evidence:
      'OBSERVE dashboard and audit trail provide monitoring of data handling activities.',
    gap: 'No formal privacy audit programme, privacy metrics reporting, or compliance monitoring schedule.',
  },

  // ─── NOT MET ──────────────────────────────────────────────────────────────

  'CC1.2': {
    status: 'not-met',
    gap: 'No board of directors or advisory committee with formal security oversight. Requires governance structure for enterprise readiness.',
  },
  'CC3.2': {
    status: 'not-met',
    gap: 'No formal fraud risk assessment programme. Needs fraud risk analysis covering management override, data manipulation, and separation of duties.',
  },
  'P2.1': {
    status: 'not-met',
    gap: 'No consent management platform. Needs granular opt-in/opt-out controls, consent recording, and withdrawal support.',
  },
  'P5.1': {
    status: 'not-met',
    gap: 'No data subject access/export functionality. Needs self-service data export (JSON/CSV) and documented request process.',
  },
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Maps all SOC 2 controls to platform features, returning full mapping array.
 */
function computeMappings(): Soc2ControlMapping[] {
  return SOC2_CONTROLS.map((control) => {
    const mapping = CONTROL_MAPPINGS[control.id]
    if (!mapping) {
      return {
        controlId: control.id,
        controlTitle: control.title,
        category: control.category,
        status: 'not-met' as const,
        gap: 'Not yet assessed or mapped to platform features.',
      }
    }
    return {
      controlId: control.id,
      controlTitle: control.title,
      category: control.category,
      status: mapping.status,
      platformFeature: mapping.platformFeature,
      evidence: mapping.evidence,
      gap: mapping.gap,
    }
  })
}

function computeScore(resolved: Soc2ControlMapping[]): Soc2ReadinessScore {
  const statusScore = (s: Soc2ControlMapping['status']) => s === 'met' ? 100 : s === 'partial' ? 50 : 0
  const totalScore = resolved.reduce((sum, m) => sum + statusScore(m.status), 0)
  const byCategory: Record<string, number> = {}
  const catAccum: Record<string, { sum: number; count: number }> = {}
  let met = 0, partial = 0, gap = 0

  for (const m of resolved) {
    if (m.status === 'met') met++
    else if (m.status === 'partial') partial++
    else gap++
    const acc = catAccum[m.category] ??= { sum: 0, count: 0 }
    acc.sum += statusScore(m.status)
    acc.count++
  }
  for (const [cat, acc] of Object.entries(catAccum)) {
    byCategory[cat] = Math.round(acc.sum / acc.count)
  }

  return {
    overall: Math.round(totalScore / resolved.length),
    byCategory,
    totalControls: resolved.length,
    metControls: met,
    partialControls: partial,
    gapControls: gap,
  }
}

const _mappingsCache = computeMappings()
const _scoreCache = computeScore(_mappingsCache)
const _gapsCache = _mappingsCache.filter((m) => m.status === 'not-met')

export function mapPlatformToSoc2(): Soc2ControlMapping[] {
  return _mappingsCache
}

export function getSoc2ReadinessScore(): Soc2ReadinessScore {
  return _scoreCache
}

export function getSoc2Gaps(): Soc2ControlMapping[] {
  return _gapsCache
}
