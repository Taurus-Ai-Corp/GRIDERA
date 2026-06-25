/**
 * GRIDERA Compliance Matrix — maps platform features to regulatory frameworks.
 *
 * Covers 6 frameworks: EU AI Act, GDPR, DORA, NIS2, SOC 2, ENISA PQC Guidance.
 * Each entry tracks coverage status (covered | partial | gap) and specific
 * regulatory article references.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComplianceStatus = 'covered' | 'partial' | 'gap'

export type ComplianceCategory =
  | 'ai-safety'
  | 'data-protection'
  | 'cryptography'
  | 'audit'
  | 'risk-management'
  | 'transparency'
  | 'governance'
  | 'incident-response'
  | 'access-control'

export interface RegulationRef {
  framework: string
  article: string
  description: string
}

export interface ComplianceEntry {
  featureId: string
  featureName: string
  category: ComplianceCategory
  description: string
  status: ComplianceStatus
  implementationPath: string
  regulations: RegulationRef[]
}

export interface ComplianceCoverage {
  total: number
  covered: number
  partial: number
  gap: number
  coveragePercent: number
  byFramework: Record<string, { total: number; covered: number; partial: number; gap: number }>
  byCategory: Record<string, { total: number; covered: number; partial: number; gap: number }>
}

// ---------------------------------------------------------------------------
// Matrix data — 18 covered/partial + 9 gap entries = 27 total
// ---------------------------------------------------------------------------

export const COMPLIANCE_MATRIX: ComplianceEntry[] = [
  // ─── COVERED: AI Guard system ──────────────────────────────────────────────
  {
    featureId: 'guard-pii-filter',
    featureName: 'PII Detection & Blocking (no-pii rule)',
    category: 'data-protection',
    description:
      'Input guard rule detects email, phone, SSN, and Aadhaar patterns and blocks prompts containing PII before they reach the LLM.',
    status: 'covered',
    implementationPath: 'apps/comply/src/lib/ai-guard-rules.ts',
    regulations: [
      { framework: 'EU AI Act', article: 'Article 10(5)', description: 'Data governance — personal data minimisation for training and operation' },
      { framework: 'GDPR', article: 'Article 5(1)(c)', description: 'Data minimisation principle' },
      { framework: 'GDPR', article: 'Article 25', description: 'Data protection by design and by default' },
      { framework: 'GDPR', article: 'Article 32', description: 'Security of processing — appropriate technical measures' },
    ],
  },
  {
    featureId: 'guard-injection-filter',
    featureName: 'Prompt Injection Prevention (no-injection rule)',
    category: 'ai-safety',
    description:
      'Input guard rule detects 10+ prompt injection patterns (jailbreak, instruction override, system prompt extraction) and blocks malicious prompts.',
    status: 'covered',
    implementationPath: 'apps/comply/src/lib/ai-guard-rules.ts',
    regulations: [
      { framework: 'EU AI Act', article: 'Article 15', description: 'Accuracy, robustness and cybersecurity — resilience against adversarial manipulation' },
      { framework: 'EU AI Act', article: 'Article 9', description: 'Risk management system — identification and mitigation of known risks' },
      { framework: 'NIS2', article: 'Article 21(2)(d)', description: 'Supply chain security — protection against upstream prompt attacks' },
      { framework: 'ENISA PQC', article: 'Section 4.2', description: 'Input validation as part of cryptographic protocol security' },
    ],
  },
  {
    featureId: 'guard-token-limit',
    featureName: 'Token Limit Enforcement (token-limit rule)',
    category: 'ai-safety',
    description:
      'Input guard rule estimates prompt token count and blocks requests exceeding configurable limits, preventing resource exhaustion.',
    status: 'covered',
    implementationPath: 'apps/comply/src/lib/ai-guard-rules.ts',
    regulations: [
      { framework: 'EU AI Act', article: 'Article 15(4)', description: 'Cybersecurity — resilience against denial-of-service and resource exhaustion' },
      { framework: 'DORA', article: 'Article 9(2)', description: 'ICT risk management — protection and prevention measures' },
    ],
  },
  // ─── COVERED: Guard output rules ───────────────────────────────────────────
  {
    featureId: 'guard-output-validation',
    featureName: 'Output Validation (non-empty, valid-json, response-length)',
    category: 'ai-safety',
    description:
      'Three output guard rules verify LLM responses are non-empty, valid JSON, and within size limits before delivery to users.',
    status: 'covered',
    implementationPath: 'apps/comply/src/lib/ai-guard-rules.ts',
    regulations: [
      { framework: 'EU AI Act', article: 'Article 15(1)', description: 'Accuracy — AI system outputs meet appropriate levels of accuracy' },
      { framework: 'EU AI Act', article: 'Article 14', description: 'Human oversight — verifiable output quality for human review' },
    ],
  },
  // ─── COVERED: PQC attestation signing ──────────────────────────────────────
  {
    featureId: 'guard-pqc-attestation',
    featureName: 'ML-DSA-65 Signed Guard Attestations',
    category: 'cryptography',
    description:
      'Every guard invocation produces an ML-DSA-65 (FIPS 204) post-quantum signed attestation recording input/output verdicts, model, cost, and latency.',
    status: 'covered',
    implementationPath: 'apps/comply/src/lib/ai-guard.ts',
    regulations: [
      { framework: 'GDPR', article: 'Article 32', description: 'Security of processing — state-of-the-art cryptographic measures (PQC)' },
      { framework: 'GDPR', article: 'Article 5(1)(f)', description: 'Integrity and confidentiality principle' },
      { framework: 'EU AI Act', article: 'Article 12', description: 'Record-keeping — tamper-evident logging of AI system operations' },
      { framework: 'ENISA PQC', article: 'Section 3.1', description: 'ML-DSA-65 as recommended post-quantum digital signature scheme' },
      { framework: 'DORA', article: 'Article 9(3)(b)', description: 'Cryptographic controls for data integrity' },
    ],
  },
  // ─── COVERED: Audit trail ──────────────────────────────────────────────────
  {
    featureId: 'audit-trail-pqc',
    featureName: 'PQC-Signed Audit Trail',
    category: 'audit',
    description:
      'All platform events are PQC-signed with ML-DSA-65 and persisted to database with hash, signature, and timestamps.',
    status: 'covered',
    implementationPath: 'apps/comply/src/lib/audit-logger.ts',
    regulations: [
      { framework: 'EU AI Act', article: 'Article 12', description: 'Record-keeping — automatic recording of events (logs)' },
      { framework: 'EU AI Act', article: 'Article 19', description: 'Conformity assessment — documented evidence trail' },
      { framework: 'GDPR', article: 'Article 30', description: 'Records of processing activities' },
      { framework: 'DORA', article: 'Article 12', description: 'ICT-related incident management — audit trail for investigations' },
      { framework: 'SOC 2', article: 'CC7.2', description: 'System Operations — monitoring of system components' },
    ],
  },
  // ─── COVERED: Hedera anchoring ─────────────────────────────────────────────
  {
    featureId: 'hedera-hcs-anchoring',
    featureName: 'Hedera HCS Immutable Anchoring',
    category: 'audit',
    description:
      'Audit events are anchored to Hedera Consensus Service for immutable, third-party verifiable timestamps.',
    status: 'covered',
    implementationPath: 'packages/hedera/src/index.ts',
    regulations: [
      { framework: 'EU AI Act', article: 'Article 12(2)', description: 'Logs shall be kept for a period appropriate to the intended purpose — immutable storage' },
      { framework: 'DORA', article: 'Article 11(5)', description: 'ICT third-party risk — verifiable data integrity via DLT' },
      { framework: 'SOC 2', article: 'CC7.3', description: 'Change management — immutable evidence of system events' },
    ],
  },
  // ─── COVERED: Risk classification ──────────────────────────────────────────
  {
    featureId: 'risk-classifier',
    featureName: 'EU AI Act Risk Classification Engine',
    category: 'risk-management',
    description:
      'Rule-based classifier categorises AI systems into unacceptable/high/limited/minimal risk per EU AI Act Article 5 and Annex III.',
    status: 'covered',
    implementationPath: 'apps/comply/src/lib/risk-classifier.ts',
    regulations: [
      { framework: 'EU AI Act', article: 'Article 6', description: 'Classification rules for high-risk AI systems' },
      { framework: 'EU AI Act', article: 'Article 5', description: 'Prohibited AI practices' },
      { framework: 'EU AI Act', article: 'Annex III', description: 'High-risk AI system areas' },
    ],
  },
  // ─── COVERED: Conformity assessment ────────────────────────────────────────
  {
    featureId: 'conformity-assessment',
    featureName: 'EU AI Act Conformity Assessment (22 questions, 6 sections)',
    category: 'risk-management',
    description:
      'Structured 22-question assessment covering system info, risk, data governance, transparency, human oversight, and security with weighted scoring.',
    status: 'covered',
    implementationPath: 'apps/comply/src/lib/assessment-sections.ts',
    regulations: [
      { framework: 'EU AI Act', article: 'Article 43', description: 'Conformity assessment procedures' },
      { framework: 'EU AI Act', article: 'Article 9', description: 'Risk management system requirements' },
      { framework: 'EU AI Act', article: 'Article 11', description: 'Technical documentation requirements' },
    ],
  },
  // ─── COVERED: QRS scoring ──────────────────────────────────────────────────
  {
    featureId: 'qrs-scoring',
    featureName: 'Quantum Readiness Score (QRS) Engine',
    category: 'cryptography',
    description:
      'Weighted scoring engine assesses cryptographic posture across algorithm strength, key management, protocol compliance, and PQC migration readiness.',
    status: 'covered',
    implementationPath: 'packages/pqc-engine/src/qrs-score.ts',
    regulations: [
      { framework: 'ENISA PQC', article: 'Section 5', description: 'PQC migration readiness assessment methodology' },
      { framework: 'GDPR', article: 'Article 32(1)(a)', description: 'Pseudonymisation and encryption of personal data' },
      { framework: 'DORA', article: 'Article 9(3)(a)', description: 'Cryptographic key management and encryption standards' },
    ],
  },
  // ─── COVERED: Report generator ─────────────────────────────────────────────
  {
    featureId: 'report-generator',
    featureName: 'Conformity Report Generator (template/cloud/sovereign)',
    category: 'transparency',
    description:
      'Generates EU AI Act conformity reports in three modes: template (no LLM), cloud (AI Gateway), and sovereign (self-hosted Ollama/vLLM).',
    status: 'covered',
    implementationPath: 'apps/comply/src/lib/report-generator.ts',
    regulations: [
      { framework: 'EU AI Act', article: 'Article 11', description: 'Technical documentation — comprehensive system documentation' },
      { framework: 'EU AI Act', article: 'Annex IV', description: 'Technical documentation content requirements' },
      { framework: 'SOC 2', article: 'CC2.2', description: 'Communication — internal and external information dissemination' },
    ],
  },
  // ─── COVERED: Recommendation engine ────────────────────────────────────────
  {
    featureId: 'recommendation-engine',
    featureName: 'Remediation Recommendation Engine',
    category: 'risk-management',
    description:
      'Generates prioritised recommendations citing specific EU AI Act articles based on assessment score gaps and risk indicators.',
    status: 'covered',
    implementationPath: 'apps/comply/src/lib/recommendation-engine.ts',
    regulations: [
      { framework: 'EU AI Act', article: 'Article 9(7)', description: 'Risk management — appropriate risk mitigation measures' },
      { framework: 'EU AI Act', article: 'Article 14', description: 'Human oversight — actionable guidance for operators' },
    ],
  },
  // ─── COVERED: Swarm assessment ─────────────────────────────────────────────
  {
    featureId: 'swarm-assessment',
    featureName: 'Swarm-Spawner PQC-Signed Agent Assessment',
    category: 'ai-safety',
    description:
      'Spawns 6 ephemeral PQC-signed agents (one per assessment section) with ML-DSA-65 birth/death certificates and tier enforcement.',
    status: 'covered',
    implementationPath: 'apps/comply/src/lib/swarm-assessment.ts',
    regulations: [
      { framework: 'EU AI Act', article: 'Article 15', description: 'Robustness — isolated agent execution with cryptographic identity' },
      { framework: 'ENISA PQC', article: 'Section 3.2', description: 'PQC certificate lifecycle management' },
      { framework: 'GDPR', article: 'Article 32', description: 'Security of processing — ephemeral agents reduce attack surface' },
    ],
  },
  // ─── COVERED: Jurisdiction detection ───────────────────────────────────────
  {
    featureId: 'jurisdiction-detection',
    featureName: 'Multi-Jurisdiction Geo-Detection',
    category: 'governance',
    description:
      'Hostname-based jurisdiction detection (eu/na/in/ae) with per-region regulatory configs, currencies, and data residency rules.',
    status: 'covered',
    implementationPath: 'packages/jurisdiction/src/index.ts',
    regulations: [
      { framework: 'GDPR', article: 'Article 44-49', description: 'Transfers of personal data to third countries — data residency' },
      { framework: 'EU AI Act', article: 'Article 2', description: 'Scope — geographic applicability of the regulation' },
      { framework: 'NIS2', article: 'Article 26', description: 'Jurisdiction and territoriality' },
    ],
  },
  // ─── COVERED: OBSERVE dashboard ────────────────────────────────────────────
  {
    featureId: 'observe-dashboard',
    featureName: 'AI Observability Dashboard (OBSERVE)',
    category: 'transparency',
    description:
      'Real-time dashboard showing guard pass/block/warn rates, cost tracking, latency metrics (avg + P95), and self-hosted ratio.',
    status: 'covered',
    implementationPath: 'apps/comply/src/app/(dashboard)/dashboard/observe/page.tsx',
    regulations: [
      { framework: 'EU AI Act', article: 'Article 72', description: 'Post-market monitoring by providers — continuous performance tracking' },
      { framework: 'EU AI Act', article: 'Article 14(4)', description: 'Human oversight — ability to monitor AI system operation' },
      { framework: 'DORA', article: 'Article 10', description: 'ICT business continuity management — operational monitoring' },
    ],
  },
  // ─── COVERED: PQC crypto package ───────────────────────────────────────────
  {
    featureId: 'pqc-crypto-package',
    featureName: 'PQC Cryptographic Library (@taurus/pqc-crypto)',
    category: 'cryptography',
    description:
      'ML-DSA-65 signing, ML-KEM-768 key encapsulation, AES-256-GCM encryption. NIST FIPS 203/204 compliant post-quantum cryptography.',
    status: 'covered',
    implementationPath: 'packages/pqc-crypto/src/index.ts',
    regulations: [
      { framework: 'ENISA PQC', article: 'Section 3.1', description: 'Recommended PQC algorithms: ML-DSA and ML-KEM' },
      { framework: 'GDPR', article: 'Article 32(1)(a)', description: 'Encryption of personal data — state-of-the-art measures' },
      { framework: 'DORA', article: 'Article 9(3)', description: 'Cryptographic controls and key management' },
      { framework: 'NIS2', article: 'Article 21(2)(h)', description: 'Policies on the use of cryptography and encryption' },
    ],
  },
  // ─── PARTIAL: Clerk authentication ─────────────────────────────────────────
  {
    featureId: 'clerk-auth',
    featureName: 'Clerk Authentication (proxy.ts)',
    category: 'access-control',
    description:
      'Clerk v7 authentication protecting all /dashboard/* routes via proxy.ts middleware. SSO and MFA supported via Clerk configuration.',
    status: 'partial',
    implementationPath: 'apps/comply/src/proxy.ts',
    regulations: [
      { framework: 'GDPR', article: 'Article 32(1)(b)', description: 'Ability to ensure ongoing confidentiality of processing systems' },
      { framework: 'SOC 2', article: 'CC6.1', description: 'Logical and physical access controls' },
      { framework: 'DORA', article: 'Article 9(4)(c)', description: 'Access management — authentication and authorization' },
      { framework: 'NIS2', article: 'Article 21(2)(i)', description: 'Multi-factor authentication solutions' },
    ],
  },
  // ─── PARTIAL: Assessment scoring ───────────────────────────────────────────
  {
    featureId: 'assessment-scoring',
    featureName: 'Weighted Assessment Scoring Engine',
    category: 'risk-management',
    description:
      'Per-question weights (1-3), risk indicators, section-level and overall scoring. Partial: does not yet integrate external benchmark data.',
    status: 'partial',
    implementationPath: 'apps/comply/src/lib/assessment-scorer.ts',
    regulations: [
      { framework: 'EU AI Act', article: 'Article 9(2)', description: 'Risk management — estimation and evaluation of risks' },
      { framework: 'EU AI Act', article: 'Article 43(1)', description: 'Conformity assessment — evaluation methodology' },
    ],
  },

  // =========================================================================
  // GAP entries — features NOT yet implemented
  // =========================================================================
  {
    featureId: 'gap-data-subject-rights',
    featureName: 'Data Subject Rights Management',
    category: 'data-protection',
    description:
      'Portal for data subjects to exercise GDPR rights: access, rectification, erasure, portability, restriction, and objection.',
    status: 'gap',
    implementationPath: 'NOT IMPLEMENTED',
    regulations: [
      { framework: 'GDPR', article: 'Articles 15-22', description: 'Rights of the data subject (access, rectification, erasure, portability, restriction, objection)' },
      { framework: 'EU AI Act', article: 'Article 86', description: 'Right to explanation of individual decision-making' },
    ],
  },
  {
    featureId: 'gap-dpia',
    featureName: 'Data Protection Impact Assessment (DPIA)',
    category: 'data-protection',
    description:
      'Structured DPIA workflow for AI systems processing personal data at scale, as required before deployment of high-risk processing.',
    status: 'gap',
    implementationPath: 'NOT IMPLEMENTED',
    regulations: [
      { framework: 'GDPR', article: 'Article 35', description: 'Data protection impact assessment — required for high-risk processing' },
      { framework: 'GDPR', article: 'Article 36', description: 'Prior consultation with supervisory authority' },
      { framework: 'EU AI Act', article: 'Article 27', description: 'Fundamental rights impact assessment for high-risk AI' },
    ],
  },
  {
    featureId: 'gap-breach-notification',
    featureName: 'Data Breach Notification System',
    category: 'incident-response',
    description:
      'Automated 72-hour breach notification workflow to supervisory authorities and affected data subjects.',
    status: 'gap',
    implementationPath: 'NOT IMPLEMENTED',
    regulations: [
      { framework: 'GDPR', article: 'Article 33', description: 'Notification of personal data breach to supervisory authority (72 hours)' },
      { framework: 'GDPR', article: 'Article 34', description: 'Communication of breach to data subjects' },
      { framework: 'NIS2', article: 'Article 23', description: 'Incident reporting obligations (24h early warning, 72h notification)' },
      { framework: 'DORA', article: 'Article 19', description: 'Reporting of major ICT-related incidents' },
    ],
  },
  {
    featureId: 'gap-consent-management',
    featureName: 'Consent Management Platform',
    category: 'data-protection',
    description:
      'Granular consent collection, storage, and withdrawal mechanism for data processing activities.',
    status: 'gap',
    implementationPath: 'NOT IMPLEMENTED',
    regulations: [
      { framework: 'GDPR', article: 'Article 6', description: 'Lawfulness of processing — consent as legal basis' },
      { framework: 'GDPR', article: 'Article 7', description: 'Conditions for consent — demonstrable, freely given, withdrawable' },
      { framework: 'EU AI Act', article: 'Article 13', description: 'Transparency — informed consent for AI interaction' },
    ],
  },
  {
    featureId: 'gap-vendor-assessment',
    featureName: 'Third-Party Vendor Risk Assessment',
    category: 'risk-management',
    description:
      'Supply chain and vendor assessment framework for evaluating AI model providers, cloud services, and third-party dependencies.',
    status: 'gap',
    implementationPath: 'NOT IMPLEMENTED',
    regulations: [
      { framework: 'EU AI Act', article: 'Article 25', description: 'Obligations of distributors and deployers in the supply chain' },
      { framework: 'NIS2', article: 'Article 21(2)(d)', description: 'Supply chain security — risk assessment of third-party providers' },
      { framework: 'DORA', article: 'Article 28', description: 'ICT third-party risk management — vendor due diligence' },
      { framework: 'SOC 2', article: 'CC9.2', description: 'Risk mitigation — vendor management programme' },
    ],
  },
  {
    featureId: 'gap-audit-export',
    featureName: 'Audit Trail Export & Regulatory Reporting',
    category: 'audit',
    description:
      'Export audit data in formats required by supervisory authorities (CSV, PDF, machine-readable) with filtering and date ranges.',
    status: 'gap',
    implementationPath: 'NOT IMPLEMENTED',
    regulations: [
      { framework: 'EU AI Act', article: 'Article 12(3)', description: 'Logs accessible to national competent authorities' },
      { framework: 'GDPR', article: 'Article 30(4)', description: 'Records made available to supervisory authority on request' },
      { framework: 'DORA', article: 'Article 19(4)', description: 'Incident reports in machine-readable format' },
      { framework: 'SOC 2', article: 'CC7.4', description: 'Monitoring — provision of audit evidence to external parties' },
    ],
  },
  {
    featureId: 'gap-incident-response',
    featureName: 'Incident Response Playbook',
    category: 'incident-response',
    description:
      'Automated incident response workflow with severity classification, escalation paths, containment procedures, and post-incident review.',
    status: 'gap',
    implementationPath: 'NOT IMPLEMENTED',
    regulations: [
      { framework: 'NIS2', article: 'Article 21(2)(b)', description: 'Incident handling — response and recovery procedures' },
      { framework: 'DORA', article: 'Article 17', description: 'ICT-related incident response and recovery' },
      { framework: 'SOC 2', article: 'CC7.3', description: 'System operations — incident response' },
      { framework: 'EU AI Act', article: 'Article 62', description: 'Reporting of serious incidents by providers' },
    ],
  },
  {
    featureId: 'gap-soc2-framework',
    featureName: 'SOC 2 Type II Controls Framework',
    category: 'governance',
    description:
      'Formal SOC 2 Type II controls mapping with evidence collection, continuous monitoring, and readiness assessment for enterprise customers.',
    status: 'gap',
    implementationPath: 'NOT IMPLEMENTED',
    regulations: [
      { framework: 'SOC 2', article: 'CC1.1-CC1.5', description: 'Control environment — governance structure and accountability' },
      { framework: 'SOC 2', article: 'CC3.1-CC3.4', description: 'Risk assessment — identification and analysis of risks' },
      { framework: 'SOC 2', article: 'CC5.1-CC5.3', description: 'Control activities — deployment of control policies' },
    ],
  },
  {
    featureId: 'gap-policy-generator',
    featureName: 'Compliance Policy Document Generator',
    category: 'governance',
    description:
      'AI-powered generation of compliance policy documents: privacy policy, AI ethics statement, data processing agreements, and incident response plans.',
    status: 'gap',
    implementationPath: 'NOT IMPLEMENTED',
    regulations: [
      { framework: 'GDPR', article: 'Article 24', description: 'Responsibility of the controller — appropriate technical and organisational measures' },
      { framework: 'EU AI Act', article: 'Article 11', description: 'Technical documentation — policies and procedures' },
      { framework: 'NIS2', article: 'Article 21(1)', description: 'Cybersecurity risk-management measures — policies' },
      { framework: 'SOC 2', article: 'CC1.4', description: 'Board of directors oversight — documented policies' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Returns the full compliance matrix, optionally filtered by framework.
 */
