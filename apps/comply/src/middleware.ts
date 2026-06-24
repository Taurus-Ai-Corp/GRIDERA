import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

// ─── Route Matchers ────────────────────────────────────────────────────────────

const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/contact',
  '/sign-in',
  '/sign-up',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/signout',
  '/api/auth/me',
  '/api/webhooks',
  // GRIDERA|Guard executor is proxied to the standalone guard API, which does
  // its own API-key auth. JWT middleware must not gate it.
  '/guard/v1',
]

const ONBOARDING_ROUTES = ['/onboarding']
const API_ROUTES_PREFIX = '/api'

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1))
    }
    return pathname === route || pathname.startsWith(route + '/')
  })
}

function isOnboardingRoute(pathname: string): boolean {
  return ONBOARDING_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith(API_ROUTES_PREFIX)
}

// ─── Token Extraction ──────────────────────────────────────────────────────────

function extractToken(request: NextRequest): string | null {
  // Check Authorization header first (for API clients)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // Check cookie (for browser clients)
  const cookie = request.cookies.get('gridera_auth')?.value
  if (cookie) return cookie

  return null
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Extract and verify token
  const token = extractToken(request)
  if (!token) {
    // No token - redirect to sign-in for browser, 401 for API
    if (isApiRoute(pathname)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(signInUrl)
  }

  const payload = await verifyToken(token)
  if (!payload) {
    // Invalid token - clear cookie and redirect
    const response = isApiRoute(pathname)
      ? NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      : NextResponse.redirect(new URL('/sign-in', request.url))

    response.cookies.delete('gridera_auth')
    return response
  }

  // Token valid - attach user to request headers for downstream use
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.sub)
  requestHeaders.set('x-user-email', payload.email)
  if (payload.organizationId) requestHeaders.set('x-org-id', payload.organizationId)
  if (payload.plan) requestHeaders.set('x-user-plan', payload.plan)
  if (payload.jurisdiction) requestHeaders.set('x-user-jurisdiction', payload.jurisdiction)

  // Skip redirect logic for API routes and onboarding page
  if (isApiRoute(pathname) || isOnboardingRoute(pathname)) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  // Check if user has an organization - if not, redirect to onboarding
  // (unless already on onboarding)
  if (!payload.organizationId) {
    try {
      const orgCheckUrl = new URL('/api/organizations', request.url)
      const res = await fetch(orgCheckUrl, {
        headers: { cookie: request.headers.get('cookie') ?? '' },
      })
      const data = (await res.json()) as { organization: unknown | null }
      if (!data.organization) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    } catch {
      // If org check fails, let through - don't block on transient errors
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

// ─── Config ────────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot|css|js|map)).*)',
  ],
}