import type { Metadata } from 'next'
import ProductShell from '@/components/product-shell'
import ProductHero from '@/components/product-hero'
import ProductSection from '@/components/product-section'

export const metadata: Metadata = {
  title: 'GRIDERA Lend — MSME Lending Platform',
  description:
    'AI-powered MSME lending and loan repayment management. Quantum-safe credit scoring, automated KYC, and regulator-ready audit trails for emerging markets.',
}

const FEATURES = [
  { title: 'Quantum-Safe Credit Scoring', desc: 'ML models score borrowers using alternative data while PQC signatures protect model provenance and fairness evidence.' },
  { title: 'Automated KYC / KYB', desc: 'Document verification, UBO checks, and sanctions screening orchestrated in one workflow with immutable HCS logs.' },
  { title: 'Repayment Intelligence', desc: 'Predict delinquency, recommend restructuring, and automate reminders across WhatsApp, SMS, and email.' },
  { title: 'Regulator Dashboard', desc: 'Real-time portfolio risk, NPA metrics, and capital-adequacy reports for RBI, CBUAE, and OSFI frameworks.' },
]

const STACK = [
  { label: 'Decision Engine', value: 'Sub-2 min approvals' },
  { label: 'Audit Trail', value: 'Hedera HCS anchored' },
  { label: 'Deployment', value: 'Cloud or on-premise' },
  { label: 'Compliance', value: 'RBI / DIFC / OSFI mapped' },
]

export default function LendPage() {
  return (
    <ProductShell>
      <ProductHero
        eyebrow="GRIDERA Lend"
        title={
          <>
            AI Lending for
            <br />
            <span className="gradient-text">Emerging Markets</span>
          </>
        }
        description="MSME lending and repayment management powered by quantum-safe credit scoring, automated KYC, and blockchain-anchored audit trails. Built for regulators and lenders in India, UAE, and Canada."
        cta={{ label: 'Request Demo', href: 'mailto:admin@taurusai.io?subject=GRIDERA%20Lend%20Demo' }}
        secondary={{ label: 'View Use Cases', href: '#features' }}
      />

      <ProductSection id="features" eyebrow="Built for lenders" title="Platform Capabilities" bg="bone-deep">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-[var(--graphite-ghost)]">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-8 bg-[var(--bone)] hover:bg-[rgba(0,204,170,0.03)] transition-colors">
              <p className="font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--accent)] mb-3">{f.title}</p>
              <p className="text-[15px] text-[var(--graphite-med)] leading-[1.7] max-w-[480px]">{f.desc}</p>
            </div>
          ))}
        </div>
      </ProductSection>

      <ProductSection eyebrow="Performance at a glance" title="Lending Stack" bg="bone">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STACK.map((s) => (
            <div key={s.label} className="border border-[var(--graphite-ghost)] p-6 bg-[var(--bone-deep)]">
              <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--graphite-med)] mb-2">{s.label}</p>
              <p className="font-[var(--font-heading)] text-[20px] font-semibold text-[var(--graphite)]">{s.value}</p>
            </div>
          ))}
        </div>
      </ProductSection>

      <section className="py-24 bg-[var(--bone-deep)] border-t border-[var(--graphite-ghost)]">
        <div className="max-w-[720px] mx-auto px-6 text-center">
          <p className="font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--accent)] mb-4">Book a Demo</p>
          <h2 className="font-[var(--font-heading)] text-[32px] md:text-[44px] font-semibold tracking-[-0.02em] leading-[1.1] text-[var(--graphite)] mb-4">
            Deploy GRIDERA Lend in Your Market
          </h2>
          <p className="text-[16px] text-[var(--graphite-med)] leading-[1.6] max-w-[520px] mx-auto mb-8">
            We run pilot programs with regulated lenders. Get a tailored demo, compliance mapping, and integration plan.
          </p>
          <a
            href="mailto:admin@taurusai.io?subject=GRIDERA%20Lend%20Pilot%20Inquiry"
            className="btn-primary"
          >
            Request Demo →
          </a>
        </div>
      </section>
    </ProductShell>
  )
}