export function getComplianceMatrix(framework?: string): ComplianceEntry[] {
  if (!framework) return COMPLIANCE_MATRIX

  const lowerFramework = framework.toLowerCase()
  return COMPLIANCE_MATRIX.filter((entry) =>
    entry.regulations.some((r) => r.framework.toLowerCase().includes(lowerFramework)),
  )
}

/**
 * Calculates coverage statistics across the entire matrix.
 *
 * NOTE: `coveragePercent` counts only entries with status === 'covered' (fully covered).
 * Partial entries are NOT included in this percentage — they are tracked separately
 * in the `partial` count. This means coveragePercent = covered / total * 100, rounded.
 */
function computeCoverage(): ComplianceCoverage {
  const counts = { covered: 0, partial: 0, gap: 0 }
  const byFramework: ComplianceCoverage['byFramework'] = {}
  const byCategory: ComplianceCoverage['byCategory'] = {}

  for (const entry of COMPLIANCE_MATRIX) {
    counts[entry.status]++

    // Category accumulator
    const cat = byCategory[entry.category] ??= { total: 0, covered: 0, partial: 0, gap: 0 }
    cat.total++
    cat[entry.status]++

    // Framework accumulator — one entry can map to multiple frameworks
    const seen = new Set<string>()
    for (const reg of entry.regulations) {
      if (seen.has(reg.framework)) continue
      seen.add(reg.framework)
      const fw = byFramework[reg.framework] ??= { total: 0, covered: 0, partial: 0, gap: 0 }
      fw.total++
      fw[entry.status]++
    }
  }

  const total = COMPLIANCE_MATRIX.length
  return {
    total,
    ...counts,
    coveragePercent: Math.round((counts.covered / total) * 100),
    byFramework,
    byCategory,
  }
}

const _coverageCache = computeCoverage()

export function getComplianceCoverage(): ComplianceCoverage {
  return _coverageCache
}

/**
 * Returns only entries with status === 'gap'.
 */
export function getComplianceGaps(): ComplianceEntry[] {
  return COMPLIANCE_MATRIX.filter((e) => e.status === 'gap')
}
