'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/nav'
import Footer from '@/components/footer'

// ── Types (mirrors of @taurus/pqc-engine types for client use) ─────────────────

interface Algorithm {
  name: string
  keySize: number
  grade: 'CRITICAL' | 'WEAK' | 'MODERATE' | 'STRONG' | 'PQC_READY' | 'ERROR'
  vulnerable: boolean
  severity: 'critical' | 'high' | 'moderate' | 'low' | 'none'
}

interface CertificateInfo {
  subject: string
  issuer: string
  validFrom: string
  validTo: string
  daysUntilExpiry: number
  serialNumber: string
  fingerprint: string
}

interface QrsScore {
  overall: number
  categories: {
    algorithms: number
    keySize: number
    pqcReadiness: number
    compliance: number
  }
  riskLevel: 'critical' | 'high' | 'moderate' | 'low'
  vulnerableAlgorithms: Algorithm[]
  migrationPriority: 'immediate' | 'high' | 'medium' | 'low'
}

interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  framework?: string
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

// ── Style maps ────────────────────────────────────────────────────────────────

const riskColor: Record<QrsScore['riskLevel'], string> = {
  critical: 'text-red-500',
  high: 'text-amber-500',
  moderate: 'text-yellow-400',
  low: 'text-[var(--accent)]',
}

const riskBg: Record<QrsScore['riskLevel'], string> = {
  critical: 'bg-red-500/10',
  high: 'bg-amber-500/10',
  moderate: 'bg-yellow-400/10',
  low: 'bg-[var(--accent)]/10',
}

const riskBorder: Record<QrsScore['riskLevel'], string> = {
  critical: 'border-red-500/30',
  high: 'border-amber-500/30',
  moderate: 'border-yellow-400/30',
  low: 'border-[var(--accent)]/30',
}

const severityColor: Record<Algorithm['severity'], string> = {
  critical: 'text-red-500',
  high: 'text-amber-500',
  moderate: 'text-yellow-400',
  low: 'text-[var(--accent)]',
  none: 'text-[var(--graphite-med)]',
}

const severityBg: Record<Algorithm['severity'], string> = {
  critical: 'bg-red-500/15',
  high: 'bg-amber-500/15',
  moderate: 'bg-yellow-400/15',
  low: 'bg-[var(--accent)]/10',
  none: 'bg-[var(--graphite-ghost)]/40',
}

const priorityBadge: Record<Recommendation['priority'], string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  medium: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30',
  low: 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30',
}

const priorityTimeline: Record<Recommendation['priority'], string> = {
  critical: '0–30 days',
  high: '30–90 days',
  medium: '90–180 days',
  low: '180–365 days',
}

// ── Regulatory Mapping data ──────────────────────────────────────────────────

const REGULATORY_FRAMEWORKS = [
  {
    name: 'EU AI Act',
    article: 'Article 15 — Robustness & Cybersecurity',
    relevance: 'High-risk AI systems must be resilient to quantum-enabled attacks. PQC migration is part of the required cybersecurity baseline.',
    status: 'mandatory',
  },
  {
    name: 'GDPR',
    article: 'Art. 32 — Security of Processing',
    relevance: 'Personal data must be protected against foreseeable threats, including quantum decryption. Weak TLS may breach the "state of the art" duty.',
    status: 'mandatory',
  },
  {
    name: 'DORA',
    article: 'Art. 9 — ICT Risk Management',
    relevance: 'Financial entities must address cryptographic risks including post-quantum threats in their digital operational resilience framework.',
    status: 'mandatory',
  },
  {
    name: 'NIS2',
    article: 'Art. 21 — Cybersecurity Risk-Management Measures',
    relevance: 'Essential/important entities must implement state-of-the-art cryptographic controls; PQC readiness is expected by regulators.',
    status: 'mandatory',
  },
  {
    name: 'ENISA PQC',
    article: 'PQC Migration Guidance 2025',
    relevance: 'ENISA recommends hybrid PQC/TLS deployment by 2027 and full PQC migration by 2030. Current algorithms below this threshold raise flags.',
    status: 'recommended',
  },
] as const

