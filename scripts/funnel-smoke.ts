#!/usr/bin/env npx tsx
/**
 * Production funnel smoke (network).
 *
 * Verifies:
 *  1. q-grid.net/pricing exposes Calendly executive-briefing
 *  2. /ca redirects to CA Comply cell
 *  3. eu.q-grid.net sign-in bad creds → healthy 401
 *  4. Optional: /api/scan → valid scanId (contract)
 *
 * Run:  pnpm smoke:funnel
 * CI:   workflow_dispatch or schedule (needs network)
 */

import {
  extractCalendlyHref,
  isValidScanId,
  parseAuthProbe,
  parseRedirectLocation,
} from './funnel-smoke/lib.ts'

const LANDING = process.env['LANDING_URL'] ?? 'https://q-grid.net'
const COMPLY_EU = process.env['COMPLY_EU_URL'] ?? 'https://eu.q-grid.net'
const CA_EXPECTED =
  process.env['CA_CELL_URL'] ?? 'https://q-grid-comply-ca.vercel.app'

type Check = { name: string; ok: boolean; detail: string }

async function checkCalendly(): Promise<Check> {
  const res = await fetch(`${LANDING}/pricing`, {
    headers: { 'cache-control': 'no-cache' },
  })
  const html = await res.text()
  const href = extractCalendlyHref(html)
  return {
    name: 'landing/pricing Calendly CTA',
    ok: res.ok && href !== null,
    detail: href ?? `HTTP ${res.status}, no Calendly href`,
  }
}

async function checkCaRedirect(): Promise<Check> {
  const res = await fetch(`${LANDING}/ca`, { redirect: 'manual' })
  const loc = parseRedirectLocation(res.headers.get('location'))
  const ok =
    (res.status === 307 || res.status === 308 || res.status === 302) &&
    !!loc &&
    loc.startsWith(CA_EXPECTED)
  return {
    name: 'landing /ca → CA cell',
    ok,
    detail: `status=${res.status} location=${loc ?? '(none)'}`,
  }
}

async function checkEuAuth(): Promise<Check> {
  const res = await fetch(`${COMPLY_EU}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'nobody@example.com',
      password: 'funnel-smoke-probe',
    }),
  })
  const body = await res.text()
  const probe = parseAuthProbe(res.status, body)
  return {
    name: 'eu sign-in bad creds (auth+DB spine)',
    ok: probe.healthy,
    detail: `HTTP ${res.status} reason=${probe.reason} body=${body.slice(0, 80)}`,
  }
}

async function checkScanContract(): Promise<Check> {
  const res = await fetch(`${LANDING}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain: 'cloudflare.com' }),
  })
  if (!res.ok) {
    return {
      name: 'scan → scanId contract',
      ok: false,
      detail: `HTTP ${res.status}`,
    }
  }
  const data = (await res.json()) as { scanId?: string; qrsScore?: { overall?: number } }
  const ok = isValidScanId(data.scanId) && typeof data.qrsScore?.overall === 'number'
  return {
    name: 'scan → scanId contract',
    ok,
    detail: `scanId=${data.scanId ?? '∅'} qrs=${data.qrsScore?.overall ?? '∅'}`,
  }
}

async function main() {
  console.log(`Funnel smoke: LANDING=${LANDING} EU=${COMPLY_EU}`)
  const checks = await Promise.all([
    checkCalendly(),
    checkCaRedirect(),
    checkEuAuth(),
    checkScanContract(),
  ])

  let failed = 0
  for (const c of checks) {
    const mark = c.ok ? '✓' : '✗'
    console.log(`${mark} ${c.name}: ${c.detail}`)
    if (!c.ok) failed++
  }

  if (failed > 0) {
    console.error(`FAIL — ${failed}/${checks.length} checks failed`)
    process.exit(1)
  }
  console.log(`PASS — ${checks.length}/${checks.length} funnel checks green`)
}

main().catch((e) => {
  console.error('FAIL:', e instanceof Error ? e.message : e)
  process.exit(1)
})
