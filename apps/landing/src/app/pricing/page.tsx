'use client'

import { useState } from 'react'
import Nav from '@/components/nav'
import Footer from '@/components/footer'

// ─── Data ────────────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For teams starting their compliance journey',
    monthlyPrice: 399,
    annualMonthly: 319, // 399 * 0.8
    annualTotal: 3828,
    cta: 'Start Free Trial',
    ctaHref: '/scan',
    popular: false,
    features: [
      '1 user seat',
      'EU AI Act assessment only',
      'Core compliance engines',
      'Basic audit trail (database-backed)',
      'Email support',
      'Email/password sign-in (SSO roadmap)',
      '14-day free trial included',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'For scaling compliance programs',
    monthlyPrice: 899,
    annualMonthly: 719, // 899 * 0.8
    annualTotal: 8628,
    cta: 'Start Free Trial',
    ctaHref: '/scan',
    popular: true,
    features: [
      '5 user seats',
      'All 11 tracked standards',
      'All 8 compliance engines',
      'Blockchain audit trail (Hedera HCS)',
      'Priority support',
      'API access',
      'Custom assessment templates',
      'EU AI Act, PIPEDA, DPDP, VARA, NIST',
      '14-day free trial included',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For regulated enterprises & government',
    monthlyPrice: null,
    annualMonthly: null,
    annualTotal: null,
    priceLabel: '$6,999–$8,999/mo',
    cta: 'Contact Sales',
    ctaHref: 'https://calendly.com/taurusai/gridera-executive-briefing',
    popular: false,
    features: [
      'Unlimited seats',
      '8 compliance engines',
      'Crypto agility engine',
      'Dedicated CSM + SLA',
      'SSO / SAML',
      'Air-gapped deployment option',
      'Hedera Mainnet anchoring',
      'SOC 2, ISO 27001 mapping',
      'Custom SLA & onboarding',
    ],
  },
]

const PQC_SERVICES = [
  {
    id: 'assessment',
    name: 'PQC Readiness Assessment',
    range: '$25K–$50K',
    color: '#00CCAA',
    description:
      'Cryptographic inventory audit, migration roadmap, and NIST FIPS gap analysis. Delivered in 2–4 weeks with executive summary.',
  },
  {
    id: 'hybrid-sig',
    name: 'Hybrid Signature Integration',
    range: '$75K–$150K',
    color: '#4AABA8',
    description:
      'ML-DSA-65 + classical dual-signing with zero-downtime deployment. Includes CI/CD integration and developer training.',
  },
  {
    id: 'key-migration',
    name: 'PQC Key Migration',
    range: '$250K–$1M+',
    color: '#00FFD4',
    description:
      'Full enterprise PKI modernization and HSM re-provisioning. End-to-end project management from discovery to go-live.',
  },
  {
    id: 'compliance-map',
    name: 'Compliance Mapping',
    range: '$50K–$100K',
    color: '#7FC4C2',
    description:
      'Map your crypto assets to NIST, OSFI, ECB, and RBI frameworks. Produces regulator-ready audit evidence package.',
  },
]

const FAQS = [
  {
    q: 'What\'s included in the free PQC scan?',
    a: 'Unlimited free scans with no signup required. Each scan checks your domain\'s TLS certificates, cipher suites, and key exchange algorithms against NIST FIPS 203/204 and SWIFT 2027 requirements. Results are available instantly.',
  },
  {
    q: 'How does the blockchain audit trail work?',
    a: 'Every assessment is cryptographically signed using ML-DSA-65 (NIST FIPS 204) and anchored to the Hedera Consensus Service (HCS). This creates an immutable, timestamped record that regulators can independently verify — without trusting GRIDERA.',
  },
  {
    q: 'Can I switch plans?',
    a: 'Yes. Upgrade or downgrade anytime from your account dashboard. Upgrades are effective immediately and prorated to your billing cycle. Downgrades take effect at the next renewal date.',
  },
  {
    q: 'Do you offer a free trial?',
    a: '14-day free trial on the Growth plan — no credit card required. You get full access to all 20 AI agents, Hedera audit trail, and priority support during the trial period.',
  },
  {
    q: 'What compliance frameworks do you cover?',
    a: 'GRIDERA|Comply covers 14+ frameworks across 4 jurisdictions: EU AI Act (Aug 2026), NIST FIPS 203/204, SWIFT 2027, PIPEDA (Canada), DPDP (India), VARA (UAE), ISO 27001, SOC 2, OSFI B-13, ECB TIBER-EU, RBI guidelines, PCI-DSS, GDPR (crypto provisions), and DORA.',
  },
]

