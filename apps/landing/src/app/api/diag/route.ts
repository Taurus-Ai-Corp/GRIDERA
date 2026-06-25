/**
 * DIAGNOSTIC ROUTE - DELETE AFTER DEBUG
 * Returns production env state and checks for Clerk residue
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
  }
  build: {
    hasClerkInNodeModules: boolean
    packageJsonHasClerk: boolean
  }
  warning: string | null
}

export async function GET() {
  const result: DiagResult = {
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      vercelEnv: process.env.VERCEL_ENV || null,
      vercelRegion: process.env.VERCEL_REGION || null,
      vercelUrl: process.env.VERCEL_URL || null,
    },
    build: {
      hasClerkInNodeModules: false,
      packageJsonHasClerk: false,
    },
    warning: null,
  }

  // Check if Clerk is somehow still installed
  try {
    // @ts-ignore - dynamic check
    const clerkPackage = await import('@clerk/nextjs').then(() => true).catch(() => false)
    result.build.hasClerkInNodeModules = clerkPackage
  } catch {
    result.build.hasClerkInNodeModules = false
  }

  // Check for Clerk env vars (should not exist)
  const clerkEnvVars = Object.keys(process.env).filter(k => k.toLowerCase().includes('clerk'))
  if (clerkEnvVars.length > 0) {
    result.warning = `Clerk env vars still present: ${clerkEnvVars.join(', ')}`
  }

  // Check for test keys in production
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (stripeKey && stripeKey.startsWith('sk_test_') && process.env.VERCEL_ENV === 'production') {
    result.warning = 'STRIPE_SECRET_KEY is a TEST key in production environment'
  }

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'CDN-Cache-Control': 'no-store',
    },
  })
}