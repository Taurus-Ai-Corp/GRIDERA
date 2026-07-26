// Types
export type { JwtPayload, JwtHeader, JwtToken, AuthResult, SessionUser } from './types.js'

// JWT (ML-DSA-65 signed)
export { signJwt, verifyJwt, decodeJwt } from './jwt.js'

// Password (argon2id)
export { hashPassword, verifyPassword } from './password.js'

// TOTP (MFA)
export { generateTotpSecret, verifyTotp, getTotpUri } from './totp.js'

// Session cookies
export {
  createSessionCookies,
  clearSessionCookies,
  getSessionCookie,
  getRefreshCookie,
  setCookieHeader,
} from './session.js'

// Refresh tokens
export { hashRefreshToken, generateRefreshToken } from './refresh-tokens.js'

// Audit (PQC-stamped auth events)
export { logAuthEvent } from './audit.js'
