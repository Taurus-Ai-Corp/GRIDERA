import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'

// ─── Configuration ─────────────────────────────────────────────────────────────

const JWT_ISSUER = 'gridera-comply'
const JWT_AUDIENCE = 'gridera-comply-users'
const TOKEN_EXPIRY = '7d'
const COOKIE_NAME = 'gridera_auth'
const BCRYPT_ROUNDS = 12
const DEV_FALLBACK_SECRET = 'dev-secret-change-in-production-min-32-chars!!'

/** Lazy secret so tests can set process.env.JWT_SECRET before signing. */
function getJwtSecretBytes(): Uint8Array {
  const secret = process.env['JWT_SECRET']
  const isProd =
    process.env['NODE_ENV'] === 'production' ||
    process.env['VERCEL_ENV'] === 'production'

  if (isProd) {
    if (!secret || secret.length < 32) {
      throw new Error(
        'JWT_SECRET must be set to a value of at least 32 characters in production',
      )
    }
    return new TextEncoder().encode(secret)
  }

  if (secret && secret.length >= 16) {
    return new TextEncoder().encode(secret)
  }
  return new TextEncoder().encode(DEV_FALLBACK_SECRET)
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UserPayload extends JWTPayload {
  sub: string
  email: string
  organizationId?: string
  plan?: string
  jurisdiction?: string
}

export interface AuthUser {
  id: string
  email: string
  organizationId?: string
  plan?: string
  jurisdiction?: string
  fullName?: string
  avatarUrl?: string
}

export interface SignUpInput {
  email: string
  password: string
  name?: string
}

export interface SignInInput {
  email: string
  password: string
}

type PurposeToken = 'password_reset' | 'email_verify'

// ─── Password Hashing (bcrypt; verify legacy SHA-256 once) ─────────────────────

function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')
}

async function sha256Hex(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (isBcryptHash(hash)) {
    const bcrypt = await import('bcryptjs')
    return bcrypt.compare(password, hash)
  }
  // Legacy demo hashes (pre-harden) — accept once, rehash on login
  const legacy = await sha256Hex(password)
  return legacy === hash
}

// ─── JWT Token Operations ──────────────────────────────────────────────────────

export async function createToken(payload: UserPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getJwtSecretBytes())
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes(), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })
    return payload as unknown as UserPayload
  } catch {
    return null
  }
}

export async function createPurposeToken(
  purpose: PurposeToken,
  userId: string,
  email: string,
  expiresIn: string = '1h',
): Promise<string> {
  return new SignJWT({ purpose, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecretBytes())
}

export async function verifyPurposeToken(
  token: string,
  purpose: PurposeToken,
): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes(), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })
    if (payload['purpose'] !== purpose || !payload.sub || typeof payload['email'] !== 'string') {
      return null
    }
    return { userId: payload.sub, email: payload['email'] }
  } catch {
    return null
  }
}

// ─── Cookie Operations ─────────────────────────────────────────────────────────

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value
}

// ─── Server-side Auth Helpers ──────────────────────────────────────────────────

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAuthCookie()
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  return {
    id: payload.sub,
    email: payload.email,
    organizationId: payload.organizationId,
    plan: payload.plan,
    jurisdiction: payload.jurisdiction,
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

// ─── Database Operations ───────────────────────────────────────────────────────

export async function createUser(input: SignUpInput): Promise<AuthUser | null> {
  const db = getDb()
  if (!db) return null

  const { users } = await import('@taurus/db')
  const passwordHash = await hashPassword(input.password)

  try {
    const [user] = await db
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        passwordHash,
        plan: 'free',
        jurisdiction: (process.env['NEXT_PUBLIC_JURISDICTION'] ?? 'eu') as 'eu' | 'na' | 'in' | 'ae',
      })
      .returning({
        id: users.id,
        email: users.email,
        organizationId: users.organizationId,
        plan: users.plan,
        jurisdiction: users.jurisdiction,
      })

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId ?? undefined,
      plan: user.plan ?? undefined,
      jurisdiction: user.jurisdiction ?? undefined,
    }
  } catch (err) {
    // Unique violation → treat as failure for caller to map to 409
    console.error('[auth] createUser failed:', err)
    return null
  }
}

export async function authenticateUser(input: SignInInput): Promise<AuthUser | null> {
  const db = getDb()
  if (!db) return null

  const { users } = await import('@taurus/db')
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email.toLowerCase()),
  })

  if (!user || !user.passwordHash) return null

  const valid = await verifyPassword(input.password, user.passwordHash)
  if (!valid) return null

  // Upgrade legacy SHA-256 hashes to bcrypt on successful login
  if (!isBcryptHash(user.passwordHash)) {
    const next = await hashPassword(input.password)
    await db.update(users).set({ passwordHash: next }).where(eq(users.id, user.id))
  }

  return {
    id: user.id,
    email: user.email,
    organizationId: user.organizationId ?? undefined,
    plan: user.plan ?? undefined,
    jurisdiction: user.jurisdiction ?? undefined,
  }
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const db = getDb()
  if (!db) return null

  const { users } = await import('@taurus/db')
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  })

  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    organizationId: user.organizationId ?? undefined,
    plan: user.plan ?? undefined,
    jurisdiction: user.jurisdiction ?? undefined,
  }
}

export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const db = getDb()
  if (!db) return null

  const { users } = await import('@taurus/db')
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  })
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    organizationId: user.organizationId ?? undefined,
    plan: user.plan ?? undefined,
    jurisdiction: user.jurisdiction ?? undefined,
  }
}

export async function updatePassword(userId: string, newPassword: string): Promise<boolean> {
  const db = getDb()
  if (!db) return false
  const { users } = await import('@taurus/db')
  const passwordHash = await hashPassword(newPassword)
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId))
  return true
}

export async function updateUserPlan(
  userId: string,
  plan: 'free' | 'starter' | 'growth' | 'enterprise',
  stripeCustomerId?: string,
): Promise<void> {
  const db = getDb()
  if (!db) return

  const { users } = await import('@taurus/db')
  await db.update(users).set({ plan, stripeCustomerId }).where(eq(users.id, userId))
}

export async function linkUserToOrganization(
  userId: string,
  organizationId: string,
  jurisdiction: string,
): Promise<void> {
  const db = getDb()
  if (!db) return

  const { users } = await import('@taurus/db')
  await db
    .update(users)
    .set({ organizationId, jurisdiction: jurisdiction as 'eu' | 'na' | 'in' | 'ae' })
    .where(eq(users.id, userId))
}
