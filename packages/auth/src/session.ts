import { generateRefreshToken as genRefreshToken } from './refresh-tokens.js'

const ACCESS_COOKIE_NAME = '__session'
const REFRESH_COOKIE_NAME = '__refresh'

export function createSessionCookies(options: {
  accessToken: string
  refreshToken: string
  secure?: boolean
  domain?: string
}): string[] {
  const secure = options.secure ?? true
  const domainSuffix = options.domain ? `; Domain=${options.domain}` : ''
  const secureFlag = secure ? '; Secure' : ''

  return [
    `${ACCESS_COOKIE_NAME}=${options.accessToken}; Path=/; HttpOnly; SameSite=Strict${secureFlag}${domainSuffix}; Max-Age=900`,
    `${REFRESH_COOKIE_NAME}=${options.refreshToken}; Path=/api/auth/refresh; HttpOnly; SameSite=Strict${secureFlag}${domainSuffix}; Max-Age=604800`,
  ]
}

export function clearSessionCookies(domain?: string): string[] {
  const domainSuffix = domain ? `; Domain=${domain}` : ''
  return [
    `${ACCESS_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict${domainSuffix}; Max-Age=0`,
    `${REFRESH_COOKIE_NAME}=; Path=/api/auth/refresh; HttpOnly; SameSite=Strict${domainSuffix}; Max-Age=0`,
  ]
}

export function getSessionCookie(cookies: Record<string, string>): string | undefined {
  return cookies[ACCESS_COOKIE_NAME]
}

export function getRefreshCookie(cookies: Record<string, string>): string | undefined {
  return cookies[REFRESH_COOKIE_NAME]
}

export function setCookieHeader(cookie: string, existing?: string): string {
  return existing ? `${existing}, ${cookie}` : cookie
}

export { genRefreshToken as generateRefreshToken }
