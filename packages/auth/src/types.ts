export interface JwtHeader {
  alg: 'ML-DSA-65'
  typ: 'JWT'
  kid: string
}

export interface JwtPayload {
  sub: string
  email: string
  orgId: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  mfaVerified?: boolean
  iat: number
  exp: number
  jti: string
}

export interface JwtToken {
  token: string
  payload: JwtPayload
  expiresAt: Date
}

export interface AuthResult {
  success: boolean
  accessToken?: string
  refreshToken?: string
  requiresMfa?: boolean
  error?: string
}

export interface SessionUser {
  id: string
  email: string
  orgId: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  mfaVerified: boolean
}
