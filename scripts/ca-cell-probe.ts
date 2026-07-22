#!/usr/bin/env npx tsx
/**
 * Canada sovereign-cell probe.
 *
 * Checks DNS (optional), HTTP reachability, auth spine, and documents
 * expected failures until Name.com CNAME + DATABASE_URL_CA are fixed.
 *
 * Run: pnpm probe:ca
 */

import { parseAuthProbe } from './funnel-smoke/lib.ts'

const CA_APP = process.env['CA_CELL_URL'] ?? 'https://q-grid-comply-ca.vercel.app'
const CA_DNS = process.env['CA_DNS_HOST'] ?? 'ca.q-grid.net'
const LANDING = process.env['LANDING_URL'] ?? 'https://q-grid.net'

async function dnsResolves(host: string): Promise<boolean> {
  try {
    // Node 20+: dns promises
    const { promises: dns } = await import('node:dns')
    const r = await dns.lookup(host)
    return !!r.address
  } catch {
    return false
  }
}

async function main() {
  const report: Record<string, string> = {}

  const dnsOk = await dnsResolves(CA_DNS)
  report['dns.ca.q-grid.net'] = dnsOk ? 'RESOLVES' : 'MISSING (Name.com CNAME still required)'

  const app = await fetch(`${CA_APP}/`, { method: 'GET' })
  report['ca_app_http'] = `HTTP ${app.status} ${CA_APP}`

  const authRes = await fetch(`${CA_APP}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nobody@example.com', password: 'ca-probe' }),
  })
  const authBody = await authRes.text()
  const probe = parseAuthProbe(authRes.status, authBody)
  report['ca_auth_spine'] = probe.healthy
    ? `OK (${probe.reason}) HTTP ${authRes.status}`
    : `UNHEALTHY (${probe.reason}) HTTP ${authRes.status} — fix DATABASE_URL_CA if server_error`

  const redir = await fetch(`${LANDING}/ca`, { redirect: 'manual' })
  report['landing_/ca'] = `HTTP ${redir.status} → ${redir.headers.get('location') ?? '(none)'}`

  console.log('=== CA cell ops probe ===')
  for (const [k, v] of Object.entries(report)) {
    console.log(`${k}: ${v}`)
  }

  // Exit 0 if interim cell is up (app + landing redirect). DNS may still be missing.
  const interimOk = app.ok && (redir.status === 307 || redir.status === 302 || redir.status === 308)
  if (!interimOk) {
    console.error('FAIL — interim CA cell not healthy')
    process.exit(1)
  }

  if (!dnsOk || !probe.healthy) {
    console.log('WARN — cell app reachable but DNS and/or CA DB password still open blockers')
    // Non-zero so CI can track full go-live separately via STRICT=1
    if (process.env['CA_STRICT'] === '1') process.exit(2)
  } else {
    console.log('PASS — CA DNS + auth spine healthy')
  }
}

main().catch((e) => {
  console.error('FAIL:', e instanceof Error ? e.message : e)
  process.exit(1)
})
