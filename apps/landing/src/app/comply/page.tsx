'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect, useCallback } from 'react'
import Nav from '@/components/nav'

/* =====================================================================
   Types
   ===================================================================== */

type QuantumRiskGrade = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'QUANTUM_SAFE'

interface QrepCompact {
  id: string
  generatedAt: string
  overallScore: number
  quantumRiskGrade: QuantumRiskGrade
  criticalAssets: number
  highAssets: number
  headlineFinding: string
  recommendedAction: string
  topRemediation: string
}

/* =====================================================================
   Utility helpers
   ===================================================================== */

function getGradeColor(grade: QuantumRiskGrade): string {
  switch (grade) {
    case 'CRITICAL':   return 'text-red-500'
    case 'HIGH':       return 'text-amber-400'
    case 'MODERATE':   return 'text-yellow-400'
    case 'LOW':        return 'text-green-400'
    case 'QUANTUM_SAFE': return 'text-emerald-400'
  }
}

function getGradeBg(grade: QuantumRiskGrade): string {
  switch (grade) {
    case 'CRITICAL':   return 'bg-red-500/10'
    case 'HIGH':       return 'bg-amber-500/10'
    case 'MODERATE':   return 'bg-yellow-500/10'
    case 'LOW':        return 'bg-green-500/10'
    case 'QUANTUM_SAFE': return 'bg-emerald-500/10'
  }
}

function getGradeBorder(grade: QuantumRiskGrade): string {
  switch (grade) {
    case 'CRITICAL':   return 'border-red-500/30'
    case 'HIGH':       return 'border-amber-500/30'
    case 'MODERATE':   return 'border-yellow-500/30'
    case 'LOW':        return 'border-green-500/30'
    case 'QUANTUM_SAFE': return 'border-emerald-500/30'
  }
}

function getGradeAccent(grade: QuantumRiskGrade): string {
  switch (grade) {
    case 'CRITICAL':   return '#FF4444'
    case 'HIGH':       return '#F59E0B'
    case 'MODERATE':   return '#EAB308'
    case 'LOW':        return '#22C55E'
    case 'QUANTUM_SAFE': return '#10B981'
  }
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Critical Risk'
  if (score >= 60) return 'High Risk'
  if (score >= 40) return 'Moderate Risk'
  if (score >= 20) return 'Low Risk'
  return 'Quantum Safe'
}

/* =====================================================================
   Sample QREP data (realistic demo for Entry A)
   ===================================================================== */

const SAMPLE_QREP: QrepCompact = {
  id: 'demo-qrep-001',
  generatedAt: new Date().toISOString(),
  overallScore: 73,
  quantumRiskGrade: 'HIGH',
  criticalAssets: 3,
  highAssets: 11,
  headlineFinding:
    'HIGH: 3 cryptographic assets are in a harvest window of less than 3 years before a CRQC is expected to activate. Immediate migration to ML-KEM-768 required to prevent future decryption of sensitive data.',
  recommendedAction:
    'Begin PQC readiness assessment immediately. Map all cryptographic assets and generate CBOM. Target: remediation roadmap within 60 days.',
  topRemediation: 'Rotate RSA-2048 keys on mailgateway.acme.com to ML-KEM-768 — IMMEDIATE',
}

/* =====================================================================
   Score counter hook
   ===================================================================== */

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let frame = 0
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

/* =====================================================================
   Entry B: QREP Dashboard View
   ===================================================================== */

