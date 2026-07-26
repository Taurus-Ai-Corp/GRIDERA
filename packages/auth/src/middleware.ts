import type { NextRequest } from 'next/server'
import { verifyJwt } from './jwt.js'
import { getSessionCookie } from './session.js'
import type { JwtPayload } from './types.js'

export interface AuthMiddlewareConfig {
  publicRoutes: string[]
  apiRoutes: string[]
  signInPath?: string
  publicKey: Uint8Array
}

export interface AuthMiddlewareResult {
  user: JwtPayload | null
  isAuthenticated: boolean
}

function isRouteMatch(path: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (pattern.endsWith('(.*)')) {
      const prefix = pattern.replace('(.*)', '')
      if (path.startsWith(prefix)) return true
    } else if (pattern.endsWith('*')) {
      const prefix = pattern.replace('*', '')
      if (path.startsWith(prefix)) return true
    } else if (path === pattern) {
      return true
    }
  }
  return false
}

export async function authMiddleware(
  request: NextRequest,
  config: AuthMiddlewareConfig,
): Promise<AuthMiddlewareResult> {
  const { pathname } = request.nextUrl

  if (isRouteMatch(pathname, config.publicRoutes)) {
    return { user: null, isAuthenticated: false }
  }

  const cookies = Object.fromEntries(
    request.cookies.getAll().map((c) => [c.name, c.value]),
  )
  const accessToken = getSessionCookie(cookies)
  if (!accessToken) {
    return { user: null, isAuthenticated: false }
  }

  const payload = verifyJwt(accessToken, config.publicKey)
  if (!payload) {
    return { user: null, isAuthenticated: false }
  }

  return { user: payload, isAuthenticated: true }
}

export function requireAuth(
  result: AuthMiddlewareResult,
  request: NextRequest,
  signInPath = '/sign-in',
): Response | null {
  if (!result.isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = signInPath
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return Response.redirect(url)
  }
  return null
}
