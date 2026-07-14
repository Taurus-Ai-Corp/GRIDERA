'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/nav'
import type { Algorithm, QrsScore, Recommendation } from '@taurus/pqc-engine'

interface CertificateInfo {
  subject: string
  issuer: string
  validFrom: string
  validTo: string
  daysUntilExpiry: number
  serialNumber: string
  fingerprint: string
}

interface PqcStamp {
  hash: string
  signature: string
  algorithm: string
  timestamp: number
}

interface ScanResult {
  scanId: string
  domain: string
  qrsScore: QrsScore
  algorithms: Algorithm[]
  certificates: CertificateInfo[]
  recommendations: Recommendation[]
  tlsVersion: string
  scannedAt: string
  error?: string
  pqcStamp: PqcStamp
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const riskColor: Record<QrsScore['riskLevel'], string> = {
  critical: 'text-red-500',
  high: 'text-amber-500',
  moderate: 'text-yellow-400',
  low: 'text-[var(--accent)]',
}

const riskBorder: Record<QrsScore['riskLevel'], string> = {
  critical: 'border-red-500/30',
  high: 'border-amber-500/30',
  moderate: 'border-yellow-400/30',
  low: 'border-[var(--accent)]/30',
}

const riskBg: Record<QrsScore['riskLevel'], string> = {
  critical: 'bg-red-500/10',
  high: 'bg-amber-500/10',
  moderate: 'bg-yellow-400/10',
  low: 'bg-[var(--accent)]/10',
}

const severityColor: Record<Algorithm['severity'], string> = {
  critical: 'text-red-500',
  high: 'text-amber-500',
  moderate: 'text-yellow-400',
  low: 'text-[var(--accent)]',
  none: 'text-[var(--graphite-med)]',
}

const priorityBadge: Record<Recommendation['priority'], string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  medium: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30',
  low: 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30',
}

// ── Score Gauge ───────────────────────────────────────────────────────────────

