import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/contact',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  // GRIDERA|Guard executor is proxied to the standalone guard API, which does
  // its own API-key auth. Clerk must not gate it.
  '/guard/v1(.*)',
])

const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)'])
const isApiRoute = createRouteMatcher(['/api(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return

  await auth.protect()

  // Skip redirect for API routes and the onboarding page itself
  if (isApiRoute(request) || isOnboardingRoute(request)) return

  // Check if user has an organization — if not, redirect to onboarding
  // Uses a lightweight API call to avoid direct DB access in proxy
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
    // If org check fails, let through — don't block access on transient errors
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
