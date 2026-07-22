'use client'

/**
 * Executive Operating View — GRIDERA|Comply only.
 * Data from GET /api/executive (jurisdiction-scoped Comply APIs).
 * CA cell: regulation pack + documentTypes from caConfig.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  ClipboardCheck,
  FileText,
  Shield,
  Anchor,
  MapPin,
  ChevronRight,
} from 'lucide-react'

type Regulation = { id: string; name: string; authority: string; deadline?: string }

type ExecutiveView = {
  jurisdiction: string
  cellDomain: string
  dataResidencyRegion: string
  regulationPack: Regulation[]
  documentTypes: string[]
  a1RequiredDocumentTypes: string[]
  dataSource: string
  stats: {
    systems: number
    assessments: number
    reports: number
    signedReports: number
    hcsAnchored: number
    avgScore: number | null
  }
  systems: { id: string; name: string; jurisdiction: string }[]
  recentAssessments: {
    id: string
    systemId: string
    status: string
    score?: number | null
    jurisdiction: string
  }[]
  recentReports: {
    id: string
    assessmentId: string
    documentType?: string | null
    pqcHash?: string | null
    hederaTxId?: string | null
  }[]
}

export default function ExecutivePage() {
  const [view, setView] = useState<ExecutiveView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/executive')
      .then(async (res) => {
        if (res.status === 401) {
          setError('Unauthorized')
          return
        }
        if (!res.ok) {
          setError(`Failed to load executive view (${res.status})`)
          return
        }
        setView((await res.json()) as ExecutiveView)
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-2">
        <p className="text-sm text-graphite-med font-mono">Loading executive view…</p>
      </div>
    )
  }

  if (error || !view) {
    return (
      <div className="p-2">
        <p className="text-sm text-red-600">{error ?? 'No data'}</p>
        <Link href="/sign-in" className="text-accent text-sm underline mt-2 inline-block">
          Sign in
        </Link>
      </div>
    )
  }

  const isCa = view.jurisdiction === 'ca'
  const STATS = [
    { label: 'Systems', value: view.stats.systems, icon: Building2 },
    { label: 'Assessments', value: view.stats.assessments, icon: ClipboardCheck },
    { label: 'Reports', value: view.stats.reports, icon: FileText },
    { label: 'ML-DSA signed', value: view.stats.signedReports, icon: Shield },
    { label: 'HCS anchored', value: view.stats.hcsAnchored, icon: Anchor },
  ]

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-graphite-med mb-2">
          GRIDERA|Comply · Executive Operating View
        </p>
        <h1 className="font-heading text-2xl font-bold text-graphite mb-1">
          {isCa ? 'Canada cell' : view.jurisdiction.toUpperCase()} operations
        </h1>
        <p className="text-sm text-graphite-med flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {view.cellDomain}
          </span>
          <span className="font-mono text-xs">residency: {view.dataResidencyRegion}</span>
          <span className="font-mono text-xs text-graphite-faint">
            source: {view.dataSource}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {STATS.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="border border-graphite-ghost bg-white px-4 py-3"
          >
            <div className="flex items-center gap-2 text-graphite-med mb-1">
              <Icon className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
            </div>
            <p className="font-heading text-2xl font-bold text-graphite">{value}</p>
          </div>
        ))}
      </div>

      {view.stats.avgScore != null && (
        <div className="border border-accent/30 bg-accent/5 px-5 py-4 mb-8">
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent mb-1">
            Average assessment score
          </p>
          <p className="font-heading text-3xl font-bold text-graphite">{view.stats.avgScore}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section className="border border-graphite-ghost bg-white p-5">
          <h2 className="font-heading text-lg font-bold text-graphite mb-1">
            Regulation pack
          </h2>
          <p className="text-xs text-graphite-med mb-4 font-mono">
            From @taurus/jurisdiction · not a free-form pack
          </p>
          <ul className="space-y-2 max-h-72 overflow-y-auto">
            {view.regulationPack.map((r) => (
              <li key={r.id} className="border-b border-graphite-ghost/60 pb-2">
                <p className="text-sm font-medium text-graphite">{r.name}</p>
                <p className="font-mono text-[10px] text-graphite-med">
                  {r.authority}
                  {r.deadline ? ` · ${r.deadline}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-graphite-ghost bg-white p-5">
          <h2 className="font-heading text-lg font-bold text-graphite mb-1">
            A1 document types
          </h2>
          <p className="text-xs text-graphite-med mb-4 font-mono">
            config.documentTypes · required:{' '}
            {view.a1RequiredDocumentTypes.join(', ')}
          </p>
          <ul className="space-y-1.5 mb-6">
            {view.documentTypes.map((t) => (
              <li
                key={t}
                className={`font-mono text-xs px-2 py-1.5 border ${
                  view.a1RequiredDocumentTypes.includes(t)
                    ? 'border-accent/40 bg-accent/5 text-graphite'
                    : 'border-graphite-ghost text-graphite-med'
                }`}
              >
                {t}
                {view.a1RequiredDocumentTypes.includes(t) ? ' · A1' : ''}
              </li>
            ))}
          </ul>

          <h3 className="font-heading text-sm font-bold text-graphite mb-2">Systems</h3>
          {view.systems.length === 0 ? (
            <p className="text-xs text-graphite-med mb-4">No systems in this cell yet.</p>
          ) : (
            <ul className="space-y-1 mb-4">
              {view.systems.map((s) => (
                <li key={s.id} className="text-sm text-graphite">
                  {s.name}{' '}
                  <span className="font-mono text-[10px] text-graphite-med">
                    ({s.jurisdiction})
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/dashboard/reports"
            className="inline-flex items-center gap-1 text-sm text-accent font-medium"
          >
            Reports <ChevronRight className="w-4 h-4" />
          </Link>
        </section>
      </div>

      <section className="border border-graphite-ghost bg-white p-5">
        <h2 className="font-heading text-lg font-bold text-graphite mb-3">
          Recent reports
        </h2>
        {view.recentReports.length === 0 ? (
          <p className="text-sm text-graphite-med">No reports yet for this org/cell.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="font-mono text-[10px] uppercase tracking-wider text-graphite-med border-b border-graphite-ghost">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Document type</th>
                  <th className="py-2 pr-4">ML-DSA</th>
                  <th className="py-2">HCS</th>
                </tr>
              </thead>
              <tbody>
                {view.recentReports.map((r) => (
                  <tr key={r.id} className="border-b border-graphite-ghost/50">
                    <td className="py-2 pr-4 font-mono text-xs">
                      <Link href={`/dashboard/reports/${r.id}`} className="text-accent">
                        {r.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">
                      {r.documentType ?? '—'}
                    </td>
                    <td className="py-2 pr-4">{r.pqcHash ? '✓' : '—'}</td>
                    <td className="py-2 font-mono text-xs">{r.hederaTxId ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