// ─── Pricing Toggle ───────────────────────────────────────────────────────────

function BillingToggle({
  annual,
  onChange,
}: {
  annual: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => onChange(false)}
        className={`font-mono text-[12px] tracking-[0.06em] uppercase transition-colors duration-200 ${
          !annual ? 'text-[var(--graphite)]' : 'text-[var(--graphite-med)]'
        }`}
      >
        Monthly
      </button>

      {/* Toggle pill */}
      <button
        onClick={() => onChange(!annual)}
        className="relative w-[48px] h-[26px] border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] transition-colors duration-200"
        aria-pressed={annual}
        aria-label="Toggle annual billing"
      >
        <span
          className="absolute top-[3px] w-[18px] h-[18px] bg-[var(--accent)] transition-all duration-200"
          style={{ left: annual ? '25px' : '3px' }}
        />
      </button>

      <button
        onClick={() => onChange(true)}
        className={`font-mono text-[12px] tracking-[0.06em] uppercase transition-colors duration-200 ${
          annual ? 'text-[var(--graphite)]' : 'text-[var(--graphite-med)]'
        }`}
      >
        Annual
      </button>

      {annual && (
        <span className="font-mono text-[11px] tracking-[0.04em] text-[var(--accent)] border border-[var(--accent)] px-2 py-[2px] uppercase">
          Save 20%
        </span>
      )}
    </div>
  )
}

// ─── Pricing Card ─────────────────────────────────────────────────────────────

