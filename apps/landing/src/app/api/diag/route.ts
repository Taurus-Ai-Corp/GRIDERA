/**
 * DIAGNOSTIC ROUTE - DELETE AFTER DEBUG
 * Returns production env state
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

interface DiagResult {
  ok: boolean
  timestamp: string
  env: {
    nodeEnv: string
    vercelEnv: string | null
    vercelRegion: string | null
    vercelUrl: string | null
    buildId: string | null
  }
  keys: {
    stripeKeyPresent: boolean
    stripeKeyMode: 'test' | 'live' | 'unknown'
    stripeKeyFingerprint: string | null
    resendKeyPresent: boolean
    jwtSecretPresent: boolean
  }
  warning: string | null
}

export async function GET() {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const result: DiagResult = {
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      vercelEnv: process.env.VERCEL_ENV || null,
      vercelRegion: process.env.VERCEL_REGION || null,
      vercelUrl: process.env.VERCEL_URL || null,
      buildId: process.env.NEXT_BUILD_ID || null,
    },
    keys: {
      stripeKeyPresent: !!stripeKey,
      stripeKeyMode: stripeKey?.startsWith('sk_live_') ? 'live' : stripeKey?.startsWith('sk_test_') ? 'test' : 'unknown',
      stripeKeyFingerprint: stripeKey ? '...' + stripeKey.slice(-6) : null,
      resendKeyPresent: !!process.env.RESEND_API_KEY,
      jwtSecretPresent: !!process.env.JWT_SECRET,
    },
    warning: null,
  }

  // Check for Clerk env vars (should not exist)
  const clerkEnvVars = Object.keys(process.env).filter(k => k.toLowerCase().includes('clerk'))
  if (clerkEnvVars.length > 0) {
    result.warning = `Clerk env vars still present: ${clerkEnvVars.join(', ')}`
  }

  // Check for test keys in production
  if (result.keys.stripeKeyMode === 'test' && process.env.VERCEL_ENV === 'production') {
    result.warning = 'STRIPE_SECRET_KEY is a TEST key in production environment'
  }

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'CDN-Cache-Control': 'no-store',
    },
  })
}