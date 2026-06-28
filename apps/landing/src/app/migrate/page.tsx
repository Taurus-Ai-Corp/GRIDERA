"use client"

import { useState } from 'react'
import ProductShell from '@/components/product-shell'
import ProductHero from '@/components/product-hero'
import ProductSection from '@/components/product-section'

const STEPS = [
  {
    num: '01',
    name: 'Analyze',
    title: 'Scan your codebase for legacy crypto',
    desc: 'Autonomous agents crawl every repository, dependency manifest, and config file to map your RSA, ECDSA, Ed25519, and Diffie-Hellman usage across the entire stack.',
    tags: ['RSA-2048', 'ECDSA-P256', 'Ed25519', '3DES', 'SHA-1'],
    color: '#00CCAA',
  },
  {
    num: '02',
    name: 'Migrate',
    title: 'AI swarms refactor to post-quantum',
    desc: 'Spawned developer swarms open branches, swap ML-KEM-768 for key exchange and ML-DSA-65 for signatures, update call sites, and generate reviewed pull requests.',
    tags: ['ML-KEM-768', 'ML-DSA-65', 'SLH-DSA', 'Hybrid X25519+ML-KEM'],
    color: '#4AABA8',
  },
  {
    num: '03',
    name: 'Verify',
    title: 'Quantum-signed audit trail on Hedera',
    desc: 'Every migration decision is ML-DSA-65 signed and anchored to Hedera Consensus Service, producing an immutable, regulator-verifiable audit trail.',
    tags: ['HCS anchoring', 'ML-DSA-65 sigs', 'NIST FIPS 203', 'NIST FIPS 204'],
    color: '#00FFD4',
  },
]

const CAPABILITIES = [
  { label: 'Autonomous Swarms', desc: 'Parallel agent teams work across repos simultaneously — a 50-service monolith migrates in days, not quarters.' },
  { label: 'Cryptographic Inventory', desc: 'Full dependency-graph mapping of every primitive, key store, HSM reference, and TLS endpoint in your estate.' },
  { label: 'Pull Request Pipeline', desc: 'Reviewed, tested, CI-passing PRs land in your existing GitHub / GitLab / Bitbucket workflow.' },
  { label: 'Hybrid Rollout', desc: 'Classical + post-quantum dual-signing during transition. Zero-downtime deploy with rollback safety.' },
]

const PRICING_TIERS = [
  { id: 'pilot', name: 'Pilot', range: 'From $250K', blurb: 'Single-service PQC migration', features: ['1 critical service or repo', 'Cryptographic inventory + report', 'AI swarm migration of 1 primitive family', 'Hedera HCS audit trail', 'ML-DSA-65 signed PRs', '8-week delivery'], popular: false },
  { id: 'transformation', name: 'Transformation', range: '$500K–$1M+', blurb: 'Full-estate quantum migration', features: ['Up to 50 services / repos', 'All primitive families', 'Hybrid rollout with zero downtime', 'HSM re-provisioning & PKI modernization', 'Regulator-ready evidence package', 'Dedicated migration lead + SLA', '12–24 week delivery'], popular: true },
  { id: 'enterprise', name: 'Enterprise', range: 'Custom', blurb: 'Air-gapped & sovereign deploy', features: ['Unlimited repos & primitives', 'On-prem / air-gapped swarm deploy', 'Custom algorithm policy engine', 'Sovereign HSM integration', 'SOC 2 + ISO 27001 mapping', 'Multi-year roadmap partnership'], popular: false },
]

type FormState = { name: string; email: string; company: string; repoUrl: string; message: string }
const EMPTY_FORM: FormState = { name: '', email: '', company: '', repoUrl: '', message: '' }

