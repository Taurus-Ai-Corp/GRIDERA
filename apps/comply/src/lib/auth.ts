import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'

// ─── Configuration ─────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production-min-32-chars'
)
const JWT_ISSUER = 'gridera-comply'
const JWT_AUDIENCE = 'gridera-comply-users'
const TOKEN_EXPIRY = '7d'
const COOKIE_NAME = 'gridera_auth'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UserPayload extends JWTPayload {
  sub: string // user ID
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

// ─── Password Hashing (using bcrypt via Web Crypto API) ────────────────────────

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password)
  return computedHash === hash
}

// Note: In production, use bcrypt or argon2 via a proper library
// This is a simplified SHA-256 for demo. Replace with:
// import bcrypt from 'bcryptjs'
// await bcrypt.hash(password, 12)
// await bcrypt.compare(password, hash)

// ─── JWT Token Operations ──────────────────────────────────────────────────────

export async function createToken(payload: UserPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })
    return payload as unknown as UserPayload
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
    maxAge: 60 * 60 * 24 * 7, // 7 days
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

  const [user] = await db.insert(users).values({
    email: input.email.toLowerCase(),
    passwordHash,
    plan: 'free',
    jurisdiction: (process.env['NEXT_PUBLIC_JURISDICTION'] ?? 'eu') as any,
  }).returning({
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

export async function updateUserPlan(userId: string, plan: 'free' | 'starter' | 'growth' | 'enterprise', stripeCustomerId?: string): Promise<void> {
  const db = getDb()
  if (!db) return

  const { users } = await import('@taurus/db')
  await db.update(users)
    .set({ plan, stripeCustomerId })
    .where(eq(users.id, userId))
}

export async function linkUserToOrganization(userId: string, organizationId: string, jurisdiction: string): Promise<void> {
  const db = getDb()
  if (!db) return

  const { users } = await import('@taurus/db')
  await db.update(users)
    .set({ organizationId, jurisdiction: jurisdiction as any })
    .where(eq(users.id, userId))
}