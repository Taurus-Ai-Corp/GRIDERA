import type { Metadata } from 'next'
import ProductShell from '@/components/product-shell'
import ProductHero from '@/components/product-hero'
import ProductSection from '@/components/product-section'

export const metadata: Metadata = {
  title: 'GRIDERA Asset — Enterprise Crypto Asset Management',
  description:
    'Enterprise crypto asset management and demo portal. Quantum-safe custody, token lifecycle management, and immutable audit trails for digital assets.',
}

const CAPABILITIES = [
  { title: 'Quantum-Safe Custody', desc: 'Protect wallets and signing flows with ML-DSA-65 and ML-KEM-768 before the standards deadline.' },
  { title: 'Token Lifecycle', desc: 'Issue, mint, burn, and distribute tokens on Hedera HTS with full provenance and compliance gating.' },
  { title: 'Policy Engine', desc: 'Enforce multi-sig, whitelisting, spending limits, and geographic restrictions across custodial and self-custody wallets.' },
  { title: 'Audit & Reporting', desc: 'Immutable HCS logs plus regulatory-grade reports for VARA, OSFI, and FATF travel rule obligations.' },
]

export default function AssetPage() {
  return (
    <ProductShell>
      <ProductHero
        eyebrow="GRIDERA Asset"
        title={
          <>
            Enterprise Crypto
            <br />
            <span className="gradient-text">Asset Management</span>
          </>
        }
        description="Secure, compliant, and quantum-ready management of digital assets. Built for treasuries, token issuers, and institutions that need immutable audit trails under NIST FIPS 203/204."
        cta={{ label: 'Request Demo', href: 'https://calendly.com/taurusai/gridera-executive-briefing' }}
        secondary={{ label: 'Explore Capabilities', href: '#capabilities' }}
      />

      <ProductSection id="capabilities" eyebrow="Built for institutions" title="Platform Capabilities" bg="bone-deep">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CAPABILITIES.map((cap) => (
            <div key={cap.title} className="border border-[var(--graphite-ghost)] p-8 bg-[var(--bone-deep)] hover:border-[var(--accent)]/30 transition-colors">
              <p className="font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--accent)] mb-3">{cap.title}</p>
              <p className="text-[15px] text-[var(--graphite-med)] leading-[1.7]">{cap.desc}</p>
            </div>
          ))}
        </div>
      </ProductSection>

      <ProductSection eyebrow="Hedera-native, quantum-ready" title="Why GRIDERA Asset" bg="bone">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Immutable Provenance', desc: 'Every asset movement is anchored to Hedera HCS with ML-DSA-65 signatures.' },
            { title: 'Regulatory Alignment', desc: 'Pre-mapped controls for VARA, OSFI B-13, FATF, and EU DORA.' },
            { title: 'Sovereign Deploy', desc: 'Run on your own infrastructure or our managed cloud. Air-gapped option available.' },
          ].map((item) => (
            <div key={item.title} className="border border-[var(--graphite-ghost)] p-6 bg-[var(--bone-deep)]">
              <p className="font-[var(--font-heading)] text-[20px] font-semibold text-[var(--graphite)] mb-3">{item.title}</p>
              <p className="text-[14px] text-[var(--graphite-med)] leading-[1.7]">{item.desc}</p>
            </div>
          ))}
        </div>
      </ProductSection>

      <section className="py-24 bg-[var(--bone-deep)] border-t border-[var(--graphite-ghost)]">
        <div className="max-w-[720px] mx-auto px-6 text-center">
          <p className="font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--accent)] mb-4">Book a Demo</p>
          <h2 className="font-[var(--font-heading)] text-[32px] md:text-[44px] font-semibold tracking-[-0.02em] leading-[1.1] text-[var(--graphite)] mb-4">
            Secure Your Digital Asset Operations
          </h2>
          <p className="text-[16px] text-[var(--graphite-med)] leading-[1.6] max-w-[520px] mx-auto mb-8">
            Get a tailored demo of GRIDERA Asset, including custody architecture, policy engine, and compliance reporting.
          </p>
          <a
            href="https://calendly.com/taurusai/gridera-executive-briefing"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Request Demo →
          </a>
        </div>
      </section>
    </ProductShell>
  )
}
