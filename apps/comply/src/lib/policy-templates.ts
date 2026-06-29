/**
 * Compliance Policy Templates — 6 jurisdiction-aware policy types.
 *
 * Each template uses placeholders ({{orgName}}, {{jurisdiction}}, etc.)
 * that are filled at generation time with org context + jurisdiction defaults.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PolicySection {
  title: string
  content: string
}

export interface PolicyTemplate {
  id: string
  title: string
  description: string
  sections: PolicySection[]
}

export interface JurisdictionValues {
  regulationName: string
  breachTimeline: string
  retentionPeriod: string
  dataAuthority: string
  pqcRequirement: string
  keyRotation: string
}

// ---------------------------------------------------------------------------
// Jurisdiction-specific default values
// ---------------------------------------------------------------------------

export const JURISDICTION_VALUES: Record<string, JurisdictionValues> = {
  eu: {
    regulationName: 'GDPR (Regulation (EU) 2016/679)',
    breachTimeline: '72 hours',
    retentionPeriod: '7 years for financial records',
    dataAuthority: 'National Data Protection Authority (DPA)',
    pqcRequirement: 'ENISA PQC Recommendations',
    keyRotation: '12 months',
  },
  na: {
    regulationName: 'PIPEDA (Personal Information Protection and Electronic Documents Act)',
    breachTimeline:
      'As soon as feasible (PIPEDA — no statutory hour limit; align with 72-hour best practice per NIST guidance)',
    retentionPeriod: '7 years for financial records',
    dataAuthority: 'Office of the Privacy Commissioner of Canada (OPC)',
    pqcRequirement: 'NIST FIPS 203/204 Standards',
    keyRotation: '12 months',
  },
  in: {
    regulationName: 'DPDP Act 2023 (Digital Personal Data Protection Act)',
    breachTimeline: '6 hours (CERT-In mandate)',
    retentionPeriod: '8 years for financial records (RBI directive)',
    dataAuthority: 'Data Protection Board of India',
    pqcRequirement: 'NIST FIPS 203/204 Standards with RBI alignment',
    keyRotation: '6 months',
  },
  ae: {
    regulationName: 'UAE PDPL (Federal Decree-Law No. 45 of 2021)',
    breachTimeline: '72 hours',
    retentionPeriod: '5 years minimum retention',
    dataAuthority: 'UAE Data Office',
    pqcRequirement: 'NIST FIPS 203/204 Standards',
    keyRotation: '12 months',
  },
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const informationSecurity: PolicyTemplate = {
  id: 'information-security',
  title: 'Information Security Policy',
  description:
    'InfoSec governance, data classification, access control, and cryptographic controls.',
  sections: [
    {
      title: 'Purpose & Scope',
      content: `This Information Security Policy establishes the security governance framework for {{orgName}}. It applies to all employees, contractors, and third parties who access {{orgName}} information systems.

This policy is designed to comply with {{regulationName}} and applicable {{jurisdiction}} regulatory requirements. It covers information classification, access control, cryptographic controls, and incident response procedures.`,
    },
    {
      title: 'Information Classification',
      content: `All data processed by {{orgName}} shall be classified into the following categories:

- **Confidential**: Personal data, financial records, trade secrets, PQC key material
- **Internal**: Business operations data, internal communications, employee records
- **Public**: Marketing materials, published documentation, public-facing content

Data residing in {{dataResidency}} must comply with local data residency requirements. Classification labels must be applied at creation and reviewed during the annual policy review cycle.`,
    },
    {
      title: 'Access Control',
      content: `Access to {{orgName}} information systems shall follow the principle of least privilege:

1. Role-based access control (RBAC) enforced across all systems
2. Multi-factor authentication (MFA) required for all privileged access
3. Access reviews conducted quarterly by system owners
4. Privileged access limited to named administrators with audit logging
5. Automated deprovisioning within 24 hours of role change or termination

The Data Protection Officer ({{dpoName}}, {{dpoEmail}}) oversees access governance and escalation procedures.`,
    },
    {
      title: 'Cryptographic Controls',
      content: `{{orgName}} adopts post-quantum cryptographic standards in alignment with {{pqcRequirement}}:

- **Digital Signatures**: ML-DSA-65 (FIPS 204) for all document and artifact signing
- **Key Encapsulation**: ML-KEM-768 (FIPS 203) for key exchange and encryption
- **Symmetric Encryption**: AES-256-GCM for data at rest
- **Hash Functions**: SHA-256 minimum for integrity verification

Key rotation shall occur every {{keyRotation}}. All cryptographic operations are logged to an immutable audit trail.`,
    },
    {
      title: 'Policy Review',
      content: `This policy was last reviewed on {{lastReviewDate}} and shall be reviewed annually or upon significant regulatory changes. The {{dpoName}} ({{dpoEmail}}) is responsible for maintaining and updating this policy.

Non-compliance with this policy may result in disciplinary action up to and including termination of employment or contract.`,
    },
  ],
}

const dataProtection: PolicyTemplate = {
  id: 'data-protection',
  title: 'Data Protection Policy',
  description:
    'GDPR/DPDP data processing principles, data subject rights, and breach notification.',
  sections: [
    {
      title: 'Purpose & Legal Basis',
      content: `This Data Protection Policy outlines how {{orgName}} processes personal data in compliance with {{regulationName}}.

{{orgName}} acts as a data controller for customer data and a data processor for client assessment data. All processing activities have a documented legal basis (consent, contract, legitimate interest, or legal obligation).`,
    },
    {
      title: 'Data Processing Principles',
      content: `{{orgName}} adheres to the following data processing principles as mandated by {{regulationName}}:

1. **Lawfulness, Fairness, and Transparency**: Processing is lawful and clearly communicated
2. **Purpose Limitation**: Data collected for specified, explicit, and legitimate purposes
3. **Data Minimization**: Only data adequate, relevant, and necessary is processed
4. **Accuracy**: Personal data is kept accurate and up to date
5. **Storage Limitation**: Data retained only as long as necessary (see Data Retention Policy)
6. **Integrity and Confidentiality**: Appropriate security measures applied (PQC encryption)
7. **Accountability**: {{orgName}} demonstrates compliance through documentation and audit trails`,
    },
    {
      title: 'Data Subject Rights',
      content: `Under {{regulationName}}, data subjects have the following rights which {{orgName}} facilitates:

- **Right of Access**: Request a copy of personal data held
- **Right to Rectification**: Correct inaccurate or incomplete data
- **Right to Erasure**: Request deletion where no legal basis for retention
- **Right to Restrict Processing**: Limit how data is used
- **Right to Data Portability**: Receive data in a machine-readable format
- **Right to Object**: Object to processing based on legitimate interest

Requests must be directed to the Data Protection Officer ({{dpoName}}, {{dpoEmail}}) and will be fulfilled within 30 days. All data subject requests are logged in the audit trail with PQC-signed timestamps.`,
    },
    {
      title: 'Breach Notification',
      content: `In the event of a personal data breach, {{orgName}} shall:

1. **Detect & Contain**: Incident response team activated immediately
2. **Assess**: Determine scope, severity, and affected data subjects
3. **Notify Authority**: Report to {{dataAuthority}} within **{{breachTimeline}}** of becoming aware
4. **Notify Data Subjects**: Without undue delay if high risk to rights and freedoms
5. **Document**: Full breach record maintained with PQC-signed audit entries
6. **Remediate**: Root cause analysis and preventive measures implemented

Data residency for {{orgName}} is {{dataResidency}}. All breach records are anchored to the Hedera Consensus Service for tamper-proof audit.`,
    },
    {
      title: 'Policy Review',
      content: `This policy was last reviewed on {{lastReviewDate}}. Annual review is mandatory. The Data Protection Officer ({{dpoName}}, {{dpoEmail}}) is accountable for policy compliance and updates.`,
    },
  ],
}

const incidentResponse: PolicyTemplate = {
  id: 'incident-response',
  title: 'Incident Response Policy',
  description:
    'Incident classification (P1-P4), response procedures, and notification timelines.',
  sections: [
    {
      title: 'Purpose & Scope',
      content: `This Incident Response Policy defines how {{orgName}} classifies, responds to, and recovers from security incidents. It applies to all information systems and data within {{jurisdiction}} operations.

This policy ensures compliance with {{regulationName}} breach notification requirements and establishes clear escalation procedures.`,
    },
    {
      title: 'Incident Classification',
      content: `Incidents are classified by severity:

| Priority | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| **P1 — Critical** | Active breach, data exfiltration, system compromise | 15 minutes | Unauthorized access to PQC keys, mass data exposure |
| **P2 — High** | Confirmed vulnerability exploit, service disruption | 1 hour | Ransomware attempt, DDoS attack, auth bypass |
| **P3 — Medium** | Suspicious activity, policy violation, failed attacks | 4 hours | Repeated failed logins, phishing attempts, misconfigurations |
| **P4 — Low** | Informational, minor policy deviations | 24 hours | Expired certificates, unused admin accounts, audit findings |

Classification is performed by the on-call incident commander and reviewed by {{dpoName}} ({{dpoEmail}}).`,
    },
    {
      title: 'Response Procedures',
      content: `{{orgName}} follows a structured incident response lifecycle:

**1. Identification**: Automated monitoring detects anomalies; staff report suspected incidents to security team.

**2. Containment**: Isolate affected systems, revoke compromised credentials, preserve evidence with PQC-signed forensic snapshots.

**3. Eradication**: Remove threat actors, patch vulnerabilities, rotate affected cryptographic keys (ML-DSA-65/ML-KEM-768).

**4. Recovery**: Restore services from verified backups, validate system integrity, resume normal operations with enhanced monitoring.

**5. Post-Incident Review**: Root cause analysis within 5 business days. Lessons learned documented and fed into security improvements.

All incident actions are logged to an immutable audit trail anchored to Hedera Consensus Service.`,
    },
    {
      title: 'Notification Timelines',
      content: `{{orgName}} complies with the following notification timelines under {{regulationName}}:

- **Regulatory Authority ({{dataAuthority}})**: Within **{{breachTimeline}}** of confirmed breach
- **Affected Data Subjects**: Without undue delay if high risk to rights and freedoms
- **Executive Leadership**: Within 1 hour for P1/P2 incidents
- **Board of Directors**: Within 24 hours for P1 incidents

All notifications are documented with PQC-signed timestamps and retained for {{retentionPeriod}}.`,
    },
    {
      title: 'Policy Review',
      content: `This policy was last reviewed on {{lastReviewDate}}. Tabletop exercises are conducted semi-annually to test response procedures. The {{dpoName}} ({{dpoEmail}}) ensures this policy remains current with evolving threat landscapes.`,
    },
  ],
}

const dataRetention: PolicyTemplate = {
  id: 'data-retention',
  title: 'Data Retention Policy',
  description:
    'Retention schedules by data category, destruction procedures, and legal hold.',
  sections: [
    {
      title: 'Purpose & Scope',
      content: `This Data Retention Policy governs how {{orgName}} retains and disposes of data in compliance with {{regulationName}} and {{jurisdiction}} regulatory requirements.

The policy applies to all personal data, business records, and system logs processed by {{orgName}} within {{dataResidency}}.`,
    },
    {
      title: 'Retention Schedule',
      content: `Data is retained according to the following schedule:

| Data Category | Retention Period | Legal Basis |
|---------------|-----------------|-------------|
| **Financial Records** | {{retentionPeriod}} | Tax and regulatory compliance |
| **Customer Personal Data** | Duration of contract + 3 years | {{regulationName}} |
| **Assessment Reports** | 5 years from completion | Regulatory audit requirements |
| **Audit Trail Logs** | 7 years | Compliance and forensic readiness |
| **PQC Key Material** | Until rotation + 2 years archive | Cryptographic lifecycle management |
| **Employee Records** | Duration of employment + 7 years | Labor law compliance |
| **Marketing Consent** | Until withdrawal + 1 year | {{regulationName}} accountability |
| **System Logs** | 1 year rolling | Security monitoring |

Retention periods begin from the date of last activity or as specified by applicable regulation.`,
    },
    {
      title: 'Destruction Procedures',
      content: `When retention periods expire and no legal hold applies, {{orgName}} shall securely destroy data:

1. **Digital Data**: Cryptographic erasure (destroy encryption keys) or NIST SP 800-88 compliant wiping
2. **Physical Media**: Cross-cut shredding (DIN 66399 Level P-4 minimum)
3. **Cloud Storage**: Verified deletion with provider confirmation from {{dataResidency}} region
4. **Backup Media**: Destruction within 90 days of primary data deletion
5. **PQC Key Material**: Zeroize private keys per FIPS 140-3 requirements

All destruction events are logged with PQC-signed audit entries and anchored to Hedera Consensus Service. The Data Protection Officer ({{dpoName}}, {{dpoEmail}}) approves bulk destruction requests.`,
    },
    {
      title: 'Legal Hold',
      content: `Legal hold suspends normal retention schedules when:

- Litigation is reasonably anticipated or pending
- Regulatory investigation is active
- Law enforcement request received
- Internal investigation in progress

Legal hold notices are issued by {{orgName}} legal counsel. All staff must immediately cease destruction of held data. The {{dpoName}} ({{dpoEmail}}) coordinates hold implementation and release.`,
    },
    {
      title: 'Policy Review',
      content: `This policy was last reviewed on {{lastReviewDate}}. Retention schedules are reviewed annually against evolving regulatory requirements in {{jurisdiction}}. The Data Protection Officer is responsible for ensuring compliance.`,
    },
  ],
}

const keyManagement: PolicyTemplate = {
  id: 'key-management',
  title: 'Key Management Policy',
  description:
    'PQC key lifecycle (ML-DSA-65, ML-KEM-768), rotation schedules, and migration phases.',
  sections: [
    {
      title: 'Purpose & Scope',
      content: `This Key Management Policy governs the lifecycle of cryptographic keys used by {{orgName}} to protect data confidentiality, integrity, and authenticity.

{{orgName}} has adopted post-quantum cryptographic (PQC) algorithms in alignment with {{pqcRequirement}} to ensure long-term security against quantum computing threats.`,
    },
    {
      title: 'Key Types & Algorithms',
      content: `{{orgName}} uses the following cryptographic key types:

| Key Type | Algorithm | Standard | Purpose |
|----------|-----------|----------|---------|
| **Signing Keys** | ML-DSA-65 | FIPS 204 | Document signing, audit attestation, artifact integrity |
| **Encapsulation Keys** | ML-KEM-768 | FIPS 203 | Key exchange, data encryption key wrapping |
| **Symmetric Keys** | AES-256-GCM | FIPS 197 | Data-at-rest encryption |
| **Hash Functions** | SHA-256 / SHA-3 | FIPS 180-4 / 202 | Integrity verification, key derivation |

Key sizes: ML-DSA-65 public key = 1,952 bytes, secret key = 4,032 bytes, signature = 3,309 bytes. ML-KEM-768 ciphertext = 1,088 bytes.`,
    },
    {
      title: 'Key Lifecycle',
      content: `All cryptographic keys follow a managed lifecycle:

**1. Generation**: Keys generated using cryptographically secure random number generators (CSPRNG). ML-DSA-65 keygen requires explicit 32-byte seed via randomBytes(32).

**2. Distribution**: Public keys distributed via authenticated channels. Private keys never transmitted — generated and used in place.

**3. Storage**: Private keys stored in encrypted key vaults. Hardware Security Modules (HSM) for production signing keys. PQC key material classified as Confidential.

**4. Usage**: Keys used only for their designated purpose. Dual-use prohibited. All signing operations produce audit entries anchored to Hedera Consensus Service.

**5. Rotation**: Keys rotated every **{{keyRotation}}** or immediately upon suspected compromise. Rotation follows the overlap model: new key activated, old key retained for verification during transition window.

**6. Revocation**: Compromised keys revoked immediately. Revocation propagated via certificate revocation lists and Hedera topic announcements.

**7. Destruction**: Expired keys zeroized per FIPS 140-3. Destruction logged with PQC-signed audit entry.`,
    },
    {
      title: 'PQC Migration Phases',
      content: `{{orgName}} follows a phased migration from legacy to post-quantum cryptography:

| Phase | Name | Description |
|-------|------|-------------|
| **Phase 1** | LEGACY | Inventory all classical cryptographic assets (RSA, ECDSA, AES) |
| **Phase 2** | HYBRID | Deploy PQC alongside classical algorithms (dual signing) |
| **Phase 3** | PQC_PRIMARY | PQC algorithms as primary, classical as fallback |
| **Phase 4** | PQC_ONLY | Full PQC deployment, classical algorithms deprecated |
| **Phase 5** | CERTIFIED | External audit and compliance certification achieved |

Migration progress is tracked in the GRIDERA|Comply dashboard. Each phase transition requires approval from {{dpoName}} ({{dpoEmail}}) and generates a PQC-signed attestation.`,
    },
    {
      title: 'Policy Review',
      content: `This policy was last reviewed on {{lastReviewDate}}. It shall be reviewed annually or when {{pqcRequirement}} guidance is updated. The Data Protection Officer and Security Team jointly maintain this policy.`,
    },
  ],
}

const thirdPartyRisk: PolicyTemplate = {
  id: 'third-party-risk',
  title: 'Third-Party Risk Management Policy',
  description:
    'Vendor classification (Critical/High/Medium/Low) and assessment requirements.',
  sections: [
    {
      title: 'Purpose & Scope',
      content: `This Third-Party Risk Management Policy establishes how {{orgName}} assesses, monitors, and manages risks from vendors, suppliers, and service providers.

All third parties that access, process, or store {{orgName}} data — particularly personal data subject to {{regulationName}} — must meet the security and compliance standards defined herein.`,
    },
    {
      title: 'Vendor Classification',
      content: `Third parties are classified based on data access and criticality:

| Tier | Classification | Criteria | Review Frequency |
|------|---------------|----------|-----------------|
| **Tier 1** | Critical | Access to PQC keys, personal data, or core infrastructure | Quarterly |
| **Tier 2** | High | Access to internal data or significant service dependency | Semi-annually |
| **Tier 3** | Medium | Limited data access, replaceable service | Annually |
| **Tier 4** | Low | No data access, commodity service | At onboarding + renewal |

Classification is performed during vendor onboarding and reviewed at each assessment cycle. The Data Protection Officer ({{dpoName}}, {{dpoEmail}}) approves Tier 1 and Tier 2 classifications.`,
    },
    {
      title: 'Assessment Requirements',
      content: `Vendor assessments must include:

**Tier 1 (Critical)**:
- SOC 2 Type II or equivalent certification
- Penetration test results (within 12 months)
- PQC readiness assessment (migration timeline to {{pqcRequirement}})
- Data processing agreement with breach notification within {{breachTimeline}}
- On-site or virtual audit rights
- Business continuity and disaster recovery plans

**Tier 2 (High)**:
- SOC 2 Type I or ISO 27001 certification
- Security questionnaire (SIG Lite or equivalent)
- Data processing agreement
- Incident notification procedures

**Tier 3 (Medium)**:
- Security questionnaire
- Privacy policy review
- Terms of service review

**Tier 4 (Low)**:
- Terms of service acknowledgment
- Basic due diligence (business registration, reputation check)`,
    },
    {
      title: 'Ongoing Monitoring & Termination',
      content: `{{orgName}} continuously monitors third-party risk:

1. **Continuous Monitoring**: Automated scanning for vendor security posture changes
2. **Breach Notification**: Vendors must notify {{orgName}} within {{breachTimeline}} of any security incident
3. **Annual Reassessment**: All vendors reassessed per their tier schedule
4. **Data Residency**: Vendors processing data in {{dataResidency}} must maintain local data handling
5. **Termination Procedures**: Upon contract end, vendor must certify data destruction within 30 days

Non-compliant vendors are placed on a remediation plan. Failure to remediate within 90 days triggers contract review and potential termination. All vendor risk events are logged in the PQC-signed audit trail.`,
    },
    {
      title: 'Policy Review',
      content: `This policy was last reviewed on {{lastReviewDate}}. It is reviewed annually or upon significant changes to {{regulationName}} or {{orgName}}'s vendor ecosystem. The {{dpoName}} ({{dpoEmail}}) maintains the approved vendor register.`,
    },
  ],
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const TEMPLATES: Record<string, PolicyTemplate> = {
  'information-security': informationSecurity,
  'data-protection': dataProtection,
  'incident-response': incidentResponse,
  'data-retention': dataRetention,
  'key-management': keyManagement,
  'third-party-risk': thirdPartyRisk,
}