function ScoreGauge({ score, riskLevel }: { score: number; riskLevel: QrsScore['riskLevel'] }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    let frame = 0
    const duration = 900 // ms
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * score))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [score])

  return (
    <div
      className={`border ${riskBorder[riskLevel]} ${riskBg[riskLevel]} p-8 text-center`}
    >
      <div
        className={`font-[var(--font-heading)] font-bold leading-none ${riskColor[riskLevel]}`}
        style={{ fontSize: '96px' }}
      >
        {displayed}
      </div>
      <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--graphite-med)]">
        QRS Score
      </div>
      <div className={`mt-3 font-mono text-[13px] uppercase tracking-[0.1em] font-medium ${riskColor[riskLevel]}`}>
        {riskLevel} risk
      </div>
      <div className="mt-4 w-full bg-[var(--graphite-ghost)] h-[3px]">
        <div
          className={`h-full transition-all duration-1000 ease-out ${riskColor[riskLevel].replace('text-', 'bg-')}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ScanResultsPage() {
  const router = useRouter()
  const [result, setResult] = useState<ScanResult | null>(null)
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  useEffect(() => {
    // Dual-read during key migration: in-flight scans stored under the legacy key
    // must survive a deploy mid-session.
    const raw = sessionStorage.getItem('gridera_scan_result') ?? sessionStorage.getItem('qgrid_scan_result')
    if (!raw) {
      router.replace('/scan')
      return
    }
    try {
      setResult(JSON.parse(raw) as ScanResult)
    } catch {
      router.replace('/scan')
    }
  }, [router])

  const [cbomStatus, setCbomStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  async function handleCbomDownload() {
    if (!result) return
    setCbomStatus('loading')
    try {
      const res = await fetch('/api/cbom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: result.domain }),
      })
      if (!res.ok) throw new Error('CBOM generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${result.domain}-cbom-cyclonedx-1.6.json`
      a.click()
      URL.revokeObjectURL(url)
      setCbomStatus('idle')
    } catch {
      setCbomStatus('error')
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) return
    setEmailStatus('sending')
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'scan-results-cta' }),
      })
      setEmailStatus('done')
    } catch {
      setEmailStatus('error')
    }
  }

  if (!result) {
    return (
      <>
        <Nav />
        <main className="min-h-screen flex items-center justify-center">
          <p className="font-mono text-[var(--graphite-med)] text-sm">Loading results...</p>
        </main>
      </>
    )
  }

  const { domain, qrsScore, algorithms, certificates, recommendations, tlsVersion, scannedAt, pqcStamp, scanId, error: scanError } = result

  return (
    <>
      <Nav />
      <main className="min-h-screen px-6 pt-28 pb-20">
        {/* Background grid */}
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(var(--graphite-ghost) 1px, transparent 1px), linear-gradient(90deg, var(--graphite-ghost) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-[900px] mx-auto">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--graphite-med)] tracking-[0.08em] uppercase mb-2">
                <a href="/scan" className="hover:text-[var(--accent)] transition-colors">← New Scan</a>
                <span>/</span>
                <span>Results</span>
              </div>
              <h1
                className="font-[var(--font-heading)] font-bold tracking-[-0.02em]"
                style={{ fontSize: 'clamp(22px, 3vw, 34px)' }}
              >
                {domain}
              </h1>
              <div className="flex items-center gap-4 mt-2 font-mono text-[11px] text-[var(--graphite-med)]">
                <span>TLS: <span className="text-[var(--graphite)]">{tlsVersion}</span></span>
                <span>Scanned: <span className="text-[var(--graphite)]">{new Date(scannedAt).toLocaleString()}</span></span>
                <span className="font-mono text-[10px] text-[var(--graphite-ghost)]">ID: {scanId}</span>
              </div>
            </div>
            <a
              href={`/comply?scan=${encodeURIComponent(scanId)}`}
              className="btn-primary shrink-0 self-start"
            >
              Get Full QREP →
            </a>
          </div>

          {/* ── Scan error notice ── */}
          {scanError && (
            <div className="mb-6 border border-amber-500/30 bg-amber-500/5 px-4 py-3 font-mono text-[12px] text-amber-400">
              ⚠ Partial scan: {scanError}. Results may be incomplete.
            </div>
          )}

          {/* ── Top row: Score + Categories ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--graphite-ghost)] border border-[var(--graphite-ghost)] mb-px">
            {/* Score card */}
            <div className="md:col-span-1 bg-[var(--bone-deep)]">
              <ScoreGauge score={qrsScore.overall} riskLevel={qrsScore.riskLevel} />
            </div>

            {/* Category scores */}
            <div className="md:col-span-2 bg-[var(--bone-deep)] p-6">
              <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase mb-5">
                Score Breakdown
              </p>
              <div className="space-y-4">
                {(
                  [
                    ['Algorithms', qrsScore.categories.algorithms],
                    ['Key Size', qrsScore.categories.keySize],
                    ['PQC Readiness', qrsScore.categories.pqcReadiness],
                    ['TLS Compliance', qrsScore.categories.compliance],
                  ] as [string, number][]
                ).map(([label, val]) => (
                  <div key={label}>
                    <div className="flex justify-between font-mono text-[12px] mb-1">
                      <span className="text-[var(--graphite-med)]">{label}</span>
                      <span className="text-[var(--graphite)]">{val}</span>
                    </div>
                    <div className="w-full bg-[var(--graphite-ghost)] h-[2px]">
                      <div
                        className="h-full bg-[var(--accent)] transition-all duration-700 ease-out"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-[var(--graphite-ghost)] flex items-center justify-between font-mono text-[12px]">
                <span className="text-[var(--graphite-med)]">Migration Priority</span>
                <span
                  className={`uppercase tracking-wider font-medium ${
                    qrsScore.migrationPriority === 'immediate'
                      ? 'text-red-400'
                      : qrsScore.migrationPriority === 'high'
                        ? 'text-amber-400'
                        : qrsScore.migrationPriority === 'medium'
                          ? 'text-yellow-400'
                          : 'text-[var(--accent)]'
                  }`}
                >
                  {qrsScore.migrationPriority}
                </span>
              </div>
            </div>
          </div>

          {/* ── Algorithm table ── */}
          <div className="border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] mb-px">
            <div className="px-6 py-4 border-b border-[var(--graphite-ghost)]">
              <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase">
                Detected Algorithms
              </p>
            </div>
            {algorithms.length === 0 ? (
              <div className="px-6 py-8 text-center font-mono text-[13px] text-[var(--graphite-med)]">
                No algorithms detected — domain may not support HTTPS on port 443.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--graphite-ghost)]">
                      {['Algorithm', 'Key Size', 'Grade', 'Vulnerability'].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left font-mono text-[10px] text-[var(--graphite-med)] tracking-[0.1em] uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {algorithms.map((algo, i) => (
                      <tr
                        key={i}
                        className="border-b border-[var(--graphite-ghost)] last:border-0 hover:bg-[var(--accent)]/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-[13px] text-[var(--graphite)]">{algo.name}</td>
                        <td className="px-6 py-4 font-mono text-[13px] text-[var(--graphite-med)]">{algo.keySize} bit</td>
                        <td className={`px-6 py-4 font-mono text-[12px] font-medium ${severityColor[algo.severity]}`}>
                          {algo.grade}
                        </td>
                        <td className="px-6 py-4">
                          {algo.vulnerable ? (
                            <span className="font-mono text-[11px] text-red-400 border border-red-400/30 bg-red-400/5 px-2 py-[3px]">
                              VULNERABLE
                            </span>
                          ) : (
                            <span className="font-mono text-[11px] text-[var(--accent)] border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-2 py-[3px]">
                              SAFE
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Certificates ── */}
          {certificates.length > 0 && (
            <div className="border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] mb-px">
              <div className="px-6 py-4 border-b border-[var(--graphite-ghost)]">
                <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase">
                  Certificate Chain ({certificates.length})
                </p>
              </div>
              <div className="divide-y divide-[var(--graphite-ghost)]">
                {certificates.slice(0, 3).map((cert, i) => (
                  <div key={i} className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Subject</p>
                      <p className="font-mono text-[12px] text-[var(--graphite)] truncate">{cert.subject}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Issuer</p>
                      <p className="font-mono text-[12px] text-[var(--graphite)] truncate">{cert.issuer}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Expires</p>
                      <p
                        className={`font-mono text-[12px] ${
                          cert.daysUntilExpiry < 30
                            ? 'text-red-400'
                            : cert.daysUntilExpiry < 90
                              ? 'text-amber-400'
                              : 'text-[var(--graphite)]'
                        }`}
                      >
                        {cert.daysUntilExpiry > 0 ? `${cert.daysUntilExpiry}d` : 'Expired'}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Fingerprint</p>
                      <p className="font-mono text-[10px] text-[var(--graphite-ghost)] truncate">{cert.fingerprint.slice(0, 24)}…</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Recommendations ── */}
          {recommendations.length > 0 && (
            <div className="border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] mb-px">
              <div className="px-6 py-4 border-b border-[var(--graphite-ghost)]">
                <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase">
                  Recommendations ({recommendations.length})
                </p>
              </div>
              <div className="divide-y divide-[var(--graphite-ghost)]">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="px-6 py-5 flex items-start gap-4">
                    <span
                      className={`shrink-0 mt-[2px] font-mono text-[10px] font-medium border px-2 py-[3px] uppercase tracking-wider ${priorityBadge[rec.priority]}`}
                    >
                      {rec.priority}
                    </span>
                    <div>
                      <p className="font-mono text-[13px] text-[var(--graphite)] font-medium mb-1">{rec.title}</p>
                      <p className="text-[13px] text-[var(--graphite-med)] leading-[1.6]">{rec.description}</p>
                      {rec.framework && (
                        <p className="mt-1 font-mono text-[11px] text-[var(--graphite-ghost)]">
                          Framework: {rec.framework}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Pricing tiers ── */}
          <div className="border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] mb-px">
            <div className="px-6 py-4 border-b border-[var(--graphite-ghost)]">
              <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase">
                PQC Assessment Services
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--graphite-ghost)]">
              {/* Starter */}
              <div className="bg-[var(--bone-deep)] px-6 py-6">
                <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--graphite-med)] mb-2">Starter</p>
                <p className="font-[var(--font-heading)] text-[28px] font-bold text-[var(--graphite)] leading-none mb-1">
                  €399<span className="font-mono text-[13px] text-[var(--graphite-med)] font-normal"> / mo</span>
                </p>
                <p className="font-mono text-[12px] text-[var(--graphite-med)] mb-5">Single framework assessment</p>
                <ul className="space-y-2 mb-6">
                  {['1 user seat', 'EU AI Act assessment', 'Basic dashboard', '5 engines active', 'Email support'].map((f) => (
                    <li key={f} className="flex items-center gap-2 font-mono text-[12px] text-[var(--graphite-med)]">
                      <span className="text-[var(--accent)] text-[10px]">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://eu.q-grid.net/sign-up"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-[11px] py-[8px]"
                >
                  Get Started →
                </a>
              </div>

              {/* Growth */}
              <div className="bg-[rgba(0,204,170,0.03)] px-6 py-6 border-x border-[var(--accent)]/20">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--accent)]">Growth</p>
                  <span className="font-mono text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 px-2 py-[2px]">
                    RECOMMENDED
                  </span>
                </div>
                <p className="font-[var(--font-heading)] text-[28px] font-bold text-[var(--accent)] leading-none mb-1">
                  €899<span className="font-mono text-[13px] text-[var(--graphite-med)] font-normal"> / mo</span>
                </p>
                <p className="font-mono text-[12px] text-[var(--graphite-med)] mb-5">Multi-framework compliance</p>
                <ul className="space-y-2 mb-6">
                  {['5 user seats', 'All framework assessments', 'Quantum key management', '20 engines active', 'Blockchain audit trail', 'Priority support'].map((f) => (
                    <li key={f} className="flex items-center gap-2 font-mono text-[12px] text-[var(--graphite-med)]">
                      <span className="text-[var(--accent)] text-[10px]">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://eu.q-grid.net/sign-up"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-[11px] py-[10px]"
                >
                  Get Started →
                </a>
              </div>

              {/* Enterprise */}
              <div className="bg-[var(--bone-deep)] px-6 py-6">
                <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--graphite-med)] mb-2">Enterprise</p>
                <p className="font-[var(--font-heading)] text-[22px] font-bold text-[var(--graphite)] leading-none mb-1">
                  Custom
                </p>
                <p className="font-mono text-[12px] text-[var(--graphite-med)] mb-5">Full platform access</p>
                <ul className="space-y-2 mb-6">
                  {['Unlimited seats', 'Custom frameworks', 'All engines + agents', 'Dedicated CSM', 'SLA guarantee', 'SSO / SAML'].map((f) => (
                    <li key={f} className="flex items-center gap-2 font-mono text-[12px] text-[var(--graphite-med)]">
                      <span className="text-[var(--accent)] text-[10px]">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:admin@taurusai.io?subject=Enterprise%20PQC%20Assessment"
                  className="btn-secondary text-[11px] py-[8px]"
                >
                  Contact Sales →
                </a>
              </div>
            </div>
          </div>

          {/* ── PQC Verification badge ── */}
          <div className="border border-[var(--accent)]/20 bg-[var(--accent)]/[0.04] mb-px">
            <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 border border-[var(--accent)]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[var(--accent)] text-[14px]">✦</span>
                </div>
                <div>
                  <p className="font-mono text-[12px] text-[var(--accent)] font-medium mb-1">
                    ML-DSA-65 Signed — Cryptographically Verified
                  </p>
                  <p className="font-mono text-[11px] text-[var(--graphite-med)] break-all">
                    {pqcStamp.hash}
                  </p>
                  <p className="font-mono text-[10px] text-[var(--graphite-ghost)] mt-1 break-all">
                    sig: {pqcStamp.signature}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-[10px] text-[var(--graphite-ghost)] uppercase tracking-wider">Hedera Anchor</p>
                <p className="font-mono text-[11px] text-amber-500/70 mt-1">Pending</p>
              </div>
            </div>
          </div>

          {/* ── CTA section ── */}
          <div className="border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] mt-8 p-8">
            <div className="max-w-[520px] mx-auto text-center mb-10 pb-10 border-b border-[var(--graphite-ghost)]">
              <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase mb-3">
                Cryptographic Bill of Materials
              </p>
              <p className="text-[14px] text-[var(--graphite-med)] leading-[1.7] mb-5">
                Export this scan as a CycloneDX 1.6 CBOM — ML-DSA-65 signed, with a detached
                signature envelope you can verify independently.
              </p>
              <button
                onClick={handleCbomDownload}
                disabled={cbomStatus === 'loading' || Boolean(scanError)}
                className="btn-secondary justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {cbomStatus === 'loading' ? 'Re-scanning & signing…' : 'Download CBOM (CycloneDX 1.6) ↓'}
              </button>
              {cbomStatus === 'error' && (
                <p className="font-mono text-[11px] text-red-400 mt-3">
                  CBOM generation failed — please try again.
                </p>
              )}
            </div>

            <div className="max-w-[520px] mx-auto text-center">
              <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase mb-3">
                Next Step
              </p>
              <h2
                className="font-[var(--font-heading)] font-bold tracking-[-0.02em] mb-3"
                style={{ fontSize: 'clamp(22px, 3vw, 32px)' }}
              >
                Get Your Full Compliance Report
              </h2>
              <p className="text-[15px] text-[var(--graphite-med)] leading-[1.7] mb-6">
                This free scan shows your surface-level exposure. The full report includes remediation
                code, agent-driven migration planning, and NIST FIPS 203/204 compliance mapping — free
                for 14 days.
              </p>

              {emailStatus === 'done' ? (
                <div className="border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-6 py-4 font-mono text-[13px] text-[var(--accent)]">
                  ✓ Check your inbox — full report link incoming.
                </div>
              ) : (
                <>
                  <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 mb-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      disabled={emailStatus === 'sending'}
                      className="flex-1 bg-[var(--bone-deep)] border border-[var(--graphite-ghost)] text-[var(--graphite)] font-mono text-[14px] px-4 py-3 outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--graphite-ghost)] disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={emailStatus === 'sending'}
                      className="btn-primary whitespace-nowrap disabled:opacity-40"
                    >
                      {emailStatus === 'sending' ? 'Sending…' : 'Sign Up Free →'}
                    </button>
                  </form>
                  {emailStatus === 'error' && (
                    <p className="font-mono text-[11px] text-red-400 mb-2">Failed to submit — please try again.</p>
                  )}
                  <p className="font-mono text-[11px] text-[var(--graphite-med)] opacity-60">
                    No credit card required. 14-day free trial.
                  </p>
                </>
              )}

              <div className="mt-6 pt-6 border-t border-[var(--graphite-ghost)]">
                <a
                  href={`https://eu.q-grid.net/sign-up?domain=${encodeURIComponent(domain)}&qrs=${qrsScore.overall}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-center justify-center w-full"
                >
                  Go to GRIDERA|Comply →
                </a>
              </div>
            </div>
          </div>

          {/* ── Full 40-page report CTA ── */}
          <div className="border border-[var(--accent)]/20 bg-[var(--accent)]/[0.04] mt-8 p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--accent)] mb-2">
                  <span className="block w-5 h-px bg-[var(--accent)]" aria-hidden="true" />
                  Full Report
                </div>
                <h2
                  className="font-[var(--font-heading)] font-bold tracking-[-0.02em] mb-2"
                  style={{ fontSize: 'clamp(20px, 2.5vw, 28px)' }}
                >
                  Get Full 40-Page Report — $6,750
                </h2>
                <p className="text-[14px] text-[var(--graphite-med)] leading-[1.7]">
                  Comprehensive PQC vulnerability assessment with methodology, risk matrix, certificate
                  analysis, algorithm inventory, remediation roadmap, and EU regulatory mapping
                  (AI Act, GDPR, DORA, NIS2, ENISA PQC). ML-DSA-65 signed.
                </p>
              </div>
              <a
                href={`/scan/report?scanId=${encodeURIComponent(scanId)}`}
                className="btn-primary shrink-0 whitespace-nowrap"
              >
                Purchase Full Report →
              </a>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
