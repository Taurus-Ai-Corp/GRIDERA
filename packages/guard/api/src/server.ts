/**
 * @taurus/guard/api — Fastify Server Builder
 *
 * Wires together auth middleware, CORS, and route plugins.
 * Exports build() for serverless (Vercel) and start() for local dev.
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { apiKeyAuth } from './auth.js'
import { healthRoute } from './routes/health.js'
import { pricingRoute } from './routes/pricing.js'
import { checkInputRoute } from './routes/check-input.js'
import { checkOutputRoute } from './routes/check-output.js'
import { attestationsRoute } from './routes/attestations.js'
import { createGuard, InMemoryAuditAdapter } from '../../src/index'
import type { GuardConfig, JurisdictionCode, JurisdictionPreset } from '../../src/index'

// ---------------------------------------------------------------------------
// Execute route handler (inline — depends on guard.execute)
// ---------------------------------------------------------------------------

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

const auditAdapter = new InMemoryAuditAdapter()
const guardConfig: GuardConfig = { auditAdapter }

const executeRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post<{
    Body: {
      prompt: string
      llmResponse?: string
      jurisdiction?: JurisdictionCode
      model?: string
      maxTokens?: number
      preset?: JurisdictionPreset
    }
  }>('/execute', async (request, reply) => {
    const body = request.body

    if (!body?.prompt) {
      return reply.status(400).send({
        statusCode: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must include "prompt" field',
          timestamp: new Date().toISOString(),
        },
      })
    }

    const guard = createGuard({
      ...guardConfig,
      defaultJurisdiction: body.jurisdiction ?? 'eu',
      defaultPreset: body.preset ?? 'default',
      defaultMaxTokens: body.maxTokens ?? 8192,
    })

    const llmCall = () => Promise.resolve(body.llmResponse ?? '')

    const result = await guard.execute({
      prompt: body.prompt,
      llmCall,
      jurisdiction: body.jurisdiction ?? 'eu',
      model: body.model,
      maxTokens: body.maxTokens,
      preset: body.preset,
    })

    return reply.send({
      blocked: result.blocked,
      blockReason: result.blockReason,
      attestation: result.attestation,
    })
  })
}

// ---------------------------------------------------------------------------
// Build the Fastify server (for testing + serverless)
// ---------------------------------------------------------------------------

export async function build() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  })

  // CORS
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  })

  // Auth middleware
  await app.register(apiKeyAuth)

  // Register routes under /guard/v1 prefix
  app.register(
    async (guardApp) => {
      guardApp.register(healthRoute)
      guardApp.register(pricingRoute)
      guardApp.register(checkInputRoute)
      guardApp.register(checkOutputRoute)
      guardApp.register(executeRoute)
      guardApp.register(attestationsRoute)
    },
    { prefix: '/guard/v1' },
  )

  return app
}

/**
 * @deprecated Use build() instead — will be removed in v2
 */
export const buildServer = build

// ---------------------------------------------------------------------------
// Start standalone server (for local development)
// ---------------------------------------------------------------------------

export async function start() {
  const app = await build()
  const port = Number(process.env.PORT ?? 3001)
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`Guard API listening on port ${port}`)
  return app
}

// Run standalone if executed directly
if (typeof process !== 'undefined' && process.argv[1]?.includes('server')) {
  start().catch(console.error)
}

if (process.env.VERCEL) {
  const port = Number(process.env.PORT ?? 3000)
  build()
    .then((app) => app.listen({ port, host: '0.0.0.0' }))
    .catch(console.error)
}
