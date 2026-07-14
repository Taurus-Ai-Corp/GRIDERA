'use client'

import { useState } from 'react'

export default function CtaSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) return
    setStatus('sending')
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'landing-cta' }),
      })
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section
      id="start"
      className="py-24"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-[640px] mx-auto text-center">
          {/* Label */}
          <p className="reveal font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--accent)] mb-5">
            /// NEXT STEP
          </p>

          {/* Heading */}
          <h2
            className="reveal font-[var(--font-heading)] font-bold leading-[1.1] mb-5"
            style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}
          >
            Get Your Full
            <br />
            <span className="gradient-text">Compliance Report</span>
          </h2>

          {/* Description */}
          <p className="reveal text-[16px] leading-[1.75] text-[var(--graphite-med)] mb-10" style={{ transitionDelay: '100ms' }}>
            The free PQC scan surfaces your exposure. The full report includes remediation
            code, agent-driven migration planning, NIST FIPS&nbsp;203/204 compliance mapping,
            and a Hedera-anchored audit trail — free for 14&nbsp;days.
          </p>

          {/* Email form */}
          {status === 'done' ? (
            <div className="border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-6 py-5 font-mono text-[13px] text-[var(--accent)] mb-6">
              ✓ Check your inbox — full report link incoming.
            </div>
          ) : (
            <>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 mb-3"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  disabled={status === 'sending'}
                  className="flex-1 bg-[var(--bone-deep)] border border-[var(--graphite-ghost)] text-[var(--graphite)] font-mono text-[14px] px-4 py-3 outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--graphite-ghost)] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="btn-primary whitespace-nowrap disabled:opacity-40"
                >
                  {status === 'sending' ? 'Sending…' : 'SIGN UP FREE →'}
                </button>
              </form>
              {status === 'error' && (
                <p className="font-mono text-[11px] text-red-400 mb-2">
                  Failed to submit — please try again.
                </p>
              )}
              <p className="font-mono text-[11px] text-[var(--graphite-med)] opacity-60 mb-8">
                No credit card required. 14-day free trial.
              </p>
            </>
          )}

          {/* Direct comply link */}
          <div className="pt-6 border-t border-[var(--graphite-ghost)]">
            <a
              href="https://eu.q-grid.net/comply"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[12px] font-medium tracking-[0.1em] uppercase text-[var(--graphite-med)] hover:text-[var(--accent)] transition-colors"
            >
              GO TO GRIDERA|Comply →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