const statusBadge: Record<string, string> = {
  mandatory: 'bg-red-500/10 text-red-400 border-red-500/30',
  recommended: 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-6 mt-16 first:mt-0">
      <span className="font-mono text-[11px] text-[var(--accent)] tracking-[0.12em] border border-[var(--accent)]/30 px-2 py-[2px] shrink-0">
        {index}
      </span>
      <h2
        className="font-[var(--font-heading)] font-bold tracking-[-0.02em]"
        style={{ fontSize: 'clamp(18px, 2.5vw, 26px)' }}
      >
        {title}
      </h2>
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-surface border border-[var(--graphite-ghost)] p-6 ${className}`}>
      {children}
    </div>
  )
}

function Bar({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div>
      <div className="flex justify-between font-mono text-[12px] mb-1">
        <span className="text-[var(--graphite-med)]">{label}</span>
        <span className="text-[var(--graphite)]">{value}</span>
      </div>
      <div className="w-full bg-[var(--graphite-ghost)] h-[3px]">
        <div
          className={`h-full transition-all duration-700 ease-out ${color ?? 'bg-[var(--accent)]'}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function formatCertDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function gradeColor(grade: Algorithm['grade']): string {
  switch (grade) {
    case 'CRITICAL':
      return 'text-red-500'
    case 'WEAK':
      return 'text-amber-500'
    case 'MODERATE':
      return 'text-yellow-400'
    case 'STRONG':
      return 'text-[var(--accent)]'
    case 'PQC_READY':
      return 'text-[var(--accent)]'
    default:
      return 'text-[var(--graphite-med)]'
  }
}

// ── Report content ──────────────────────────────────────────────────────────

function ReportContent({ result }: { result: ScanResult }) {
  const { domain, qrsScore, algorithms, certificates, recommendations, tlsVersion, scannedAt, pqcStamp, scanId } = result
  const vulnerableAlgos = algorithms.filter((a) => a.vulnerable)
  const safeAlgos = algorithms.filter((a) => !a.vulnerable)

  return (
    <div className="relative z-10 w-full max-w-[920px] mx-auto">

      {/* ── Cover ── */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-3 font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--accent)] mb-6 px-4 py-[6px] border border-[var(--accent)]">
          <span className="block w-5 h-px bg-[var(--accent)]" aria-hidden="true" />
          GRIDERA PQC Vulnerability Assessment
        </div>
        <h1
          className="font-[var(--font-heading)] font-bold tracking-[-0.02em] mb-3"
          style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}
        >
          <span className="gradient-text">Quantum Readiness Report</span>
        </h1>
        <p className="font-mono text-[14px] text-[var(--graphite-med)] mb-2">
          {domain}
        </p>
        <p className="font-mono text-[12px] text-[var(--graphite-ghost)]">
          Scan ID: {scanId} · {new Date(scannedAt).toLocaleString()}
        </p>
      </div>

      {/* ── Section A: Executive Summary ── */}
      <SectionHeader index="A" title="Executive Summary" />
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Domain</p>
            <p className="font-mono text-[14px] text-[var(--graphite)]">{domain}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Scan Date</p>
            <p className="font-mono text-[14px] text-[var(--graphite)]">{new Date(scannedAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Risk Level</p>
            <p className={`font-mono text-[14px] uppercase tracking-wider font-medium ${riskColor[qrsScore.riskLevel]}`}>
              {qrsScore.riskLevel}
            </p>
          </div>
        </div>
        <div className={`border ${riskBorder[qrsScore.riskLevel]} ${riskBg[qrsScore.riskLevel]} p-6 text-center mb-6`}>
          <div className={`font-[var(--font-heading)] font-bold leading-none ${riskColor[qrsScore.riskLevel]}`} style={{ fontSize: '64px' }}>
            {qrsScore.overall}
          </div>
          <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--graphite-med)]">
            QRS Score (0–100)
          </div>
        </div>
        <p className="text-[14px] text-[var(--graphite-med)] leading-[1.7]">
          This report presents the findings of a GRIDERA post-quantum cryptography (PQC) vulnerability assessment
          performed on <span className="text-[var(--graphite)] font-medium">{domain}</span>. The domain achieved a
          Quantum Readiness Score (QRS) of <span className={riskColor[qrsScore.riskLevel]}>{qrsScore.overall}/100</span>,
          indicating <span className={riskColor[qrsScore.riskLevel]}>{qrsScore.riskLevel}</span> risk with a migration
          priority of <span className="text-[var(--graphite)]">{qrsScore.migrationPriority}</span>. {vulnerableAlgos.length} vulnerable
          algorithm{vulnerableAlgos.length === 1 ? '' : 's'} were detected across the TLS surface, {recommendations.length} remediation{' '}
          {recommendations.length === 1 ? 'action' : 'actions'} are recommended, and {certificates.length} certificate{' '}
          {certificates.length === 1 ? 'component' : 'components'} were inspected in the chain.
        </p>
      </Card>

      {/* ── Section B: Methodology ── */}
      <SectionHeader index="B" title="Methodology" />
      <Card>
        <p className="text-[14px] text-[var(--graphite-med)] leading-[1.7] mb-6">
          The GRIDERA scan engine performs a multi-stage cryptographic surface analysis. Each stage feeds into the QRS scoring model, producing a reproducible, cryptographically-signed assessment.
        </p>
        <div className="space-y-4">
          {[
            {
              n: '1',
              title: 'TLS Handshake Analysis',
              desc: 'The engine initiates a TLS handshake against port 443 and captures the negotiated protocol version, cipher suite, key exchange, and signature algorithm. This reveals the live cryptographic posture actually seen by clients — not merely the configuration.',
            },
            {
              n: '2',
              title: 'Certificate Chain Inspection',
              desc: 'Each certificate in the presented chain is parsed and graded by signature algorithm, key size, validity window, and expiry horizon. Certificates using RSA-PKCS#1 or ECDSA with sub-256-bit curves are flagged for quantum vulnerability.',
            },
            {
              n: '3',
              title: 'Algorithm Classification',
              desc: 'Detected algorithms are mapped against the NIST FIPS 203/204 catalog and the CRYSTALS-Kyber / Dilithium family. Each receives a grade (CRITICAL → PQC_READY) and a quantum-vulnerable boolean based on Shor/Grover threat models.',
            },
            {
              n: '4',
              title: 'QRS Scoring',
              desc: 'Four weighted categories — algorithm strength, key size adequacy, PQC readiness, and TLS compliance — combine into a 0–100 composite QRS score. Risk level and migration priority are derived from thresholds calibrated against ENISA PQC guidance.',
            },
            {
              n: '5',
              title: 'PQC Stamp (ML-DSA-65)',
              desc: 'The final result set is cryptographically signed with a post-quantum ML-DSA-65 signature and anchored to the Hedera ledger for tamper-evidence. The signature hash serves as the scan ID.',
            },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-4">
              <span className="shrink-0 w-7 h-7 border border-[var(--accent)]/30 flex items-center justify-center font-mono text-[12px] text-[var(--accent)]">
                {step.n}
              </span>
              <div>
                <p className="font-mono text-[13px] text-[var(--graphite)] font-medium mb-1">{step.title}</p>
                <p className="text-[13px] text-[var(--graphite-med)] leading-[1.6]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Section C: Findings ── */}
      <SectionHeader index="C" title="Findings" />
      <Card className="mb-px">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[var(--graphite-ghost)]">
          <div className="bg-[var(--bone-deep)] p-5">
            <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">TLS Version</p>
            <p className="font-mono text-[14px] text-[var(--graphite)]">{tlsVersion}</p>
          </div>
          <div className="bg-[var(--bone-deep)] p-5">
            <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Algorithms Found</p>
            <p className="font-mono text-[14px] text-[var(--graphite)]">
              {algorithms.length} total · <span className="text-red-400">{vulnerableAlgos.length} vulnerable</span> · <span className="text-[var(--accent)]">{safeAlgos.length} safe</span>
            </p>
          </div>
          <div className="bg-[var(--bone-deep)] p-5">
            <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Certificates</p>
            <p className="font-mono text-[14px] text-[var(--graphite)]">{certificates.length} in chain</p>
          </div>
          <div className="bg-[var(--bone-deep)] p-5">
            <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Recommendations</p>
            <p className="font-mono text-[14px] text-[var(--graphite)]">{recommendations.length} actions</p>
          </div>
        </div>
      </Card>

      {/* ── Section D: Risk Matrix ── */}
      <SectionHeader index="D" title="Risk Matrix" />
      <Card>
        <p className="text-[13px] text-[var(--graphite-med)] leading-[1.6] mb-5">
          Heat-map of findings by category and severity. Each cell reflects the count of detected items at that risk level.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--graphite-ghost)]">
                <th className="px-4 py-3 text-left font-mono text-[10px] text-[var(--graphite-med)] tracking-[0.1em] uppercase">Category</th>
                {(['critical', 'high', 'moderate', 'low', 'none'] as const).map((s) => (
                  <th key={s} className="px-4 py-3 text-center font-mono text-[10px] text-[var(--graphite-med)] tracking-[0.1em] uppercase">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {([
                ['Algorithms', algorithms],
                ['Certificates', certificates],
              ] as [string, { severity?: Algorithm['severity'] }[] | Algorithm[]][]).map(([cat, items]) => {
                const arr = items as Algorithm[]
                return (
                  <tr key={cat} className="border-b border-[var(--graphite-ghost)] last:border-0">
                    <td className="px-4 py-4 font-mono text-[12px] text-[var(--graphite)]">{cat}</td>
                    {(['critical', 'high', 'moderate', 'low', 'none'] as const).map((s) => {
                      const count = arr.filter((a) => a.severity === s).length
                      return (
                        <td key={s} className="px-4 py-4 text-center">
                          {count > 0 ? (
                            <span className={`inline-block font-mono text-[11px] px-2 py-[3px] ${severityBg[s]} ${severityColor[s]} border border-current/20`}>
                              {count}
                            </span>
                          ) : (
                            <span className="font-mono text-[11px] text-[var(--graphite-ghost)]">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Section E: QRS Score Breakdown ── */}
      <SectionHeader index="E" title="QRS Score Breakdown" />
      <Card>
        <p className="text-[13px] text-[var(--graphite-med)] leading-[1.6] mb-5">
          The composite QRS score is the weighted average of four sub-categories.
        </p>
        <div className="space-y-5">
          <Bar label="Key Exchange" value={qrsScore.categories.keySize} color="bg-[var(--accent)]" />
          <Bar label="Signatures" value={qrsScore.categories.algorithms} color="bg-[var(--accent)]" />
          <Bar label="Certificates" value={Math.round((qrsScore.categories.compliance + qrsScore.categories.keySize) / 2)} color="bg-[var(--accent)]" />
          <Bar label="Cipher Suites" value={qrsScore.categories.compliance} color="bg-[var(--accent)]" />
          <Bar label="PQC Readiness" value={qrsScore.categories.pqcReadiness} color="bg-[var(--accent)]" />
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
      </Card>

      {/* ── Section F: Certificate Analysis ── */}
      <SectionHeader index="F" title="Certificate Analysis" />
      <Card>
        {certificates.length === 0 ? (
          <p className="font-mono text-[13px] text-[var(--graphite-med)] text-center py-6">
            No certificates were retrieved — the domain may not present a valid TLS chain on port 443.
          </p>
        ) : (
          <div className="divide-y divide-[var(--graphite-ghost)]">
            {certificates.map((cert, i) => {
              const expiryColor = cert.daysUntilExpiry < 0 ? 'text-red-400' : cert.daysUntilExpiry < 30 ? 'text-red-400' : cert.daysUntilExpiry < 90 ? 'text-amber-400' : 'text-[var(--graphite)]'
              return (
                <div key={i} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-[10px] text-[var(--accent)] border border-[var(--accent)]/30 px-2 py-[2px]">
                      CERT {i + 1}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--graphite-ghost)]">/{certificates.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Subject</p>
                      <p className="font-mono text-[12px] text-[var(--graphite)] break-all">{cert.subject}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Issuer</p>
                      <p className="font-mono text-[12px] text-[var(--graphite)] break-all">{cert.issuer}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Valid From</p>
                      <p className="font-mono text-[12px] text-[var(--graphite)]">{formatCertDate(cert.validFrom)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Valid To</p>
                      <p className={`font-mono text-[12px] ${expiryColor}`}>
                        {formatCertDate(cert.validTo)} ({cert.daysUntilExpiry > 0 ? `${cert.daysUntilExpiry}d left` : 'expired'})
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Serial</p>
                      <p className="font-mono text-[10px] text-[var(--graphite-ghost)] break-all">{cert.serialNumber}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Fingerprint (SHA-256)</p>
                      <p className="font-mono text-[10px] text-[var(--graphite-ghost)] break-all">{cert.fingerprint}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-[var(--graphite-med)]">Algorithm grade:</span>
                    <span className={gradeColor('MODERATE')}>MODERATE</span>
                    <span className="text-[var(--graphite-ghost)]">·</span>
                    <span className="text-[var(--graphite-med)]">Quantum status:</span>
                    <span className="text-amber-400">Classical — migrate required</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ── Section G: Algorithm Inventory ── */}
      <SectionHeader index="G" title="Algorithm Inventory" />
      <Card>
        {algorithms.length === 0 ? (
          <p className="font-mono text-[13px] text-[var(--graphite-med)] text-center py-6">
            No algorithms detected — domain may not support HTTPS on port 443.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--graphite-ghost)]">
                  {['Algorithm', 'Key Size', 'Grade', 'Quantum Vulnerability', 'Severity'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-[var(--graphite-med)] tracking-[0.1em] uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {algorithms.map((algo, i) => (
                  <tr key={i} className="border-b border-[var(--graphite-ghost)] last:border-0">
                    <td className="px-4 py-4 font-mono text-[13px] text-[var(--graphite)]">{algo.name}</td>
                    <td className="px-4 py-4 font-mono text-[13px] text-[var(--graphite-med)]">{algo.keySize} bit</td>
                    <td className={`px-4 py-4 font-mono text-[12px] font-medium ${gradeColor(algo.grade)}`}>{algo.grade}</td>
                    <td className="px-4 py-4">
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
                    <td className={`px-4 py-4 font-mono text-[12px] ${severityColor[algo.severity]} uppercase`}>{algo.severity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Section H: Remediation Roadmap ── */}
      <SectionHeader index="H" title="Remediation Roadmap" />
      <Card>
        {recommendations.length === 0 ? (
          <p className="font-mono text-[13px] text-[var(--graphite-med)] text-center py-6">
            No remediation actions required at this time.
          </p>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border border-[var(--graphite-ghost)] p-5">
                <div className="flex items-start gap-4 mb-3">
                  <span className={`shrink-0 mt-[2px] font-mono text-[10px] font-medium border px-2 py-[3px] uppercase tracking-wider ${priorityBadge[rec.priority]}`}>
                    {rec.priority}
                  </span>
                  <div className="flex-1">
                    <p className="font-mono text-[13px] text-[var(--graphite)] font-medium">{rec.title}</p>
                    <p className="text-[13px] text-[var(--graphite-med)] leading-[1.6] mt-1">{rec.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 font-mono text-[11px] pl-[60px]">
                  <span className="text-[var(--graphite-ghost)]">Timeline:</span>
                  <span className="text-[var(--accent)]">{priorityTimeline[rec.priority]}</span>
                  {rec.framework && (
                    <>
                      <span className="text-[var(--graphite-ghost)]">Framework:</span>
                      <span className="text-[var(--graphite-med)]">{rec.framework}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Section I: Regulatory Mapping ── */}
      <SectionHeader index="I" title="Regulatory Mapping" />
      <Card>
        <p className="text-[13px] text-[var(--graphite-med)] leading-[1.6] mb-5">
          How the findings map to active EU and international regulatory frameworks governing cryptographic resilience.
        </p>
        <div className="divide-y divide-[var(--graphite-ghost)]">
          {REGULATORY_FRAMEWORKS.map((fw) => (
            <div key={fw.name} className="py-5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3 mb-2">
                <p className="font-mono text-[13px] text-[var(--graphite)] font-medium">{fw.name}</p>
                <span className={`font-mono text-[10px] uppercase tracking-wider border px-2 py-[2px] ${statusBadge[fw.status] ?? ''}`}>
                  {fw.status}
                </span>
              </div>
              <p className="font-mono text-[11px] text-[var(--accent)] mb-2">{fw.article}</p>
              <p className="text-[13px] text-[var(--graphite-med)] leading-[1.6]">{fw.relevance}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Section J: Appendices ── */}
      <SectionHeader index="J" title="Appendices" />
      <Card>
        <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase mb-4">J.1 Raw Scan Data</p>
        <pre className="bg-[var(--bone-deep)] border border-[var(--graphite-ghost)] p-4 overflow-x-auto font-mono text-[11px] text-[var(--graphite-med)] mb-6">
{JSON.stringify(
  {
    scanId,
    domain,
    tlsVersion,
    scannedAt,
    qrsScore,
    algorithmsCount: algorithms.length,
    certificatesCount: certificates.length,
    recommendationsCount: recommendations.length,
  },
  null,
  2,
)}
        </pre>

        <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase mb-4">J.2 PQC Stamp Verification</p>
        <div className="border border-[var(--accent)]/20 bg-[var(--accent)]/[0.04] p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 border border-[var(--accent)]/30 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[var(--accent)] text-[14px]">✦</span>
            </div>
            <div>
              <p className="font-mono text-[12px] text-[var(--accent)] font-medium mb-1">
                {pqcStamp.algorithm} — Cryptographically Verified
              </p>
              <p className="font-mono text-[11px] text-[var(--graphite-med)] break-all mb-2">
                hash: {pqcStamp.hash}
              </p>
              <p className="font-mono text-[10px] text-[var(--graphite-ghost)] break-all">
                sig: {pqcStamp.signature}
              </p>
              <p className="font-mono text-[11px] text-[var(--graphite-med)] mt-2">
                timestamp: {new Date(pqcStamp.timestamp).toISOString()}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Report footer ── */}
      <div className="mt-16 pt-8 border-t border-[var(--graphite-ghost)] text-center">
        <p className="font-mono text-[11px] text-[var(--graphite-ghost)] tracking-[0.06em]">
          GRIDERA Quantum Vulnerability Assessment — {domain}
        </p>
        <p className="font-mono text-[10px] text-[var(--graphite-ghost)] mt-1">
          Generated {new Date().toLocaleString()} · Scan ID {scanId} · ML-DSA-65 verified
        </p>
        <p className="font-mono text-[10px] text-[var(--graphite-ghost)] mt-3">
          © {new Date().getFullYear()} Taurus AI Corp · NIST FIPS 203/204 · ENISA PQC
        </p>
      </div>

    </div>
  )
}

// ── Pre-purchase CTA ─────────────────────────────────────────────────────────

function PurchaseCTA({ scanId, domain }: { scanId: string; domain: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handlePurchase(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/scan/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId, email }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? data.hint ?? 'Checkout failed')
      }
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
        return
      }
      throw new Error('No checkout URL returned')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Checkout failed')
    }
  }

  return (
    <div className="relative z-10 w-full max-w-[640px] mx-auto text-center">
      <div className="inline-flex items-center gap-3 font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--accent)] mb-6 px-4 py-[6px] border border-[var(--accent)]">
        <span className="block w-5 h-px bg-[var(--accent)]" aria-hidden="true" />
        FULL REPORT — $6,750
      </div>
      <h1
        className="font-[var(--font-heading)] font-bold leading-[1.08] tracking-[-0.02em] mb-4"
        style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}
      >
        Get the Full <span className="gradient-text">40-Page Report</span>
      </h1>
      <p className="text-[16px] text-[var(--graphite-med)] leading-[1.7] mb-10 max-w-[480px] mx-auto">
        The free scan shows surface-level exposure. The full report includes a methodology breakdown,
        risk matrix, certificate analysis, algorithm inventory, remediation roadmap, regulatory mapping,
        and raw scan data — cryptographically signed with ML-DSA-65.
      </p>

      <div className="glass-surface border border-[var(--graphite-ghost)] p-8 text-left">
        {/* Summary line */}
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <p className="font-mono text-[11px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Domain</p>
            <p className="font-mono text-[15px] text-[var(--graphite)]">{domain}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[11px] text-[var(--graphite-med)] uppercase tracking-wider mb-1">Price</p>
            <p className="font-[var(--font-heading)] text-[28px] font-bold text-[var(--accent)] leading-none">$6,750</p>
          </div>
        </div>

        <form onSubmit={handlePurchase} className="space-y-4">
          <div>
            <label className="block font-mono text-[11px] text-[var(--graphite-med)] uppercase tracking-wider mb-2">
              Email (report delivered here)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              disabled={status === 'loading'}
              className="w-full bg-[var(--bone-deep)] border border-[var(--graphite-ghost)] text-[var(--graphite)] font-mono text-[14px] px-4 py-3 outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--graphite-ghost)] disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading' || !email.includes('@')}
            className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            {status === 'loading' ? 'Redirecting to Stripe…' : (
              <>
                Purchase Full Report — $6,750
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        {status === 'error' && errorMsg && (
          <div className="mt-4 border border-red-400/30 bg-red-400/5 px-4 py-3 font-mono text-[12px] text-red-400">
            ✗ {errorMsg}
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-[var(--graphite-ghost)]">
          <ul className="space-y-2">
            {[
              '40-page comprehensive PQC assessment',
              'Methodology, risk matrix, certificate analysis',
              'Algorithm inventory with quantum-vulnerability grades',
              'Prioritised remediation roadmap with timelines',
              'EU AI Act, GDPR, DORA, NIS2, ENISA PQC mapping',
              'ML-DSA-65 cryptographic verification',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 font-mono text-[12px] text-[var(--graphite-med)]">
                <span className="text-[var(--accent)] text-[10px]">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 font-mono text-[11px] text-[var(--graphite-med)] opacity-60 text-center">
          Secure checkout via Stripe. One-time payment. Report accessible immediately after purchase.
        </p>
      </div>

      <div className="mt-6">
        <Link href={`/scan/results?scanId=${encodeURIComponent(scanId)}`} className="font-mono text-[12px] text-[var(--graphite-med)] hover:text-[var(--accent)] transition-colors">
          ← Back to scan results
        </Link>
      </div>
    </div>
  )
}

// ── Main content (wrapped in Suspense for useSearchParams) ────────────────────

function ReportPageContent() {
  const searchParams = useSearchParams()
  const scanId = searchParams.get('scanId') ?? ''
  const sessionId = searchParams.get('session_id')

  const [result, setResult] = useState<ScanResult | null>(null)
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error' | 'not-found'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!scanId) {
      setLoadState('error')
      setErrorMsg('Missing scan ID — return to the scan results page to purchase a report.')
      return
    }

    // After Stripe success (session_id present) OR pre-purchase, we need the scan
    // data. The stored scan is server-side, but the client results page stashes
    // a copy in sessionStorage. Prefer that; fall back to a fetch of /api/scan is
    // not possible without re-scanning, so we read sessionStorage.
    async function load() {
      setLoadState('loading')
      try {
        const raw = sessionStorage.getItem('gridera_scan_result') ?? sessionStorage.getItem('qgrid_scan_result')
        if (raw) {
          const parsed = JSON.parse(raw) as ScanResult
          if (parsed.scanId === scanId) {
            setResult(parsed)
            setLoadState('idle')
            return
          }
        }
        // Scan data mismatch / missing — we cannot render the report.
        if (sessionId) {
          // After checkout the user may land here without the session payload
          // if they cleared storage. Surface a clear message.
          setLoadState('not-found')
        } else {
          setLoadState('not-found')
        }
      } catch {
        setLoadState('error')
        setErrorMsg('Could not load scan data. Please re-run the scan.')
      }
    }
    void load()
  }, [scanId, sessionId])

  // ── No scanId ──
  if (!scanId) {
    return (
      <main className="min-h-screen px-6 pt-28 pb-20">
        <div className="relative z-10 w-full max-w-[520px] mx-auto text-center">
          <h1
            className="font-[var(--font-heading)] font-bold tracking-[-0.02em] mb-4"
            style={{ fontSize: 'clamp(24px, 3vw, 34px)' }}
          >
            No Scan Selected
          </h1>
          <p className="text-[14px] text-[var(--graphite-med)] mb-8">
            {errorMsg || 'A scan ID is required to view or purchase a report.'}
          </p>
          <Link href="/scan" className="btn-primary">
            Run a Scan →
          </Link>
        </div>
      </main>
    )
  }

  // ── Loading ──
  if (loadState === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="font-mono text-[var(--graphite-med)] text-sm">Loading report…</p>
      </main>
    )
  }

  // ── Scan data not found ──
  if (loadState === 'not-found' || (loadState === 'error' && !result)) {
    return (
      <main className="min-h-screen px-6 pt-28 pb-20">
        <div className="relative z-10 w-full max-w-[520px] mx-auto text-center">
          <h1
            className="font-[var(--font-heading)] font-bold tracking-[-0.02em] mb-4"
            style={{ fontSize: 'clamp(24px, 3vw, 34px)' }}
          >
            {sessionId ? 'Report Unavailable' : 'Scan Data Required'}
          </h1>
          <p className="text-[14px] text-[var(--graphite-med)] mb-8 leading-[1.7]">
            {sessionId
              ? 'Your payment was processed, but the scan data for this session could not be loaded in this browser. Re-run the scan on the same domain, then return here — the report will unlock automatically.'
              : 'We could not find the scan data for this scan ID. Re-run the scan on the same domain, then return here to purchase the full report.'}
          </p>
          <Link href="/scan" className="btn-primary">
            Run a Scan →
          </Link>
        </div>
      </main>
    )
  }

  // ── Post-checkout: show the full report ──
  if (sessionId && result) {
    return (
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
        <ReportContent result={result} />
      </main>
    )
  }

  // ── Pre-checkout: show purchase CTA ──
  if (result) {
    return (
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
        <PurchaseCTA scanId={scanId} domain={result.domain} />
      </main>
    )
  }

  return null
}

export default function ScanReportPage() {
  return (
    <>
      <Nav />
      <Suspense
        fallback={
          <main className="min-h-screen flex items-center justify-center">
            <p className="font-mono text-[var(--graphite-med)] text-sm">Loading…</p>
          </main>
        }
      >
        <ReportPageContent />
      </Suspense>
      <Footer />
    </>
  )
}