function PricingCard({
  tier,
  annual,
}: {
  tier: (typeof TIERS)[number]
  annual: boolean
}) {
  const displayPrice = annual ? tier.annualMonthly : tier.monthlyPrice
  const isEnterprise = tier.id === 'enterprise'

  return (
    <div
      className={`relative flex flex-col p-8 border transition-all duration-200 ${
        tier.popular
          ? 'border-[var(--accent)] bg-[rgba(0,204,170,0.04)]'
          : 'border-[var(--graphite-ghost)] bg-[var(--bone-deep)]'
      }`}
      style={
        tier.popular
          ? { boxShadow: '0 0 40px rgba(0,204,170,0.12), 0 0 80px rgba(0,204,170,0.06)' }
          : undefined
      }
    >
      {/* Popular badge */}
      {tier.popular && (
        <div className="absolute -top-px left-0 right-0 h-[3px] bg-[var(--accent)]" />
      )}
      {tier.popular && (
        <div className="absolute -top-[13px] left-8">
          <span className="font-mono text-[10px] font-medium tracking-[0.1em] uppercase bg-[var(--accent)] text-[#0B0E14] px-3 py-[3px]">
            Most Popular
          </span>
        </div>
      )}

      {/* Tier name */}
      <div className="mb-6">
        <p className="font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--graphite-med)] mb-2">
          {tier.id}
        </p>
        <h3 className="font-[var(--font-heading)] text-[24px] font-semibold tracking-[-0.01em] text-[var(--graphite)] mb-2">
          {tier.name}
        </h3>
        <p className="text-[13px] text-[var(--graphite-med)] leading-[1.5]">{tier.tagline}</p>
      </div>

      {/* Price */}
      <div className="mb-8 pb-8 border-b border-[var(--graphite-ghost)]">
        {isEnterprise ? (
          <>
            <div className="font-mono text-[28px] font-medium tracking-[-0.02em] text-[var(--graphite)] leading-none mb-1">
              {'priceLabel' in tier && tier.priceLabel}
            </div>
            <p className="font-mono text-[11px] tracking-[0.04em] text-[var(--graphite-med)] mt-2">
              Custom contract &middot; Contact for volume pricing
            </p>
          </>
        ) : (
          <>
            <div className="flex items-end gap-1 leading-none mb-1">
              <span className="font-mono text-[13px] font-medium text-[var(--graphite-med)] self-start mt-[6px]">
                $
              </span>
              <span className="font-mono text-[48px] font-medium tracking-[-0.03em] text-[var(--graphite)]">
                {displayPrice?.toLocaleString()}
              </span>
              <span className="font-mono text-[13px] text-[var(--graphite-med)] mb-[8px]">
                /mo
              </span>
            </div>
            {annual && tier.annualTotal != null && (
              <p className="font-mono text-[11px] tracking-[0.04em] text-[var(--graphite-med)]">
                Billed annually &middot; ${tier.annualTotal.toLocaleString()}/yr
              </p>
            )}
            {!annual && (
              <p className="font-mono text-[11px] tracking-[0.04em] text-[var(--graphite-med)]">
                Billed monthly &middot; switch to annual to save 20%
              </p>
            )}
          </>
        )}
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-8">
        {tier.features.map((feat) => (
          <li key={feat} className="flex items-start gap-3 text-[14px] text-[var(--graphite-med)]">
            <span className="text-[var(--accent)] font-bold mt-[1px] shrink-0" aria-hidden="true">
              ✓
            </span>
            {feat}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <a
        href={tier.ctaHref}
        {...(tier.ctaHref.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={`w-full text-center font-mono text-[12px] font-medium tracking-[0.06em] uppercase py-[14px] transition-all duration-200 ${
          tier.popular
            ? 'btn-primary justify-center'
            : isEnterprise
              ? 'border border-[var(--graphite-ghost)] text-[var(--graphite-med)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
              : 'border border-[var(--accent)] text-[var(--accent)] hover:bg-[rgba(0,204,170,0.08)]'
        }`}
      >
        {tier.cta}
        {!isEnterprise && (
          <span className="ml-2" aria-hidden="true">
            →
          </span>
        )}
      </a>
    </div>
  )
}

// ─── PQC Service Card ─────────────────────────────────────────────────────────

function PQCCard({ svc }: { svc: (typeof PQC_SERVICES)[number] }) {
  return (
    <div className="p-6 border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] hover:border-[var(--accent)] hover:bg-[rgba(0,204,170,0.03)] transition-all duration-200 group">
      <p
        className="font-mono text-[11px] font-medium tracking-[0.1em] uppercase mb-3 transition-colors duration-200"
        style={{ color: svc.color }}
      >
        Professional Services
      </p>
      <h4 className="font-[var(--font-heading)] text-[18px] font-semibold tracking-[-0.01em] text-[var(--graphite)] mb-2 leading-[1.3]">
        {svc.name}
      </h4>
      <div
        className="font-mono text-[28px] font-medium tracking-[-0.02em] mb-4 leading-none"
        style={{ color: svc.color }}
      >
        {svc.range}
      </div>
      <p className="text-[13px] text-[var(--graphite-med)] leading-[1.6]">{svc.description}</p>
      <a
        href="https://calendly.com/taurusai/gridera-executive-briefing"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary mt-6 inline-flex text-[11px] group-hover:text-[var(--accent)] group-hover:border-[var(--accent)]"
      >
        Inquire about this service →
      </a>
    </div>
  )
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="py-6 border-b border-[var(--graphite-ghost)] last:border-0">
      <p className="font-[var(--font-heading)] text-[16px] font-semibold text-[var(--graphite)] mb-3 tracking-[-0.01em]">
        {q}
      </p>
      <p className="text-[14px] text-[var(--graphite-med)] leading-[1.7] max-w-[760px]">{a}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)

  return (
    <main>
      <Nav />

      {/* ── Header ── */}
      <section className="pt-[140px] pb-[80px] text-center border-b border-[var(--graphite-ghost)]">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--accent)] mb-4">
            Pricing
          </p>
          <h1 className="font-[var(--font-heading)] text-[48px] md:text-[60px] font-semibold tracking-[-0.03em] leading-[1.1] text-[var(--graphite)] mb-5">
            Simple, Transparent Pricing
          </h1>
          <p className="text-[18px] text-[var(--graphite-med)] leading-[1.6] max-w-[560px] mx-auto mb-10">
            No hidden fees. No per-scan charges. Start free, scale as you grow.
          </p>

          {/* Billing toggle */}
          <div className="flex justify-center">
            <BillingToggle annual={annual} onChange={setAnnual} />
          </div>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section id="pricing" className="py-[80px] bg-[var(--bone)]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-[var(--graphite-ghost)]">
            {TIERS.map((tier) => (
              <PricingCard key={tier.id} tier={tier} annual={annual} />
            ))}
          </div>

          {/* Annual note */}
          {!annual && (
            <p className="text-center font-mono text-[12px] text-[var(--graphite-med)] mt-6 tracking-[0.04em]">
              Switch to annual billing and save 20% — that&apos;s up to{' '}
              <span className="text-[var(--accent)]">$2,157/year</span> on Growth.
            </p>
          )}
        </div>
      </section>

      {/* ── Regional Pricing Note ── */}
      <section className="py-[32px] bg-[var(--bone-deep)] border-y border-[var(--graphite-ghost)]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-start gap-4">
            <span
              className="font-mono text-[var(--accent)] text-[18px] leading-none shrink-0 mt-[1px]"
              aria-hidden="true"
            >
              ⓘ
            </span>
            <div>
              <p className="font-mono text-[12px] font-medium tracking-[0.06em] uppercase text-[var(--graphite-med)] mb-1">
                Regional Pricing
              </p>
              <p className="text-[14px] text-[var(--graphite-med)] leading-[1.6]">
                Pricing varies by jurisdiction.{' '}
                <strong className="text-[var(--graphite)]">India: 50% discount</strong> — Starter
                ₹1.5L/yr (~$1,800), Growth ₹4.5L/yr (~$5,400). &nbsp;
                <strong className="text-[var(--graphite)]">UAE: 20% premium</strong>, pricing in
                AED. &nbsp;
                <strong className="text-[var(--graphite)]">EU:</strong> EUR equivalent (roughly 1:1
                with USD). &nbsp;
                <strong className="text-[var(--graphite)]">Canada/US:</strong> base USD pricing
                above.{' '}
                <a
                  href="https://calendly.com/taurusai/gridera-executive-briefing"
        target="_blank"
        rel="noopener noreferrer"
                  className="text-[var(--accent)] hover:underline"
                >
                  Contact sales
                </a>{' '}
                for a regional quote.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PQC Professional Services ── */}
      <section className="py-[100px] bg-[var(--bone)]">
        <div className="max-w-[1200px] mx-auto px-6">
          {/* Section label */}
          <div className="flex items-baseline gap-4 mb-12">
            <span className="font-mono text-[14px] text-[var(--accent)] tracking-[0.02em]">
              +
            </span>
            <div>
              <h2 className="font-[var(--font-heading)] text-[28px] font-semibold tracking-[-0.02em] leading-[1.2] text-[var(--graphite)]">
                PQC Professional Services
              </h2>
              <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--graphite-med)] mt-1">
                High-margin consulting add-ons &middot; enterprise cryptography modernization
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-[var(--graphite-ghost)]">
            {PQC_SERVICES.map((svc) => (
              <PQCCard key={svc.id} svc={svc} />
            ))}
          </div>

          <div className="mt-8 p-6 border border-[var(--graphite-ghost)] bg-[var(--bone-deep)]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="font-[var(--font-heading)] text-[16px] font-semibold text-[var(--graphite)] mb-1">
                  All professional services include a discovery call
                </p>
                <p className="text-[14px] text-[var(--graphite-med)]">
                  Scoped proposal within 48 hours. Fixed-fee or T&amp;M contracts available.
                </p>
              </div>
              <a href="https://calendly.com/taurusai/gridera-executive-briefing"
        target="_blank"
        rel="noopener noreferrer" className="btn-primary shrink-0">
                Schedule Discovery Call →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-[100px] bg-[var(--bone-deep)] border-t border-[var(--graphite-ghost)]">
        <div className="max-w-[1200px] mx-auto px-6">
          {/* Section label */}
          <div className="flex items-baseline gap-4 mb-12">
            <span className="font-mono text-[14px] text-[var(--accent)] tracking-[0.02em]">
              ?
            </span>
            <div>
              <h2 className="font-[var(--font-heading)] text-[28px] font-semibold tracking-[-0.02em] leading-[1.2] text-[var(--graphite)]">
                Frequently Asked Questions
              </h2>
              <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--graphite-med)] mt-1">
                Common questions about plans, billing, and compliance coverage
              </p>
            </div>
          </div>

          <div className="max-w-[840px]">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-[100px] bg-[var(--bone)] border-t border-[var(--graphite-ghost)] text-center">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--accent)] mb-4">
            Get Started
          </p>
          <h2 className="font-[var(--font-heading)] text-[36px] md:text-[48px] font-semibold tracking-[-0.02em] leading-[1.1] text-[var(--graphite)] mb-4">
            Ready to get quantum-safe?
          </h2>
          <p className="text-[16px] text-[var(--graphite-med)] leading-[1.6] mb-10 max-w-[480px] mx-auto">
            Join compliance teams across Canada, EU, India, and UAE using GRIDERA|Comply to stay
            ahead of post-quantum mandates.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/scan" className="btn-primary">
              Start Your Free Trial →
            </a>
            <a href="https://calendly.com/taurusai/gridera-executive-briefing"
        target="_blank"
        rel="noopener noreferrer" className="btn-secondary">
              Talk to Sales
            </a>
          </div>
          <p className="font-mono text-[11px] tracking-[0.04em] text-[var(--graphite-med)] mt-6">
            14 days free &middot; No credit card required &middot; Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