export default function MigratePage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/migrate/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed. Please try again.')
      setStatus('success')
      setForm(EMPTY_FORM)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    }
  }

  return (
    <ProductShell>
      <ProductHero
        eyebrow="GRIDERA|Migrate"
        title={
          <>
            Migrate Your Infrastructure to
            <br />
            <span className="gradient-text">Post-Quantum Cryptography</span>
          </>
        }
        description="Instead of months of manual consulting, GRIDERA.Migrate spawns autonomous AI developer swarms that analyze your codebase, refactor legacy crypto libraries, and generate reviewed pull requests. Every decision is quantum-signed on Hedera."
        cta={{ label: 'Request Consultation', href: '#inquire' }}
        secondary={{ label: 'See How It Works', href: '#process' }}
      />

      <ProductSection id="process" eyebrow="Three autonomous phases" title="The Transformation Pipeline" bg="bone-deep">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div
            className="hidden md:block absolute top-[40px] left-[16%] right-[16%] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, var(--graphite-ghost) 15%, var(--graphite-ghost) 85%, transparent)' }}
            aria-hidden="true"
          />
          {STEPS.map((step) => (
            <div key={step.num} className="glass-surface p-8 relative flex flex-col" style={{ boxShadow: `0 0 40px ${step.color}0A` }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="font-mono text-[28px] font-medium tracking-[-0.02em] leading-none" style={{ color: step.color }}>{step.num}</div>
                <div className="h-px flex-1" style={{ background: `${step.color}40` }} />
              </div>
              <p className="font-mono text-[11px] font-medium tracking-[0.12em] uppercase mb-2" style={{ color: step.color }}>{step.name}</p>
              <h3 className="font-[var(--font-heading)] text-[20px] font-semibold tracking-[-0.01em] text-[var(--graphite)] mb-3 leading-[1.3]">{step.title}</h3>
              <p className="text-[14px] text-[var(--graphite-med)] leading-[1.7] mb-6 flex-1">{step.desc}</p>
              <div className="flex flex-wrap gap-2">
                {step.tags.map((tag) => (
                  <span key={tag} className="font-mono text-[10px] tracking-[0.06em] px-[8px] py-[3px] border" style={{ color: step.color, borderColor: `${step.color}30`, background: `${step.color}08` }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ProductSection>

      <ProductSection eyebrow="Agentic intelligence at scale" title="Swarm-Native Migration Engine" bg="bone">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-[var(--graphite-ghost)]">
          {CAPABILITIES.map((cap) => (
            <div key={cap.label} className="p-8 bg-[var(--bone)] hover:bg-[rgba(0,204,170,0.03)] transition-colors duration-200">
              <p className="font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--accent)] mb-3">{cap.label}</p>
              <p className="text-[15px] text-[var(--graphite-med)] leading-[1.7] max-w-[480px]">{cap.desc}</p>
            </div>
          ))}
        </div>
      </ProductSection>

      <ProductSection id="pricing" eyebrow="Fixed-fee or T&amp;M" title="Engagement Tiers" bg="bone-deep">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col p-8 border transition-all duration-200 ${tier.popular ? 'border-[var(--accent)] bg-[rgba(0,204,170,0.04)]' : 'border-[var(--graphite-ghost)] bg-[var(--bone)]'}`}
              style={tier.popular ? { boxShadow: '0 0 40px rgba(0,204,170,0.12), 0 0 80px rgba(0,204,170,0.06)' } : undefined}
            >
              {tier.popular && <div className="absolute -top-px left-0 right-0 h-[3px] bg-[var(--accent)]" />}
              {tier.popular && (
                <div className="absolute -top-[13px] left-8">
                  <span className="font-mono text-[10px] font-medium tracking-[0.1em] uppercase bg-[var(--accent)] text-[#0B0E14] px-3 py-[3px]">Most Chosen</span>
                </div>
              )}
              <div className="mb-6">
                <p className="font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--graphite-med)] mb-2">{tier.id}</p>
                <h3 className="font-[var(--font-heading)] text-[24px] font-semibold tracking-[-0.01em] text-[var(--graphite)] mb-2">{tier.name}</h3>
                <p className="text-[13px] text-[var(--graphite-med)] leading-[1.5]">{tier.blurb}</p>
              </div>
              <div className="mb-8 pb-8 border-b border-[var(--graphite-ghost)]">
                <div className="font-mono text-[32px] font-medium tracking-[-0.02em] text-[var(--graphite)] leading-none">{tier.range}</div>
              </div>
              <ul className="flex-1 space-y-3 mb-8">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-[14px] text-[var(--graphite-med)]">
                    <span className="text-[var(--accent)] font-bold mt-[1px] shrink-0" aria-hidden="true">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>
              <a
                href="#inquire"
                className={`w-full text-center font-mono text-[12px] font-medium tracking-[0.06em] uppercase py-[14px] transition-all duration-200 ${tier.popular ? 'btn-primary justify-center' : 'border border-[var(--accent)] text-[var(--accent)] hover:bg-[rgba(0,204,170,0.08)]'}`}
              >
                Request Consultation<span className="ml-2" aria-hidden="true">→</span>
              </a>
            </div>
          ))}
        </div>
      </ProductSection>

      <section id="inquire" className="py-24 bg-[var(--bone)] border-t border-[var(--graphite-ghost)]">
        <div className="max-w-[720px] mx-auto px-6">
          <div className="text-center mb-12">
            <p className="font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--accent)] mb-4">Request Consultation</p>
            <h2 className="font-[var(--font-heading)] text-[32px] md:text-[44px] font-semibold tracking-[-0.02em] leading-[1.1] text-[var(--graphite)] mb-4">
              Start Your <span className="gradient-text">PQC Migration</span>
            </h2>
            <p className="text-[16px] text-[var(--graphite-med)] leading-[1.6] max-w-[520px] mx-auto">
              Tell us about your estate. We will send a scoped proposal within 48 hours — no NDA required to start the conversation.
            </p>
          </div>

          <div className="glass-surface p-8 md:p-10">
            {status === 'success' ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-[var(--accent)] mb-6">
                  <span className="text-[var(--accent)] text-[28px]" aria-hidden="true">✓</span>
                </div>
                <h3 className="font-[var(--font-heading)] text-[24px] font-semibold text-[var(--graphite)] mb-3">Inquiry received</h3>
                <p className="text-[15px] text-[var(--graphite-med)] leading-[1.6] max-w-[400px] mx-auto mb-8">
                  Our migration team will review your estate details and respond with a scoped proposal within 48 hours.
                </p>
                <button type="button" onClick={() => setStatus('idle')} className="btn-secondary">Submit another inquiry</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--graphite-med)] mb-2 block">Name <span className="text-[var(--accent)]">*</span></label>
                    <input id="name" type="text" required value={form.name} onChange={(e) => update('name', e.target.value)} disabled={status === 'submitting'} className="w-full bg-[var(--bone-deep)] border border-[var(--graphite-ghost)] text-[var(--graphite)] text-[15px] px-4 py-3 outline-none focus:border-[var(--accent)] transition-colors duration-200 placeholder:text-[var(--graphite-ghost)] disabled:opacity-50" placeholder="Jane Engineer" />
                  </div>
                  <div>
                    <label htmlFor="email" className="font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--graphite-med)] mb-2 block">Email <span className="text-[var(--accent)]">*</span></label>
                    <input id="email" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} disabled={status === 'submitting'} className="w-full bg-[var(--bone-deep)] border border-[var(--graphite-ghost)] text-[var(--graphite)] text-[15px] px-4 py-3 outline-none focus:border-[var(--accent)] transition-colors duration-200 placeholder:text-[var(--graphite-ghost)] disabled:opacity-50" placeholder="jane@company.com" />
                  </div>
                </div>
                <div>
                  <label htmlFor="company" className="font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--graphite-med)] mb-2 block">Company</label>
                  <input id="company" type="text" value={form.company} onChange={(e) => update('company', e.target.value)} disabled={status === 'submitting'} className="w-full bg-[var(--bone-deep)] border border-[var(--graphite-ghost)] text-[var(--graphite)] text-[15px] px-4 py-3 outline-none focus:border-[var(--accent)] transition-colors duration-200 placeholder:text-[var(--graphite-ghost)] disabled:opacity-50" placeholder="Acme Inc" />
                </div>
                <div>
                  <label htmlFor="repoUrl" className="font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--graphite-med)] mb-2 block">Repository URL</label>
                  <input id="repoUrl" type="url" value={form.repoUrl} onChange={(e) => update('repoUrl', e.target.value)} disabled={status === 'submitting'} className="w-full bg-[var(--bone-deep)] border border-[var(--graphite-ghost)] text-[var(--graphite)] text-[15px] px-4 py-3 outline-none focus:border-[var(--accent)] transition-colors duration-200 placeholder:text-[var(--graphite-ghost)] disabled:opacity-50" placeholder="https://github.com/org/repo" />
                </div>
                <div>
                  <label htmlFor="message" className="font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--graphite-med)] mb-2 block">Message</label>
                  <textarea id="message" rows={4} value={form.message} onChange={(e) => update('message', e.target.value)} disabled={status === 'submitting'} className="w-full bg-[var(--bone-deep)] border border-[var(--graphite-ghost)] text-[var(--graphite)] text-[15px] px-4 py-3 outline-none focus:border-[var(--accent)] transition-colors duration-200 placeholder:text-[var(--graphite-ghost)] disabled:opacity-50 resize-none" placeholder="What would you like to migrate?" />
                </div>
                {status === 'error' && <p className="font-mono text-[12px] text-red-400 bg-red-400/5 border border-red-400/30 px-4 py-3">✗ {errorMsg}</p>}
                <button type="submit" disabled={status === 'submitting'} className="btn-primary w-full justify-center disabled:opacity-50">{status === 'submitting' ? 'Sending...' : 'Send Inquiry →'}</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </ProductShell>
  )
}
