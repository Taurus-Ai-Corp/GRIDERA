/**
 * @taurus/guard/api — Auth Middleware Tests
 *
 * Tests for API key authentication Fastify plugin:
 * - Valid API key passes through
 * - Missing API key returns 401 AUTH_MISSING_KEY
 * - Invalid API key returns 401 AUTH_INVALID_KEY
 * - Health endpoint skips auth
 * - Pricing endpoint skips auth
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import { apiKeyAuth } from '../auth'

// ---------------------------------------------------------------------------
// Set up test environment
// ---------------------------------------------------------------------------

process.env.GRIDERA_API_KEYS = 'test_key_123'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function buildTestServer(): Promise<FastifyInstance> {
  const app = Fastify()
  await app.register(apiKeyAuth)

  // Test routes — mimic actual routes under /guard/v1 prefix
  app.get('/guard/v1/health', async () => ({ status: 'ok' }))
  app.get('/guard/v1/pricing', async () => ({ pricing: {} }))
  app.post('/guard/v1/execute', async () => ({ result: 'ok' }))
  app.post('/guard/v1/check-input', async () => ({ verdicts: [] }))
  app.post('/guard/v1/check-output', async () => ({ verdicts: [] }))

  return app
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('apiKeyAuth middleware', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = await buildTestServer()
  })

  afterEach(async () => {
    await app.close()
  })

  // -------------------------------------------------------------------------
  // 1. Valid API key passes through
  // -------------------------------------------------------------------------

  describe('valid API key', () => {
    it('should allow access with valid env key', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/guard/v1/execute',
        headers: { 'x-api-key': 'test_key_123', 'content-type': 'application/json' },
        payload: JSON.stringify({ prompt: 'Hello' }),
      })

      expect(response.statusCode).toBe(200)
    })

    it('should allow access with dev key', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/guard/v1/execute',
        headers: { 'x-api-key': 'gridera_dev_key_2026', 'content-type': 'application/json' },
        payload: JSON.stringify({ prompt: 'Hello' }),
      })

      expect(response.statusCode).toBe(200)
    })

    it('should include X-RateLimit-Remaining header on success', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/guard/v1/execute',
        headers: { 'x-api-key': 'test_key_123', 'content-type': 'application/json' },
        payload: JSON.stringify({ prompt: 'Hello' }),
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['x-ratelimit-remaining']).toBe('100')
    })

    it('should allow POST /guard/v1/check-input with valid key', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/guard/v1/check-input',
        headers: { 'x-api-key': 'test_key_123', 'content-type': 'application/json' },
        payload: JSON.stringify({ prompt: 'Hello' }),
      })

      expect(response.statusCode).toBe(200)
    })
  })

  // -------------------------------------------------------------------------
  // 2. Missing API key returns 401
  // -------------------------------------------------------------------------

  describe('missing API key', () => {
    it('should return 401 with AUTH_MISSING_KEY when no key is provided', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/guard/v1/execute',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ prompt: 'Hello' }),
      })

      expect(response.statusCode).toBe(401)
      const body = response.json()
      expect(body.error).toBe('Unauthorized')
      expect(body.code).toBe('AUTH_MISSING_KEY')
      expect(body.timestamp).toBeTruthy()
    })

    it('should return 401 with AUTH_MISSING_KEY for empty key header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/guard/v1/execute',
        headers: { 'x-api-key': '', 'content-type': 'application/json' },
        payload: JSON.stringify({ prompt: 'Hello' }),
      })

      expect(response.statusCode).toBe(401)
      const body = response.json()
      expect(body.code).toBe('AUTH_MISSING_KEY')
    })

    it('should include X-RateLimit-Remaining header even on 401', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/guard/v1/execute',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ prompt: 'Hello' }),
      })

      expect(response.statusCode).toBe(401)
      expect(response.headers['x-ratelimit-remaining']).toBe('100')
    })
  })

  // -------------------------------------------------------------------------
  // 3. Invalid API key returns 401
  // -------------------------------------------------------------------------

  describe('invalid API key', () => {
    it('should return 401 with AUTH_INVALID_KEY when key does not match', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/guard/v1/execute',
        headers: { 'x-api-key': 'wrong_key', 'content-type': 'application/json' },
        payload: JSON.stringify({ prompt: 'Hello' }),
      })

      expect(response.statusCode).toBe(401)
      const body = response.json()
      expect(body.error).toBe('Invalid API key')
      expect(body.code).toBe('AUTH_INVALID_KEY')
      expect(body.timestamp).toBeTruthy()
    })

    it('should reject keys that partially match', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/guard/v1/execute',
        headers: { 'x-api-key': 'test_key', 'content-type': 'application/json' },
        payload: JSON.stringify({ prompt: 'Hello' }),
      })

      expect(response.statusCode).toBe(401)
      const body = response.json()
      expect(body.code).toBe('AUTH_INVALID_KEY')
    })
  })

  // -------------------------------------------------------------------------
  // 4. Health endpoint skips auth
  // -------------------------------------------------------------------------

  describe('public endpoints — health', () => {
    it('should allow access to /guard/v1/health without API key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/guard/v1/health',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.status).toBe('ok')
    })

    it('should still include X-RateLimit-Remaining on health endpoint', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/guard/v1/health',
      })

      expect(response.headers['x-ratelimit-remaining']).toBe('100')
    })
  })

  // -------------------------------------------------------------------------
  // 5. Pricing endpoint skips auth
  // -------------------------------------------------------------------------

  describe('public endpoints — pricing', () => {
    it('should allow access to /guard/v1/pricing without API key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/guard/v1/pricing',
      })

      expect(response.statusCode).toBe(200)
    })

    it('should still include X-RateLimit-Remaining on pricing endpoint', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/guard/v1/pricing',
      })

      expect(response.headers['x-ratelimit-remaining']).toBe('100')
    })
  })

  // -------------------------------------------------------------------------
  // 6. Production mode disables dev key
  // -------------------------------------------------------------------------

  describe('production mode — dev key disabled', () => {
    const originalEnv = process.env.NODE_ENV

    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should reject dev API key in production mode', async () => {
      const prodApp = Fastify()
      await prodApp.register(apiKeyAuth)
      prodApp.post('/guard/v1/execute', async () => ({ ok: true }))

      const response = await prodApp.inject({
        method: 'POST',
        url: '/guard/v1/execute',
        headers: { 'x-api-key': 'gridera_dev_key_2026' },
      })

      expect(response.statusCode).toBe(401)
    })
  })
})