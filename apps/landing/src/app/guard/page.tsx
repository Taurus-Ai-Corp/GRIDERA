"use client"

import { useState } from 'react'
import ProductShell from '@/components/product-shell'
import ProductHero from '@/components/product-hero'
import ProductSection from '@/components/product-section'
import { GUARD_TIERS } from '@/lib/guard-tiers'

export default function GuardPage() {
  const [email, setEmail] = useState('')
  const [tier, setTier] = useState<'sandbox' | 'smb' | 'enterprise'>('sandbox')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ apiKey?: string; url?: string; error?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      if (tier === 'sandbox') {
        const res = await fetch('/api/guard/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Signup failed')
        setResult({ apiKey: data.apiKey })
      } else {
        const res = await fetch('/api/guard/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier, email, annual: false }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Checkout failed')
        window.location.href = data.url
      }
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : 'Failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProductShell>
      <ProductHero
        badge="PQC-SIGNED • EU AI ACT • SOC 2"
        eyebrow="GRIDERA|Guard"
        title={
          <>
            LLM Guardrails Your
            <br />
            <span className="gradient-text">Auditor Can Verify</span>
          </>
        }
        description="Every LLM call signed with ML-DSA-65. Every verdict anchored to Hedera HCS. EU AI Act Article 9, NIST AI RMF, and SOC 2 evidence generated automatically."
        cta={{ label: 'Start Free', href: '#tiers' }}
        secondary={{ label: 'View API', href: '#api' }}
      />

      <ProductSection eyebrow="One API, three rule packs" title="Guard in a Single Call" bg="bone-deep">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-surface p-6">
            <p className="font-mono text-[10px] text-[var(--graphite-med)] tracking-[0.1em] uppercase mb-3">Request</p>
            <pre className="text-[13px] text-[var(--graphite)] overflow-x-auto"><code>{`curl -X POST https://guard.gridera.net/v1/execute \\
  -H "X-API-Key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": "What is 2+2?",
    "context": "math question",
    "policy": "eu-ai-act-annex-iii"
  }'`}</code></pre>
          </div>
          <div className="glass-surface p-6">
            <p className="font-mono text-[10px] text-[var(--graphite-med)] tracking-[0.1em] uppercase mb-3">Response</p>
            <pre className="text-[12px] text-[var(--graphite)] overflow-x-auto"><code>{`{
  "verdict": "allow",
  "policy_version": "eu-ai-act-annex-iii@2026.05.12",
  "signature": {
    "algorithm": "ML-DSA-65",
    "value": "1f2a3b4c5d6e..."
  },
  "hcs_anchor": {
    "topic_id": "0.0.7294034",
    "sequence_number": 847291
  }
}`}</code></pre>
          </div>
        </div>
      </ProductSection>

      <ProductSection eyebrow="Built-in compliance packs" title="Jurisdiction Presets" bg="bone">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'EU AI Act',
              desc: 'Articles 9, 11, 14, 15. Risk management, documentation, human oversight, and accuracy obligations for high-risk AI systems.',
            },
            {
              name: 'NIST AI RMF',
              desc: 'Govern, Map, Measure, Manage functions. Map AI risks to organizational context and manage them through the lifecycle.',
            },
            {
              name: 'SOC 2',
              desc: 'CC6.1, CC7.1, CC8.1. Logical access, monitoring, and change management controls with tamper-evident attestation.',
            },
          ].map((pack) => (
            <div key={pack.name} className="border border-[var(--graphite-ghost)] p-6 bg-[var(--bone-deep)]">
              <p className="font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--accent)] mb-3">
                {pack.name}
              </p>
              <p className="text-[14px] text-[var(--graphite-med)] leading-[1.7]">{pack.desc}</p>
            </div>
          ))}
        </div>
      </ProductSection>

      <ProductSection id="tiers" eyebrow="Start free, scale as you grow" title="Pricing Tiers" bg="bone-deep">
        <p className="text-center text-[15px] text-[var(--graphite-med)] max-w-[560px] mx-auto mb-10">
          Three tiers. Cancel anytime. Sandbox includes 1,000 calls per month with no credit card.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {(Object.keys(GUARD_TIERS) as Array<keyof typeof GUARD_TIERS>).map((t) => {
            const plan = GUARD_TIERS[t]
            return (
              <div
                key={t}
                className={`p-6 border ${plan.popular ? 'border-[var(--accent)] bg-[rgba(0,204,170,0.04)]' : 'border-[var(--graphite-ghost)] bg-[var(--bone-deep)]'}`}
              >
                {plan.popular && (
                  <div className="font-mono text-[10px] font-medium tracking-[0.1em] uppercase text-[var(--accent)] mb-2">
                    Most Popular
                  </div>
                )}
                <h3 className="font-[var(--font-heading)] text-[20px] font-semibold text-[var(--graphite)] mb-1">
                  {plan.name}
                </h3>
                <p className="text-[13px] text-[var(--graphite-med)] mb-4">{plan.tagline}</p>
                <div className="font-mono text-[32px] font-medium text-[var(--graphite)] mb-4">{plan.priceLabel}</div>
                <ul className="space-y-2 text-[13px] text-[var(--graphite-med)] mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-[var(--accent)]">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setTier(t)}
                  className={`w-full h-10 text-sm font-semibold transition-colors ${tier === t ? 'bg-[var(--accent)] text-[#0B0E14]' : 'border border-[var(--graphite-ghost)] hover:border-[var(--accent)] text-[var(--graphite)]'}`}
                >
                  {tier === t ? 'Selected' : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        <div className="max-w-md mx-auto mt-12">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full h-12 px-4 text-sm bg-[var(--bone-deep)] border border-[var(--graphite-ghost)] text-[var(--graphite)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--graphite-ghost)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[var(--accent)] text-[#0B0E14] text-sm font-semibold hover:brightness-110 disabled:opacity-50"
            >
              {loading ? 'Working...' : tier === 'sandbox' ? 'Get Free API Key' : 'Start 14-day Trial'}
            </button>
          </form>
          {result?.apiKey && (
            <div className="mt-6 p-4 border border-[var(--accent)] bg-[var(--bone-deep)]">
              <div className="text-xs text-[var(--accent)] mb-2 font-mono">YOUR API KEY</div>
              <code className="text-xs text-[var(--graphite)] break-all">{result.apiKey}</code>
              <p className="text-xs text-[var(--graphite-med)] mt-2">Check your email for a copy.</p>
            </div>
          )}
          {result?.error && (
            <div className="mt-6 p-4 border border-red-400/30 bg-red-400/5">
              <div className="text-xs text-red-400 mb-1 font-mono">ERROR</div>
              <p className="text-xs text-[var(--graphite)]">{result.error}</p>
            </div>
          )}
        </div>
      </ProductSection>
    </ProductShell>
  )
}
