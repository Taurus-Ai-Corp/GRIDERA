# GRIDERA OBSERVE Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add observability dashboard for AI decision-making — cost tracking, latency, guard pass/fail rates, compliance score trends. Extends existing `audit_trail` table with trace columns. EU AI Act Article 11 (technical documentation) compliance.

**Architecture:** Add 6 columns to `audit_trail` table. GUARD writes traces automatically. New `/dashboard/observe` page reads and visualizes them. No new services.

**Tech Stack:** TypeScript, Drizzle ORM, Next.js, vitest, Recharts (charting)

**Depends on:** GRIDERA GUARD must be implemented first (OBSERVE reads what GUARD writes).

---

## File Structure

| File | Responsibility |
|------|---------------|
| `packages/db/src/schema/audit-trail.ts` | Add 6 trace columns (modify existing) |
| `apps/comply/src/lib/observe-pricing.ts` | Model pricing rates + cost calculation |
| `apps/comply/src/lib/observe-queries.ts` | Dashboard data queries (cost, guard, latency) |
| `apps/comply/src/lib/observe.test.ts` | Tests: cost calculation, query builders |
| `apps/comply/src/app/api/observe/route.ts` | API endpoint for dashboard data |
| `apps/comply/src/app/(dashboard)/dashboard/observe/page.tsx` | Dashboard page |

---

### Task 1: Schema Migration — Add Trace Columns

**Files:**
- Modify: `packages/db/src/schema/audit-trail.ts`

- [ ] **Step 1: Add trace columns to audit_trail schema**

```typescript
// packages/db/src/schema/audit-trail.ts
import { bigint, integer, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const auditTrail = pgTable('audit_trail', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  action: text('action').notNull(),
  userId: text('user_id'),
  hederaTopicId: text('hedera_topic_id'),
  hederaTxId: text('hedera_tx_id'),
  hederaSequence: bigint('hedera_sequence', { mode: 'bigint' }),
  hash: text('hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // PQC column
  pqcSignature: text('pqc_signature'),
  // OBSERVE trace columns (nullable — non-LLM audit records don't use these)
  model: text('model'),
  tokensIn: integer('tokens_in'),
  tokensOut: integer('tokens_out'),
  costUsd: real('cost_usd'),
  latencyMs: integer('latency_ms'),
  guardVerdict: text('guard_verdict'), // 'pass' | 'block' | 'warn'
})
```

- [ ] **Step 2: Run Drizzle migration on EU database**

```bash
cd /Users/taurus_ai/Documents/HEDERA/q-grid-platform
pnpm --filter @taurus/db exec drizzle-kit push
```

Expected: 6 new columns added. Existing data unaffected (nullable).

- [ ] **Step 3: Commit**

```bash
git add packages/db/src/schema/audit-trail.ts
git commit -m "feat(observe): add trace columns to audit_trail schema

6 nullable columns: model, tokens_in, tokens_out, cost_usd, latency_ms, guard_verdict.
Non-LLM audit records unaffected.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Observe Queries Module

**Files:**
- Create: `apps/comply/src/lib/observe-queries.ts`
- Create: `apps/comply/src/lib/observe.test.ts`

- [ ] **Step 1: Write failing tests for cost calculation**

```typescript
// apps/comply/src/lib/observe.test.ts
import { describe, it, expect } from 'vitest'
import { calculateCost, MODEL_RATES } from './observe-queries'

describe('observe cost calculation', () => {
  it('calculates zero cost for self-hosted models', () => {
    const cost = calculateCost('ollama/qwen3-coder', 1000, 500)
    expect(cost).toBe(0)
  })

  it('calculates cost for cloud models', () => {
    const cost = calculateCost('gemini-1.5-flash', 1000, 500)
    // input: 1000/1000 * 0.000075 = 0.000075
    // output: 500/1000 * 0.0003 = 0.00015
    expect(cost).toBeCloseTo(0.000225, 6)
  })

  it('returns zero for unknown models', () => {
    const cost = calculateCost('unknown-model', 1000, 500)
    expect(cost).toBe(0)
  })
})

