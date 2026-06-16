/**
 * @taurus/guard/api — API Key Authentication Middleware
 *
 * Fastify plugin that validates X-API-Key or Authorization: Bearer header
 * against GRIDERA_API_KEYS env var (comma-separated) and a hardcoded dev key.
 *
 * Public endpoints (no auth required):
 *   GET /guard/v1/health
 *   GET /guard/v1/pricing
 *
 * Uses fastify-plugin to break encapsulation, so the onRequest
 * hook applies to ALL routes on the server, not just routes
 * registered in the same scope.
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify'
 * import { apiKeyAuth } from './auth'
 *
 * const app = Fastify()
 * await app.register(apiKeyAuth)
 * // All routes now require X-API-Key or Bearer, except health & pricing
 * ```
 */

import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { createDb, hashApiKey, findGuardKeyByHash, type Database } from '@taurus/db'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Dev key is ONLY available when NODE_ENV !== 'production'
// Evaluated at call time (not module load) so tests can override NODE_ENV
function getDevApiKey(): string {
  return process.env.NODE_ENV === 'production' ? '' : 'gridera_dev_key_2026'
}
const RATE_LIMIT_REMAINING = 100

/** Routes that skip authentication entirely */
const PUBLIC_ROUTES: Set<string> = new Set([
  '/guard/v1/health',
  '/guard/v1/pricing',
])

/** Route prefixes that require authentication */
const PROTECTED_PREFIXES = ['/guard/v1/execute', '/guard/v1/check-input', '/guard/v1/check-output', '/guard/v1/attestations']

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthErrorPayload {
  error: string
  code: 'AUTH_MISSING_KEY' | 'AUTH_INVALID_KEY'
  timestamp: string
}

interface GuardKeyMeta {
  email: string
  tier: string
  monthlyLimit: number
}

// Extend Fastify request type with guardKey metadata
declare module 'fastify' {
  interface FastifyRequest {
    guardKey?: GuardKeyMeta
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nowISO(): string {
  return new Date().toISOString()
}

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL
}

/**
 * Parse valid API keys from the GRIDERA_API_KEYS env var.
 * Returns an array of trimmed, non-empty strings.
 * Always includes the dev key for development convenience.
 */
function getValidKeys(): string[] {
  const envKeys = process.env.GRIDERA_API_KEYS ?? ''
  const keys = envKeys
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0)

  // Only include dev key in non-production environments
  const devKey = getDevApiKey()
  if (devKey && !keys.includes(devKey)) {
    keys.push(devKey)
  }

  return keys
}

/**
 * Check if the request route is a public endpoint.
 * Uses pathname only (strips query strings).
 */
function isPublicRoute(request: FastifyRequest): boolean {
  const path = request.url.split('?')[0]
  return PUBLIC_ROUTES.has(path)
}

/**
 * Check if the request route requires authentication.
 * Only routes under known protected prefixes require auth.
 * Unknown routes fall through to Fastify's 404 handler.
 */
function isProtectedRoute(request: FastifyRequest): boolean {
  const path = request.url.split('?')[0]
  return PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))
}

/**
 * Extract API key from request headers.
 * Supports both X-API-Key and Authorization: Bearer ***
 */
function extractApiKey(request: FastifyRequest): string | undefined {
  // Check X-API-Key header first
  const xApiKey = request.headers['x-api-key'] as string | undefined
  if (xApiKey) return xApiKey.trim()

  // Then check Authorization: Bearer ***
  const auth = request.headers['authorization'] as string | undefined
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()

  return undefined
}

async function authenticateWithDb(db: Database, apiKey: string): Promise<GuardKeyMeta | null> {
  const hash = hashApiKey(apiKey)
  const record = await findGuardKeyByHash(db, hash)

  if (!record || !record.active) {
    return null
  }

  return {
    email: record.email,
    tier: record.tier,
    monthlyLimit: record.monthlyLimit,
  }
}

// ---------------------------------------------------------------------------
// Fastify Plugin (with fastify-plugin to break encapsulation)
// ---------------------------------------------------------------------------

/**
 * API key authentication middleware for Fastify.
 *
 * Registers an onRequest hook that:
 * 1. Skips auth for public endpoints (health, pricing)
 * 2. Extracts X-API-Key or Authorization: Bearer *** request headers
 * 3. Returns 401 if key is missing (AUTH_MISSING_KEY)
 * 4. Returns 401 if key is invalid (AUTH_INVALID_KEY)
 * 5. Adds X-RateLimit-Remaining header on all responses
 * 6. Attaches request.guardKey metadata (email, tier, monthlyLimit) for valid DB keys
 *
 * Wrapped with fastify-plugin so the hook applies globally
 * (not scoped to the registration context).
 */
export const apiKeyAuth = fp(async function apiKeyAuth(fastify: FastifyInstance) {
  const databaseUrl = getDatabaseUrl()
  const db = databaseUrl ? createDb(databaseUrl) : null
  const fallbackKeys = db ? null : getValidKeys()

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Always set rate limit header
    reply.header('X-RateLimit-Remaining', RATE_LIMIT_REMAINING)

    // Skip auth for public routes (health, pricing)
    if (isPublicRoute(request)) {
      return
    }

    // Skip auth for unknown routes — let Fastify handle 404
    if (!isProtectedRoute(request)) {
      return
    }

    const apiKey = extractApiKey(request)

    // Missing key
    if (!apiKey) {
      const payload: AuthErrorPayload = {
        error: 'Unauthorized',
        code: 'AUTH_MISSING_KEY',
        timestamp: nowISO(),
      }
      return reply.code(401).send(payload)
    }

    // Authenticate via DB if available
    if (db) {
      const guardKey = await authenticateWithDb(db, apiKey)
      if (!guardKey) {
        const payload: AuthErrorPayload = {
          error: 'Invalid API key',
          code: 'AUTH_INVALID_KEY',
          timestamp: nowISO(),
        }
        return reply.code(401).send(payload)
      }
      request.guardKey = guardKey
      return
    }

    // Fallback to env-based static keys
    if (fallbackKeys && !fallbackKeys.includes(apiKey)) {
      const payload: AuthErrorPayload = {
        error: 'Invalid API key',
        code: 'AUTH_INVALID_KEY',
        timestamp: nowISO(),
      }
      return reply.code(401).send(payload)
    }

    // Key is valid — continue to next hook / route handler
  })
})