import type { JurisdictionConfig } from '../types.js'

// Canada as a first-class, data-resident jurisdiction. Distinct from `na`
// (which is US-modeled: USD, US federal deadline stack, us-east-2 residency).
// dataResidencyRegion is Canadian (ca-central-1, Montreal) — the sovereignty
// anchor. NOTE: Vercel has no Canadian serverless region, so `vercelRegion`
// falls back to iad1; true compute sovereignty needs the self-hosted L3 path in
// docs/canada-data-sovereignty-strategy.md. The DB (ca-central-1) + Canadian-held
// encryption keys are what deliver sovereignty, not the compute region.
export const caConfig: JurisdictionConfig = {
  id: 'ca',
  name: 'Canada',
  shortName: 'CA',
  domain: 'ca.q-grid.net',
  currency: { code: 'CAD', symbol: '$', locale: 'en-CA' },
  regulations: [
    // ── Privacy / data protection ──
    {
      id: 'pipeda',
      name: 'PIPEDA — Personal Information Protection and Electronic Documents Act',
      authority: 'Office of the Privacy Commissioner of Canada',
    },
    {
      id: 'quebec-law-25',
      name: 'Québec Law 25 — PIA required before transferring PII outside Québec',
      authority: 'Commission d’accès à l’information du Québec',
      deadline: '2024-09-22',
    },
    // ── AI governance ──
    {
      id: 'aida',
      name: 'AIDA — Artificial Intelligence and Data Act (Bill C-27)',
      authority: 'Parliament of Canada',
    },
    {
      id: 'tb-directive-adm',
      name: 'Treasury Board Directive on Automated Decision-Making',
      authority: 'Treasury Board of Canada Secretariat',
    },
    // ── Financial-sector supervision ──
    {
      id: 'osfi-e23',
      name: 'OSFI E-23 — Model Risk Management',
      authority: 'OSFI',
    },
    {
      id: 'osfi-b13',
      name: 'OSFI B-13 — Technology and Cyber Risk Management',
      authority: 'OSFI',
    },
    // ── Post-quantum / cyber ──
    {
      id: 'cccs-pqc',
      name: 'CCCS Post-Quantum Cryptography Migration Guidance',
      authority: 'Canadian Centre for Cyber Security',
    },
    {
      id: 'nist-fips-203-204',
      name: 'NIST FIPS 203/204 — ML-KEM & ML-DSA (adopted by CCCS)',
      authority: 'NIST / CCCS',
      deadline: '2024-08-13',
    },
    {
      id: 'soc2',
      name: 'SOC 2 Type II',
      authority: 'AICPA',
    },
  ],
  riskLevels: [
    {
      key: 'level-i',
      label: 'Level I',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      description: 'Little to no impact — reversible and brief effects (TBS ADM Level I)',
    },
    {
      key: 'level-ii',
      label: 'Level II',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      description: 'Moderate impact — likely reversible and short-term effects (TBS ADM Level II)',
    },
    {
      key: 'level-iii',
      label: 'Level III',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      description: 'High impact — difficult to reverse and ongoing effects (TBS ADM Level III)',
    },
    {
      key: 'level-iv',
      label: 'Level IV',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      description: 'Very high impact — irreversible and perpetual effects (TBS ADM Level IV)',
    },
  ],
  assessmentTitle: 'Canadian AI Compliance Assessment',
  documentTypes: [
    'aia_report',
    'pipeda_pia',
    'law25_pia',
    'osfi_mrm_report',
    'pqc_readiness_report',
    'data_residency_certificate',
    'soc2_report',
  ],
  supportedLocales: ['en-CA', 'fr-CA'],
  defaultLocale: 'en-CA',
  dataResidencyRegion: 'ca-central-1',
  vercelRegion: 'iad1',
  pricingMultiplier: 1.0,
}