describe('observe query builders', () => {
  it('builds cost summary query params', () => {
    const { action, jurisdiction } = buildQueryFilters('eu')
    expect(action).toBe('ai_guard_attestation')
    expect(jurisdiction).toBe('eu')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter comply exec vitest run src/lib/observe.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement observe queries**

```typescript
// apps/comply/src/lib/observe-queries.ts

export const MODEL_RATES: Record<string, { input: number; output: number }> = {
  'ollama/qwen3-coder': { input: 0, output: 0 },
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
  'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  'claude-sonnet-4-6': { input: 0.003, output: 0.015 },
}

export function calculateCost(model: string, tokensIn: number, tokensOut: number): number {
  const rates = MODEL_RATES[model] ?? { input: 0, output: 0 }
  return (tokensIn / 1000) * rates.input + (tokensOut / 1000) * rates.output
}

export function buildQueryFilters(jurisdiction: string) {
  return {
    action: 'ai_guard_attestation' as const,
    jurisdiction,
  }
}

export interface ObserveSummary {
  totalCost: number
  totalAssessments: number
  avgCostPerAssessment: number
  selfHostedRatio: number
  guardPassRate: number
  guardBlockRate: number
  guardWarnRate: number
  avgLatencyMs: number
  p95LatencyMs: number
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter comply exec vitest run src/lib/observe.test.ts
```

Expected: All 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add apps/comply/src/lib/observe-queries.ts apps/comply/src/lib/observe.test.ts
git commit -m "feat(observe): add cost calculation and query builders

Model pricing rates, cost calculation, query filter builders.
4 tests passing.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Observe API Endpoint

**Files:**
- Create: `apps/comply/src/app/api/observe/route.ts`

- [ ] **Step 1: Create the API endpoint**

```typescript
// apps/comply/src/app/api/observe/route.ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auditTrail } from '@taurus/db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'
import type { ObserveSummary } from '@/lib/observe-queries'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const jurisdiction = searchParams.get('jurisdiction') ?? process.env['JURISDICTION'] ?? 'eu'
  const days = parseInt(searchParams.get('days') ?? '30', 10)

  const db = getDb()
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const since = new Date()
  since.setDate(since.getDate() - days)

  const rows = await db
    .select({
      costUsd: auditTrail.costUsd,
      latencyMs: auditTrail.latencyMs,
      guardVerdict: auditTrail.guardVerdict,
      model: auditTrail.model,
    })
    .from(auditTrail)
    .where(
      and(
        eq(auditTrail.action, 'ai_guard_attestation'),
        gte(auditTrail.createdAt, since),
      ),
    )

  const total = rows.length
  if (total === 0) {
    return NextResponse.json({
      totalCost: 0,
      totalAssessments: 0,
      avgCostPerAssessment: 0,
      selfHostedRatio: 0,
      guardPassRate: 0,
      guardBlockRate: 0,
      guardWarnRate: 0,
      avgLatencyMs: 0,
      p95LatencyMs: 0,
    } satisfies ObserveSummary)
  }

  const totalCost = rows.reduce((sum, r) => sum + (r.costUsd ?? 0), 0)
  const selfHosted = rows.filter((r) => r.model?.startsWith('ollama/')).length
  const passes = rows.filter((r) => r.guardVerdict === 'pass').length
  const blocks = rows.filter((r) => r.guardVerdict === 'block').length
  const warns = rows.filter((r) => r.guardVerdict === 'warn').length
  const latencies = rows.map((r) => r.latencyMs ?? 0).sort((a, b) => a - b)
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / total
  const p95Index = Math.ceil(total * 0.95) - 1

  const summary: ObserveSummary = {
    totalCost,
    totalAssessments: total,
    avgCostPerAssessment: totalCost / total,
    selfHostedRatio: selfHosted / total,
    guardPassRate: passes / total,
    guardBlockRate: blocks / total,
    guardWarnRate: warns / total,
    avgLatencyMs: Math.round(avgLatency),
    p95LatencyMs: latencies[p95Index] ?? 0,
  }

  return NextResponse.json(summary)
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/comply/src/app/api/observe/route.ts
git commit -m "feat(observe): add /api/observe endpoint for dashboard data

Aggregates guard attestations from audit_trail — cost, latency, guard rates.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Observe Dashboard Page

**Files:**
- Create: `apps/comply/src/app/(dashboard)/dashboard/observe/page.tsx`

- [ ] **Step 1: Create the observe dashboard page**

```typescript
// apps/comply/src/app/(dashboard)/dashboard/observe/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Observability | GRIDERA|Comply',
}

async function getObserveData(jurisdiction: string) {
  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/observe?jurisdiction=${jurisdiction}&days=30`, {
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export default async function ObservePage() {
  const jurisdiction = process.env['JURISDICTION'] ?? 'eu'
  const data = await getObserveData(jurisdiction)

  if (!data) {
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

      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Cost (30d)" value={`$${data.totalCost.toFixed(4)}`} />
        <StatCard label="Assessments" value={data.totalAssessments} />
        <StatCard label="Avg Cost/Assessment" value={`$${data.avgCostPerAssessment.toFixed(4)}`} />
        <StatCard label="Self-Hosted Ratio" value={`${(data.selfHostedRatio * 100).toFixed(0)}%`} />
      </div>

      {/* Guard Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Guard Pass Rate" value={`${(data.guardPassRate * 100).toFixed(1)}%`} />
        <StatCard label="Block Rate" value={`${(data.guardBlockRate * 100).toFixed(1)}%`} />
        <StatCard label="Warn Rate" value={`${(data.guardWarnRate * 100).toFixed(1)}%`} />
      </div>

      {/* Performance */}
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/comply/src/app/\(dashboard\)/dashboard/observe/page.tsx
git commit -m "feat(observe): add /dashboard/observe page with stat cards

Cost summary, guard health rates, latency metrics.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Wire Guard to Write Traces to Audit Trail

**Files:**
- Modify: `apps/comply/src/lib/ai-guard.ts`

- [ ] **Step 1: Add audit trail logging to guard execute**

After the attestation is built in `ai-guard.ts`, add a database write:

```typescript
// Add to ai-guard.ts execute() — after buildAttestation, before return
async function logAttestation(attestation: GuardAttestation): Promise<void> {
  try {
    const { getDb } = await import('@/lib/db')
    const { auditTrail } = await import('@taurus/db/schema')
    const db = getDb()
    if (!db) return

    await db.insert(auditTrail).values({
      entityType: 'guard_attestation',
      entityId: crypto.randomUUID(),
      action: 'ai_guard_attestation',
      model: attestation.model,
      tokensIn: attestation.tokens_in,
      tokensOut: attestation.tokens_out,
      costUsd: attestation.cost_usd,
      latencyMs: attestation.latency_ms,
      guardVerdict: attestation.guard_verdict,
      pqcSignature: attestation.signature,
      hash: attestation.timestamp,
    })
  } catch {
    // Non-blocking — guard works even if DB write fails
  }
}
```

Call `logAttestation(attestation)` at the end of `execute()` before returning.

- [ ] **Step 2: Run full test suite**

```bash
pnpm test
```

Expected: All tests pass (guard tests mock/skip DB).

- [ ] **Step 3: Commit**

```bash
git add apps/comply/src/lib/ai-guard.ts
git commit -m "feat(observe): wire guard attestations to audit_trail table

Every guard execution writes trace data to DB for observability dashboard.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Push and Verify

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/taurus_ai/Documents/HEDERA/q-grid-platform
pnpm test
```

Expected: 101+ tests passing.

- [ ] **Step 2: Push**

```bash
git push origin main
```

- [ ] **Step 3: Verify observe page loads**

After Vercel deploys:
```bash
curl -s -o /dev/null -w "HTTP %{http_code}" https://eu.q-grid.net/dashboard/observe
```

Expected: HTTP 200 (or 302 redirect to auth, which is correct for protected routes).
