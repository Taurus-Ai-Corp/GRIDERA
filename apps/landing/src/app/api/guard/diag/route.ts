import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { timingSafeEqual } from 'node:crypto'

// DIAG ROUTE - 2026-06-11
// Purpose: surface the Vercel-side Stripe state without leaking the key.
// Gated by DIAG_SECRET env var (required) - constant-time comparison to avoid timing
// side-channels. Accepts the secret via ?secret=... query string OR Authorization: Bearer header.
// Without a valid secret: returns 401 with no body, so the route appears unconfigured to
// anyone who doesn't have the secret. Set DIAG_SECRET in Vercel dashboard, then pass it
// to the user as a one-time value when they need to debug Stripe. DELETE THIS FILE after
// the Stripe checkout is fixed in production.

interface DiagResult {
  ok: boolean
  timestamp: string
  env: {
    nodeEnv: string
    vercelEnv: string | null
    vercelRegion: string | null
  }
  stripe: {
    keyPresent: boolean
    keyMode: 'test' | 'live' | 'unknown'
    keyFingerprint: string
    accountId: string | null
    accountEmail: string | null
    accountCountry: string | null
    apiVersionConfigured: string
    apiVersionSupported: boolean
    connectivity: 'ok' | 'failed' | 'skipped'
    connectivityError: string | null
  }
  secrets: {
    resendConfigured: boolean
    publicAppUrl: string | null
    byoCloudEndpointConfigured: boolean
  }
  warning: string | null
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function extractSecret(req: Request): string | null {
  // Prefer Authorization: Bearer header (logs are cleaner, no secret in URL)
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()
  // Fallback: ?secret=... query string (for quick curl checks)
  const url = new URL(req.url)
  const q = url.searchParams.get('secret')
  return q?.trim() ?? null
}

function secretMatches(provided: string, expected: string): boolean {
  // Constant-time comparison. Equal length required for timingSafeEqual.
  if (provided.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function GET(req: Request) {
  const expected = process.env['DIAG_SECRET']
  if (!expected) {
    // No DIAG_SECRET configured = route is effectively disabled. Return 404 to avoid
    // disclosing that the route exists at all.
    return new NextResponse(null, { status: 404 })
  }
  const provided = extractSecret(req)
  if (!provided || !secretMatches(provided, expected)) {
    return new NextResponse(null, { status: 401 })
  }

  const result: DiagResult = {
    ok: false,
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env['NODE_ENV'] ?? 'unknown',
      vercelEnv: process.env['VERCEL_ENV'] ?? null,
      vercelRegion: process.env['VERCEL_REGION'] ?? null,
    },
    stripe: {
      keyPresent: false,
      keyMode: 'unknown',
      keyFingerprint: 'absent',
      accountId: null,
      accountEmail: null,
      accountCountry: null,
      apiVersionConfigured: '2026-03-25.dahlia',
      apiVersionSupported: true,
      connectivity: 'skipped',
      connectivityError: null,
    },
    secrets: {
      resendConfigured: false,
      publicAppUrl: process.env['NEXT_PUBLIC_APP_URL'] ?? null,
      byoCloudEndpointConfigured: false,
    },
    warning: null,
  }

  const key = process.env['STRIPE_SECRET_KEY']
  if (!key) {
    result.warning = 'STRIPE_SECRET_KEY is not set in the Vercel environment. This is the most common cause of the checkout 500.'
    return NextResponse.json(result, { status: 200 })
  }

  result.stripe.keyPresent = true
  result.stripe.keyMode = key.startsWith('sk_live_') ? 'live' : key.startsWith('sk_test_') ? 'test' : 'unknown'
  // Fingerprint: last 6 chars only. Never expose the prefix or the full key.
  result.stripe.keyFingerprint = '...' + key.slice(-6)

  if (process.env['RESEND_API_KEY']) result.secrets.resendConfigured = true
  if (process.env['BYO_CLOUD_ENDPOINT']) result.secrets.byoCloudEndpointConfigured = true

  // Try a no-op Stripe call to confirm the key is valid and the API version is accepted.
  try {
    const stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
    const acct = await stripe.accounts.retrieve()
    result.stripe.accountId = acct.id ?? null
    result.stripe.accountEmail = acct.email ?? null
    result.stripe.accountCountry = acct.country ?? null
    result.stripe.connectivity = 'ok'
    result.ok = true

    // If the key is in test mode but the Vercel env is production, flag it.
    if (result.stripe.keyMode === 'test' && result.env.vercelEnv === 'production') {
      result.warning = 'STRIPE_SECRET_KEY is a TEST key (sk_test_...) but Vercel is in production env. This is the most likely cause of the 500. Swap to sk_live_... in Vercel dashboard → Project Settings → Environment Variables.'
    }
    if (result.stripe.keyMode === 'live' && result.env.vercelEnv === 'preview') {
      result.warning = 'STRIPE_SECRET_KEY is a LIVE key but Vercel is in preview env. Live keys should never be used in preview.'
    }
  } catch (err: unknown) {
    result.stripe.connectivity = 'failed'
    const msg = err instanceof Error ? err.message : String(err)
    result.stripe.connectivityError = msg
    if (msg.toLowerCase().includes('api') && msg.toLowerCase().includes('version')) {
      result.stripe.apiVersionSupported = false
      result.warning = 'Stripe rejected the apiVersion. This is a Stripe SDK or account-version mismatch.'
    } else if (msg.toLowerCase().includes('connection') || msg.toLowerCase().includes('timeout')) {
      result.warning = 'Vercel could not reach the Stripe API. This is a Vercel egress or Stripe-side connectivity issue. Try again in 60s.'
    } else {
      result.warning = 'Stripe account.retrieve() failed. See connectivityError.'
    }
  }

  return NextResponse.json(result, { status: 200 })
}
