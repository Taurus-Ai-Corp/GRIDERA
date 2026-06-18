'use client'

import { useState } from 'react'
import Nav from '@/components/nav'
import Footer from '@/components/footer'
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
        // Free tier - direct signup
        const res = await fetch('/api/guard/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Signup failed')
        setResult({ apiKey: data.apiKey })
      } else {
        // Paid tier - Stripe Checkout
        const res = await fetch('/api/guard/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier, email, annual: false }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Checkout failed')
        // Redirect to Stripe
        window.location.href = data.url
      }
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : 'Failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0]">
      <Nav />

      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      {/* HERO V2 PIVOT: "defensible posture while the rules settle" - replaces the prior
          "survive quantum" / "EU AI Act compliance" copy. See LANDING_HERO_V2_2026-06-11.md. */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-3 py-1 mb-6 text-xs font-mono tracking-wider text-[#00ff88] border border-[#00ff88]/30 rounded-full bg-[#00ff88]/5">
            PQC-SIGNED • EU AI ACT-READY • AUDIT-DEFENSIBLE
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            LLM guardrails
            <br />
            your <span className="text-[#00ff88]">auditor</span> can verify
          </h1>
          <p className="text-xl text-[#888] max-w-2xl mx-auto mb-4">
            Every LLM call signed with ML-DSA-65. Every signature anchored to Hedera HCS.
            <br />
            EU AI Act Article 9, NIST AI RMF, and SOC 2 evidence - generated automatically.
          </p>
          <p className="text-sm text-[#666] max-w-2xl mx-auto mb-8 italic">
            The EU AI Act is being enforced. The rules are still settling. Either way, your auditor will ask for signed evidence. Ship it now.
          </p>

          {/* ─── Code Sample ──────────────────────────────────────────── */}
          <div className="max-w-3xl mx-auto text-left bg-[#151515] border border-[#262626] rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#262626] bg-[#0d0d0d]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <span className="ml-2 text-xs text-[#666] font-mono">terminal</span>
            </div>
            <pre className="p-4 text-sm text-[#e0e0e0] overflow-x-auto"><code>{`curl -X POST https://guard.gridera.net/guard/v1/execute \\
  -H "X-API-Key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": "What is 2+2?",
    "context": "math question",
    "policy": "eu-ai-act-annex-iii"
  }'`}</code></pre>
          </div>

          {/* ─── Response Envelope (NEW in V2) ──────────────────────────── */}
          <div className="max-w-3xl mx-auto text-left bg-[#151515] border border-[#262626] rounded-lg overflow-hidden mt-6">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#262626] bg-[#0d0d0d]">
              <span className="ml-2 text-xs text-[#666] font-mono">response.json</span>
            </div>
            <pre className="p-4 text-xs text-[#e0e0e0] overflow-x-auto"><code>{`{
  "verdict": "allow",
  "policy_version": "eu-ai-act-annex-iii@2026.05.12",
  "input_hash": "7c4a8d09ca3762af61e59520943dc26494f8941b",
  "output_hash": "9b71d224bd62f3785d96a46c3e0a8b9c1c2d3e4f",
  "signature": {
    "algorithm": "ML-DSA-65",
    "value": "1f2a3b4c5d6e7f8091a2b3c4d5e6f708...",
    "public_key_fingerprint": "ab:cd:ef:01:23:45:67:89:ab:cd:ef:01:23:45:67:89:ab:cd:ef:01"
  },
  "hcs_anchor": {
    "topic_id": "0.0.7294034",
    "sequence_number": 847291,
    "consensus_timestamp": "2026-06-11T14:23:18.442Z"
  }
}`}</code></pre>
          </div>

          {/* ─── Pillars (NEW in V2) ───────────────────────────────────── */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16 text-left">
            <div>
              <div className="text-xs font-mono text-[#00ff88] mb-2">PQC SIGNATURES</div>
              <div className="text-sm text-[#888]">
                Every verdict signed with ML-DSA-65 (NIST FIPS 204). The same algorithm your auditor will require post-2030.
              </div>
            </div>
            <div>
              <div className="text-xs font-mono text-[#00ff88] mb-2">EU AI ACT RULE PACKS</div>
              <div className="text-sm text-[#888]">
                Article 6 high-risk classifier. Article 9 conformity. Article 50 transparency. Updated when the Commission updates.
              </div>
            </div>
            <div>
              <div className="text-xs font-mono text-[#00ff88] mb-2">HEDERA HCS ANCHORING</div>
              <div className="text-sm text-[#888]">
                Signature hash anchored to a public ledger. Your auditor can verify the timestamp without trusting you.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tier comparison + signup form ────────────────────────── */}
      <section className="py-16 px-6 border-t border-[#262626]">
        <div className="max-w-6xl mx-auto">
          {/* PIVOT line: explicit acknowledgement of the May 2026 snooze */}
          <p className="text-sm text-[#888] max-w-2xl mx-auto mb-8 italic text-center">
            Three tiers. Cancel anytime. EU AI Act enforcement is settling - ship evidence now, your auditor will thank you.
          </p>

          {/* Existing tier grid + signup form follow below - unchanged */}
          <div className="grid md:grid-cols-3 gap-6">
            {(Object.keys(GUARD_TIERS) as Array<keyof typeof GUARD_TIERS>).map((t) => {
              const plan = GUARD_TIERS[t]
              return (
                <div
                  key={t}
                  className={`p-6 rounded-lg border ${
                    plan.popular ? 'border-[#00ff88] bg-[#00ff88]/5' : 'border-[#262626] bg-[#0d0d0d]'
                  }`}
                >
                  {plan.popular && (
                    <div className="text-xs font-mono text-[#00ff88] mb-2">MOST POPULAR</div>
                  )}
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-[#888] mb-4">{plan.tagline}</p>
                  <div className="text-3xl font-bold mb-4">{plan.priceLabel}</div>
                  <ul className="space-y-2 text-sm text-[#888] mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-[#00ff88]">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setTier(t)}
                    className={`w-full h-10 text-sm font-semibold rounded-md transition-colors ${
                      tier === t
                        ? 'bg-[#00ff88] text-[#0a0a0a]'
                        : 'bg-[#1a1a1a] hover:bg-[#262626]'
                    }`}
                  >
                    {tier === t ? 'Selected' : plan.cta}
                  </button>
                </div>
              )
            })}
          </div>

          {/* ─── Signup Form ─────────────────────────────────────── */}
          <div className="max-w-md mx-auto mt-12">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full h-12 px-4 text-sm bg-[#0d0d0d] border border-[#262626] rounded-md text-[#e0e0e0] focus:outline-none focus:border-[#00ff88]"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#00ff88] text-[#0a0a0a] text-sm font-semibold rounded-md hover:bg-[#00ff88]/90 disabled:opacity-50"
              >
                {loading ? 'Working...' : tier === 'sandbox' ? 'Get Free API Key' : 'Start 14-day Trial'}
              </button>
              <p className="text-xs text-[#666] text-center">
                1,000 verifications/month. No credit card. Real API key issued in 200ms.
              </p>
            </form>

            {result?.apiKey && (
              <div className="mt-6 p-4 bg-[#0d0d0d] border border-[#00ff88]/30 rounded-md">
                <div className="text-xs text-[#00ff88] mb-2 font-mono">YOUR API KEY</div>
                <code className="text-xs text-[#e0e0e0] break-all">{result.apiKey}</code>
                <p className="text-xs text-[#666] mt-2">Check your email for a copy.</p>
              </div>
            )}

            {result?.error && (
              <div className="mt-6 p-4 bg-[#0d0d0d] border border-[#ff5f56]/30 rounded-md">
                <div className="text-xs text-[#ff5f56] mb-1 font-mono">ERROR</div>
                <p className="text-xs text-[#e0e0e0]">{result.error}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