function QrepDashboard({ qrep }: { qrep: QrepCompact }) {
  const score = useCountUp(qrep.overallScore)
  const accent = getGradeAccent(qrep.quantumRiskGrade)

  return (
    <div className="w-full">
      {/* ── Dashboard Hero ── */}
      <div className={`border ${getGradeBorder(qrep.quantumRiskGrade)} ${getGradeBg(qrep.quantumRiskGrade)} p-8 mb-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Score block */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div
                className={`font-[var(--font-heading)] font-bold leading-none ${getGradeColor(qrep.quantumRiskGrade)}`}
                style={{ fontSize: '80px' }}
              >
                {score}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--graphite-med)]">
                QRS Score
              </div>
            </div>
            <div className="w-px h-16 bg-[var(--graphite-ghost)]" />
            <div>
              <div className={`font-[var(--font-heading)] text-[28px] font-bold ${getGradeColor(qrep.quantumRiskGrade)}`}>
                {qrep.quantumRiskGrade}
              </div>
              <div className="mt-1 font-mono text-[12px] text-[var(--graphite-med)]">
                {scoreLabel(qrep.overallScore)}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {qrep.criticalAssets > 0 && (
                  <span className="font-mono text-[10px] px-2 py-1 bg-red-500/15 text-red-400 border border-red-500/30 uppercase tracking-wider">
                    {qrep.criticalAssets} Critical
                  </span>
                )}
                {qrep.highAssets > 0 && (
                  <span className="font-mono text-[10px] px-2 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                    {qrep.highAssets} High
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Headline finding */}
          <div className="flex-1 max-w-[600px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] mb-2" style={{ color: accent }}>
              Headline Finding
            </p>
            <p className="text-[14px] text-[var(--graphite)] leading-[1.7]">
              {qrep.headlineFinding}
            </p>
          </div>
        </div>
      </div>

      {/* ── Asset Breakdown ── */}
      <div className="border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] p-6 mb-6">
        <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase mb-5">
          Asset Risk Distribution
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Critical', count: qrep.criticalAssets, color: '#FF4444', desc: '< 3yr harvest window' },
            { label: 'High', count: qrep.highAssets, color: '#F59E0B', desc: '< 7yr harvest window' },
            { label: 'Moderate', count: 0, color: '#EAB308', desc: '7–10yr harvest window' },
            { label: 'Low / Safe', count: 0, color: '#22C55E', desc: '10yr+ harvest window' },
          ].map(({ label, count, color, desc }) => (
            <div key={label} className="border border-[var(--graphite-ghost)] p-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-[var(--font-heading)] text-[32px] font-bold" style={{ color }}>
                  {count}
                </span>
                <span className="font-mono text-[11px] text-[var(--graphite-med)]">{label}</span>
              </div>
              <div className="w-full h-1 bg-[var(--graphite-ghost)] mb-2">
                <div
                  className="h-full transition-all duration-1000"
                  style={{ width: `${qrep.overallScore}%`, background: color }}
                />
              </div>
              <p className="font-mono text-[10px] text-[var(--graphite-med)]">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recommended Action + Top Remediation ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] p-6">
          <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase mb-4">
            Recommended Action
          </p>
          <p className="text-[14px] text-[var(--graphite)] leading-[1.7]">
            {qrep.recommendedAction}
          </p>
        </div>

        <div className="border border-red-500/20 bg-red-500/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-red-400 text-[16px]">!</span>
            <p className="font-mono text-[11px] text-red-400 tracking-[0.1em] uppercase">
              Top Remediation Item
            </p>
          </div>
          <p className="text-[14px] text-[var(--graphite)] leading-[1.7] font-medium">
            {qrep.topRemediation}
          </p>
        </div>
      </div>

      {/* ── Regulatory Context ── */}
      <div className="border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] p-6 mb-6">
        <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase mb-5">
          Regulatory Context
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: 'CNSA 2.0',
              deadline: 'Jan 1, 2027',
              status: 'upcoming',
              statusLabel: '7 months',
              desc: 'US National Security Agency PQC mandate for national security systems. All software/firmware must use approved PQC algorithms.',
              article: 'Software/firmware PQC by 2030',
              color: '#F59E0B',
            },
            {
              name: 'NIST IR 8547',
              deadline: 'Active',
              status: 'active',
              statusLabel: 'In effect',
              desc: 'Federal guidance on PQC migration for federal agencies and contractors. Includes CBOM requirements.',
              article: 'Migration guidelines + CBOM',
              color: '#00CCAA',
            },
            {
              name: 'EO 14144',
              deadline: 'Jan 27, 2025',
              status: 'active',
              statusLabel: 'Passed',
              desc: 'Executive Order on PQC for federally contracted software. Affects all federal suppliers.',
              article: 'Sensitive data migration timelines',
              color: '#00CCAA',
            },
            {
              name: 'DORA',
              deadline: 'Jan 17, 2025',
              status: 'active',
              statusLabel: 'In effect',
              desc: 'EU Digital Operational Resilience Act. ICT risk management includes cryptographic resilience requirements.',
              article: 'ICT risk + crypto resilience',
              color: '#00CCAA',
            },
            {
              name: 'NIS2',
              deadline: 'Ongoing',
              status: 'active',
              statusLabel: 'Active',
              desc: 'EU Network and Information Security Directive. Essential entities must manage cryptographic security risks.',
              article: 'Security measures for NIS',
              color: '#00CCAA',
            },
            {
              name: 'EU AI Act',
              deadline: 'Aug 2, 2026',
              status: 'upcoming',
              statusLabel: '14 months',
              desc: 'Article 10(5) data governance and Article 53 high-risk AI systems require cryptographic Bill of Materials.',
              article: 'Art. 10(5) + Art. 53 high-risk',
              color: '#F59E0B',
            },
          ].map((fw) => (
            <div key={fw.name} className="border border-[var(--graphite-ghost)] p-4 hover:border-[var(--accent)]/30 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-mono text-[12px] font-semibold text-[var(--graphite)]">{fw.name}</p>
                <span
                  className="shrink-0 font-mono text-[9px] px-2 py-0.5 border uppercase tracking-wider"
                  style={{ color: fw.color, borderColor: `${fw.color}40`, background: `${fw.color}10` }}
                >
                  {fw.statusLabel}
                </span>
              </div>
              <p className="font-mono text-[10px] text-[var(--graphite-med)] mb-2">{fw.deadline}</p>
              <p className="text-[12px] text-[var(--graphite-med)] leading-[1.6] mb-2">{fw.desc}</p>
              <p className="font-mono text-[10px] text-[var(--graphite-ghost)]">{fw.article}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] text-red-400 tracking-[0.1em] uppercase mb-2">
              Immediate Action Required
            </p>
            <h2 className="font-[var(--font-heading)] text-[24px] font-bold text-[var(--graphite)] mb-2">
              Ready to remediate your quantum exposure?
            </h2>
            <p className="text-[14px] text-[var(--graphite-med)] max-w-[520px]">
              GRIDERA|Comply provides a complete remediation roadmap with agent-driven PQC migration planning, CBOM generation, and NIST FIPS 203/204 compliance mapping — free for 14 days.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <a
              href="https://calendly.com/taurusai/gridera-executive-briefing"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-center justify-center"
            >
              Remediate Now →
            </a>
            <a
              href="/scan"
              className="btn-secondary text-center justify-center"
            >
              Run New Scan →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =====================================================================
   Entry A: Direct Visitor Landing
   ===================================================================== */

function ComplyLanding() {
  return (
    <div className="w-full">
      {/* ── Threat Hero ── */}
      <div className="border border-red-500/20 bg-red-500/5 p-8 mb-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 border border-red-500/30 flex items-center justify-center mt-0.5">
            <span className="text-red-400 text-[18px] font-bold">!</span>
          </div>
          <div>
            <p className="font-mono text-[11px] text-red-400 tracking-[0.1em] uppercase mb-3">
              Harvest-Now-Decrypt-Later Threat
            </p>
            <h1 className="font-[var(--font-heading)] text-[28px] font-bold text-[var(--graphite)] mb-4 leading-tight">
              Adversaries are already storing your encrypted data.
              <br />
              <span className="text-red-400">They&apos;re just waiting for quantum computers.</span>
            </h1>
            <p className="text-[15px] text-[var(--graphite-med)] leading-[1.8] max-w-[680px]">
              State-sponsored actors are harvesting encrypted traffic today — financial records, medical data,
              intellectual property — to decrypt with future quantum computers. If your data has a sensitivity
              window of 3–10 years, <strong className="text-[var(--graphite)]">you are already exposed.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ── The 1% Insight ── */}
      <div className="border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] p-8 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase mb-4">
              The Insight Your CISO Needs to Hear
            </p>
            <h2 className="font-[var(--font-heading)] text-[22px] font-bold text-[var(--graphite)] mb-4 leading-tight">
              Every day you wait, the harvest window shrinks.
            </h2>
            <p className="text-[14px] text-[var(--graphite-med)] leading-[1.8] mb-4">
              Most organizations believe they have 5–10 years before quantum computers threaten their
              encryption. They&apos;re wrong. The harvest window for data stolen today begins the moment
              sensitive data is encrypted — and attackers are already collecting.
            </p>
            <div className="space-y-3">
              {[
                { stat: '19–34%', label: 'Probability of CRQC breaking encryption by 2034 (Citi Institute)' },
                { stat: '$2–3B', label: 'PQC compliance market in 2026, growing to $15–30B by 2034' },
                { stat: 'Jan 1, 2027', label: 'CNSA 2.0 procurement gate — 7 months away' },
                { stat: '2029', label: 'Google moved PQC readiness deadline 5 years earlier' },
              ].map(({ stat, label }) => (
                <div key={stat} className="flex items-start gap-3">
                  <span className="shrink-0 font-mono text-[11px] text-[var(--accent)] mt-0.5">{stat}</span>
                  <span className="text-[13px] text-[var(--graphite-med)]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            {/* Sample QREP Preview */}
            <p className="font-mono text-[11px] text-[var(--graphite-med)] tracking-[0.1em] uppercase mb-4">
              Sample QREP — QRS Score
            </p>
            <div className={`border ${getGradeBorder('HIGH')} ${getGradeBg('HIGH')} p-6 mb-4`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`font-[var(--font-heading)] font-bold ${getGradeColor('HIGH')}`} style={{ fontSize: '64px', lineHeight: 1 }}>
                  73
                </div>
                <div>
                  <div className={`font-[var(--font-heading)] text-[20px] font-bold ${getGradeColor('HIGH')}`}>
                    HIGH
                  </div>
                  <div className="font-mono text-[11px] text-[var(--graphite-med)] mt-0.5">High Risk</div>
                  <div className="flex gap-2 mt-2">
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-red-500/15 text-red-400 border border-red-500/30">3 Critical</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30">11 High</span>
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-[var(--graphite)] leading-[1.7] border-t border-[var(--graphite-ghost)] pt-4">
                <span className="font-mono text-[10px] text-[var(--accent)] uppercase tracking-wider mr-2">Finding:</span>
                3 cryptographic assets are in a harvest window of less than 3 years. Immediate migration to ML-KEM-768 required.
              </p>
            </div>
            <a
              href="/comply?scan=demo"
              className="btn-secondary text-[11px] w-full justify-center"
            >
              View Full Sample QREP →
            </a>
          </div>
        </div>
      </div>

      {/* ── What is QREP ── */}
      <div className="border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] p-8 mb-6">
        <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase mb-5">
          Quantum Risk Exposure Report
        </p>
        <h2 className="font-[var(--font-heading)] text-[22px] font-bold text-[var(--graphite)] mb-6 leading-tight">
          The first data-asset-level harvest-window analysis.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Harvest-Window Analysis',
              desc: 'Unlike certificate scanners that flag weak algorithms, QREP maps each data asset to its harvest activation date — when stolen ciphertext becomes decryptable.',
              icon: '◈',
            },
            {
              title: 'Financial Exposure Quantification',
              desc: 'Translate technical risk into dollar figures: data breach cost × regulatory fines × reconstruction cost = your actual quantum financial exposure.',
              icon: '◈',
            },
            {
              title: 'CBOM Generation',
              desc: 'Cryptographic Bill of Materials mapped to NIST FIPS 203/204. Know exactly which assets need which PQC algorithm and in what priority order.',
              icon: '◈',
            },
          ].map(({ title, desc, icon }) => (
            <div key={title} className="border border-[var(--graphite-ghost)] p-5 hover:border-[var(--accent)]/30 transition-colors">
              <span className="text-[var(--accent)] text-[16px] mb-3 block">{icon}</span>
              <h3 className="font-mono text-[12px] font-semibold text-[var(--graphite)] mb-2 uppercase tracking-wider">{title}</h3>
              <p className="text-[13px] text-[var(--graphite-med)] leading-[1.7]">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Competitive Gap ── */}
      <div className="border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] p-8 mb-6">
        <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase mb-5">
          Why Existing Tools Fail
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-[var(--graphite-ghost)]">
                {['Tool', 'What It Does', 'What It Misses', 'GRIDERA QREP'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-mono text-[10px] text-[var(--graphite-med)] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Qinsight', 'Certificate scanning', 'No harvest-window model, no asset-level risk', '✓ Data-asset harvest analysis'],
                ['ExeQuantum', 'Crypto agility scoring', 'Static rules, no adversary timeline', '✓ 19–34% CRQC probability model'],
                ['QuantumSecure', 'Compliance gap analysis', 'Framework-only, no financial exposure', '✓ Financial exposure quantification'],
                ['GRIDERA QREP', 'Harvest-window QREP', '—', '✓ Full-stack quantum risk analysis'],
              ].map(([tool, does, misses, gridera]) => (
                <tr key={tool} className="border-b border-[var(--graphite-ghost)] last:border-0 hover:bg-[var(--accent)]/[0.02] transition-colors">
                  <td className={`px-4 py-4 font-mono text-[12px] font-medium ${tool === 'GRIDERA QREP' ? 'text-[var(--accent)]' : 'text-[var(--graphite)]'}`}>
                    {tool}
                  </td>
                  <td className="px-4 py-4 text-[13px] text-[var(--graphite-med)]">{does}</td>
                  <td className="px-4 py-4 text-[13px] text-[var(--graphite-med)]">{misses}</td>
                  <td className="px-4 py-4 font-mono text-[12px] text-[var(--accent)]">{gridera}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Regulatory Context ── */}
      <div className="border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] p-8 mb-6">
        <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase mb-5">
          Regulatory Deadlines That Matter
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: 'CNSA 2.0',
              deadline: 'January 1, 2027',
              status: '7 months',
              urgency: 'critical',
              desc: 'NSA mandates PQC for all national security systems — software by 2030, hardware by 2033. Your federal contracts may already require this.',
              color: '#FF4444',
            },
            {
              name: 'EU AI Act',
              deadline: 'August 2, 2026',
              status: '14 months',
              urgency: 'high',
              desc: 'High-risk AI systems require cryptographic Bill of Materials under Article 10(5) and Article 53. Non-compliance blocks EU market access.',
              color: '#F59E0B',
            },
            {
              name: 'DORA',
              deadline: 'January 17, 2025',
              status: 'Active',
              urgency: 'active',
              desc: 'EU financial sector digital resilience. ICT risk management now explicitly includes cryptographic resilience — regulators are auditing this now.',
              color: '#00CCAA',
            },
            {
              name: 'NIS2',
              deadline: 'Ongoing',
              status: 'Active',
              urgency: 'active',
              desc: 'Essential entities across EU must implement cryptographic security measures proportionate to risk. Scope expanded significantly in 2024.',
              color: '#00CCAA',
            },
            {
              name: 'NIST IR 8547',
              deadline: 'Active',
              status: 'Active',
              urgency: 'active',
              desc: 'Federal PQC migration guidelines. CBOM requirements and federal contractor obligations. The baseline for US government supply chain.',
              color: '#00CCAA',
            },
            {
              name: 'SWIFT 2027',
              deadline: 'December 2027',
              status: '18 months',
              urgency: 'high',
              desc: 'SWIFT\'s PQC migration deadline for the global banking network. Affects every financial institution in the SWIFT ecosystem.',
              color: '#F59E0B',
            },
          ].map((fw) => (
            <div key={fw.name} className="border border-[var(--graphite-ghost)] p-4 hover:border-[var(--accent)]/30 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-mono text-[12px] font-semibold text-[var(--graphite)]">{fw.name}</p>
                <span
                  className="shrink-0 font-mono text-[9px] px-2 py-0.5 border uppercase tracking-wider"
                  style={{ color: fw.color, borderColor: `${fw.color}40`, background: `${fw.color}10` }}
                >
                  {fw.status}
                </span>
              </div>
              <p className="font-mono text-[10px] text-[var(--graphite-med)] mb-2">{fw.deadline}</p>
              <p className="text-[12px] text-[var(--graphite-med)] leading-[1.6] mb-2">{fw.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── QREP Data Model ── */}
      <div className="border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] p-8 mb-6">
        <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase mb-5">
          What You Get in a QREP
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              section: 'Executive Summary',
              items: ['Overall QRS Score (0–100)', 'Quantum Risk Grade (CRITICAL/HIGH/MODERATE/LOW/QUANTUM_SAFE)', 'Critical and High asset counts', 'Headline finding (one-sentence)', 'Recommended action', 'Top remediation item'],
            },
            {
              section: 'Asset Inventory',
              items: ['Data asset register (types, owners, locations)', 'Cryptographic algorithm and key size per asset', 'Data sensitivity classification (critical/high/medium/low)', 'Retention years and harvest-start date', 'Asset ownership mapped to business units'],
            },
            {
              section: 'Harvest-Window Analysis',
              items: ['Per-asset harvest activation timeline', 'CRQC capability projections (19–34% by 2034)', 'Exposure score per asset (0–100)', 'Critical (<3yr), High (<7yr), Moderate (<10yr) buckets', 'Adversary model: tier-1 nation-state assumptions'],
            },
            {
              section: 'Prioritized Remediation',
              items: ['Ranked remediation actions by exposure score', 'Priority level (critical/high/medium/low)', 'Target algorithm (ML-KEM-768 or ML-DSA-65)', 'Estimated effort (days/weeks/months)', 'Cost estimate (low/medium/enterprise)', 'Regulatory drivers per asset (CNSA 2.0, NIST IR 8547, etc.)'],
            },
          ].map(({ section, items }) => (
            <div key={section} className="border border-[var(--graphite-ghost)] p-5">
              <h3 className="font-mono text-[12px] font-semibold text-[var(--graphite)] uppercase tracking-wider mb-3">
                {section}
              </h3>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13px] text-[var(--graphite-med)]">
                    <span className="shrink-0 text-[var(--accent)] mt-0.5">›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="border border-[var(--graphite-ghost)] bg-[rgba(0,204,170,0.03)] p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] text-[var(--accent)] tracking-[0.1em] uppercase mb-2">
              Get Your QREP
            </p>
            <h2 className="font-[var(--font-heading)] text-[24px] font-bold text-[var(--graphite)] mb-2">
              Quantify your quantum risk in 3 minutes.
            </h2>
            <p className="text-[14px] text-[var(--graphite-med)] max-w-[520px]">
              Run a free PQC scan on any domain and receive a complete Quantum Risk Exposure Report.
              No signup required. Results are ML-DSA-65 signed and verifiable.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <a
              href="/scan"
              className="btn-primary text-center justify-center"
            >
              Get Your QREP Free →
            </a>
            <a
              href="https://calendly.com/taurusai/gridera-executive-briefing"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-center justify-center"
            >
              Enterprise Inquiry →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =====================================================================
   ComplyInner — uses useSearchParams (requires Suspense boundary)
   ===================================================================== */

function ComplyInner() {
  const searchParams = useSearchParams()
  const scanId = searchParams.get('scan')
  const [qrep, setQrep] = useState<QrepCompact | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchQrep = useCallback(async (id: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/qrep/${id}`)
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('QREP not found. It may have expired or the scan ID is incorrect.')
        }
        throw new Error('Failed to load QREP. Please try again.')
      }
      const data: QrepCompact = await res.json()
      setQrep(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load QREP')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (scanId && scanId !== 'demo') {
      fetchQrep(scanId)
    } else if (scanId === 'demo') {
      setQrep(SAMPLE_QREP)
    }
  }, [scanId, fetchQrep])

  return (
    <div className="relative z-10 w-full max-w-[1000px] mx-auto">
      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--graphite-med)] tracking-[0.08em] uppercase mb-3">
          <a href="/" className="hover:text-[var(--accent)] transition-colors">GRIDERA</a>
          <span>/</span>
          <span className="text-[var(--graphite)]">Comply</span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1
              className="font-[var(--font-heading)] font-bold tracking-[-0.02em] text-[var(--graphite)] mb-1"
              style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}
            >
              {qrep ? 'Quantum Risk Exposure Report' : 'GRIDERA|Comply'}
            </h1>
            <p className="font-mono text-[12px] text-[var(--graphite-med)]">
              {qrep
                ? `Report ID: ${qrep.id} · Generated ${new Date(qrep.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                : 'Quantum Risk Quantification · Harvest-Now-Decrypt-Later Analysis'}
            </p>
          </div>
          {scanId && scanId !== 'demo' && (
            <a href="/comply" className="btn-secondary text-[11px] shrink-0">
              ← New QREP
            </a>
          )}
        </div>
      </div>

      {/* ── Loading State ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-2 border-[var(--graphite-ghost)] border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="font-mono text-[12px] text-[var(--graphite-med)] uppercase tracking-wider">
            Loading QREP…
          </p>
        </div>
      )}

      {/* ── Error State ── */}
      {!loading && error && (
        <div className="border border-red-500/30 bg-red-500/5 p-6 mb-6">
          <p className="font-mono text-[12px] text-red-400 mb-4">{error}</p>
          <div className="flex gap-3">
            <a href="/scan" className="btn-primary text-[12px] py-2 px-4">
              Run New Scan →
            </a>
            <a href="/comply" className="btn-secondary text-[11px]">
              View Landing Page →
            </a>
          </div>
        </div>
      )}

      {/* ── QREP Dashboard (Entry B) ── */}
      {!loading && !error && qrep && <QrepDashboard qrep={qrep} />}

      {/* ── Direct Visitor Landing (Entry A) ── */}
      {!loading && !error && !qrep && <ComplyLanding />}
    </div>
  )
}

/* =====================================================================
   Main Page — wraps ComplyInner in Suspense for useSearchParams
   ===================================================================== */

export default function ComplyPage() {
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

        <Suspense
          fallback={
            <div className="relative z-10 w-full max-w-[1000px] mx-auto flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-[var(--graphite-ghost)] border-t-[var(--accent)] rounded-full animate-spin" />
              <p className="font-mono text-[12px] text-[var(--graphite-med)] uppercase tracking-wider">
                Loading GRIDERA|Comply…
              </p>
            </div>
          }
        >
          <ComplyInner />
        </Suspense>
      </main>
    </>
  )
}
