/**
 * POST /guard/v1/check-input
 *
 * Input-only validation — no LLM call.
 * Returns verdicts for the provided prompt against configured guard rules.
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { createGuard } from '../guard-core/index.js'
import type { JurisdictionCode, JurisdictionPreset } from '../guard-core/index.js'

// ---------------------------------------------------------------------------
// JSON Schema
// ---------------------------------------------------------------------------

const checkInputBodySchema = {
  type: 'object',
  required: ['prompt'],
  properties: {
    prompt: { type: 'string', minLength: 1 },
    jurisdiction: { type: 'string', enum: ['eu', 'us', 'ca', 'uk', 'global'] },
    preset: { type: 'string', enum: ['eu-ai-act', 'nist-ai-rmf', 'soc2', 'default'] },
    maxTokens: { type: 'number', minimum: 1 },
  },
} as const

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const checkInputRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post<{
    Body: {
      prompt: string
      jurisdiction?: JurisdictionCode
      preset?: JurisdictionPreset
      maxTokens?: number
    }
  }>('/check-input', {
    schema: { body: checkInputBodySchema },
  }, async (request, reply) => {
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
      defaultJurisdiction: body.jurisdiction ?? 'eu',
      defaultPreset: body.preset ?? 'default',
      defaultMaxTokens: body.maxTokens ?? 8192,
    })

    const verdicts = guard.checkInput(body.prompt, {
      jurisdiction: body.jurisdiction ?? 'eu',
      maxTokens: body.maxTokens,
      preset: body.preset,
    })

    return reply.send({
      prompt: body.prompt,
      verdicts,
      blocked: verdicts.some((v) => !v.pass && v.severity === 'block'),
    })
  })
}