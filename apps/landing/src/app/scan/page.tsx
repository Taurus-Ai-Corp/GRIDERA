"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProductShell from '@/components/product-shell'

export default function ScanPage() {
  const router = useRouter()
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dots, setDots] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!domain.trim()) return
    setLoading(true)
    setError('')
    let dotCount = 0
    const interval = setInterval(() => {
      dotCount = (dotCount + 1) % 4
      setDots('.'.repeat(dotCount))
    }, 400)

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Scan failed. Please try again.')
      sessionStorage.setItem('qgrid_scan_result', JSON.stringify(data))
      clearInterval(interval)
      router.push('/scan/results')
    } catch (err) {
      clearInterval(interval)
      setDots('')
      setError(err instanceof Error ? err.message : 'Scan failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <ProductShell>
      <main className="min-h-[100dvh] flex flex-col items-center justify-center px-6 pt-24 pb-20">
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(var(--graphite-ghost) 1px, transparent 1px), linear-gradient(90deg, var(--graphite-ghost) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-[600px] text-center">
          <div className="inline-flex items-center gap-3 font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--accent)] mb-6 px-4 py-[6px] border border-[var(--accent)]">
            <span className="block w-5 h-px bg-[var(--accent)]" aria-hidden="true" />
            Free PQC Assessment
          </div>

          <h1
            className="font-[var(--font-heading)] font-bold leading-[1.08] tracking-[-0.02em] mb-4"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
          >
            Scan Your Domain for
            <br />
            <span className="gradient-text">Quantum Vulnerabilities</span>
          </h1>

          <p className="text-[17px] text-[var(--graphite-med)] leading-[1.7] mb-10 max-w-[480px] mx-auto">
            Enter any domain to get a free PQC readiness assessment. Results are{' '}
            <span className="font-mono text-[var(--accent)] text-[13px]">ML-DSA-65</span> signed and
            verifiable.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              disabled={loading}
              autoFocus
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              className="flex-1 bg-[var(--bone-deep)] border border-[var(--graphite-ghost)] text-[var(--graphite)] font-mono text-[15px] px-5 py-4 outline-none focus:border-[var(--accent)] transition-colors duration-200 placeholder:text-[var(--graphite-ghost)] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !domain.trim()}
              className="btn-primary whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? <span className="font-mono text-[13px]">Scanning{dots}</span> : <>Scan Now<span aria-hidden="true">→</span></>}
            </button>
          </form>

          {loading && (
            <p className="font-mono text-[12px] text-[var(--graphite-med)] tracking-[0.06em] uppercase mb-4">
              <span className="inline-block w-[6px] h-[6px] rounded-full bg-[var(--accent)] mr-2 dot-pulse align-middle" />
              Scanning SSL certificates{dots}
            </p>
          )}

          {error && (
            <p className="font-mono text-[12px] text-red-400 border border-red-400/30 bg-red-400/5 px-4 py-3 mb-4 text-left">
              ✗ {error}
            </p>
          )}

          <p className="font-mono text-[11px] text-[var(--graphite-med)] tracking-[0.04em] opacity-60">
            No signup required. Results are cryptographically verified.
          </p>

          <div className="mt-16 border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] p-6 text-left">
            <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase mb-4">What we check</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'TLS certificate algorithms',
                'Key size & strength',
                'PQC readiness score',
                'TLS protocol version',
                'Certificate chain depth',
                'NIST FIPS 203/204 gap',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 font-mono text-[12px] text-[var(--graphite-med)]">
                  <span className="text-[var(--accent)]">›</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </ProductShell>
  )
}
