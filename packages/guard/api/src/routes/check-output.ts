/**
 * POST /guard/v1/check-output
 *
 * Output-only validation — no LLM call.
 * Returns verdicts for the provided response text against output guard rules.
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { createGuard } from '../guard-core/index.js'
import type { JurisdictionCode, JurisdictionPreset } from '../guard-core/index.js'

// ---------------------------------------------------------------------------
// JSON Schema
// ---------------------------------------------------------------------------

const checkOutputBodySchema = {
  type: 'object',
  required: ['response'],
  properties: {
    response: { type: 'string' },
    jurisdiction: { type: 'string', enum: ['eu', 'us', 'ca', 'uk', 'global'] },
    preset: { type: 'string', enum: ['eu-ai-act', 'nist-ai-rmf', 'soc2', 'default'] },
    maxTokens: { type: 'number', minimum: 1 },
  },
} as const

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const checkOutputRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post<{
    Body: {
      response: string
      jurisdiction?: JurisdictionCode
      preset?: JurisdictionPreset
      maxTokens?: number
    }
  }>('/check-output', {
    schema: { body: checkOutputBodySchema },
  },
  async (request, reply) => {
    const body = request.body

    if (body?.response === undefined || body?.response === null) {
      return reply.status(400).send({
        statusCode: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must include "response" field',
          timestamp: new Date().toISOString(),
        },
      })
    }

    const guard = createGuard({
      defaultJurisdiction: body.jurisdiction ?? 'eu',
      defaultPreset: body.preset ?? 'default',
      defaultMaxTokens: body.maxTokens ?? 8192,
    })

    const verdicts = guard.checkOutput(body.response, {
      jurisdiction: body.jurisdiction ?? 'eu',
      maxTokens: body.maxTokens,
      preset: body.preset,
    })

    return reply.send({
      response: body.response,
      verdicts,
      blocked: verdicts.some((v) => !v.pass && v.severity === 'block'),
    })
  })
}