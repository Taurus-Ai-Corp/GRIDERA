import { Metadata } from 'next'

export const metadata: Metadata = { title: 'AI Observability | GRIDERA|Comply' }

async function getObserveData(jurisdiction: string) {
  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${baseUrl}/api/observe?jurisdiction=${jurisdiction}&days=30`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function ObservePage() {
  const jurisdiction = process.env['JURISDICTION'] ?? 'eu'
  const data = await getObserveData(jurisdiction)

  if (!data || data.totalAssessments === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">AI Observability</h1>
        <p className="text-muted-foreground">No data yet. Run assessments with GRIDERA GUARD enabled to see traces.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">AI Observability</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Cost (30d)" value={`$${data.totalCost.toFixed(4)}`} />
        <StatCard label="Assessments" value={data.totalAssessments} />
        <StatCard label="Avg Cost/Assessment" value={`$${data.avgCostPerAssessment.toFixed(4)}`} />
        <StatCard label="Self-Hosted Ratio" value={`${(data.selfHostedRatio * 100).toFixed(0)}%`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Guard Pass Rate" value={`${(data.guardPassRate * 100).toFixed(1)}%`} />
        <StatCard label="Block Rate" value={`${(data.guardBlockRate * 100).toFixed(1)}%`} />
        <StatCard label="Warn Rate" value={`${(data.guardWarnRate * 100).toFixed(1)}%`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Avg Latency" value={`${data.avgLatencyMs}ms`} />
        <StatCard label="P95 Latency" value={`${data.p95LatencyMs}ms`} />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{String(value)}</p>
    </div>
  )
}
