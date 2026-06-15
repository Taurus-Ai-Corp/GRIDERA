/**
 * POST /guard/v1/execute
 *
 * Full guard pipeline: input check → LLM call → output check → attestation.
 * The caller provides `prompt` and optionally `llmResponse` (or the server
 * invokes a configured LLM adapter).
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { createGuard } from '../guard-core/index.js'
import type { GuardConfig, GuardInput, GuardResult, JurisdictionCode, JurisdictionPreset } from '../guard-core/index.js'

// ---------------------------------------------------------------------------
// JSON Schema for request validation
// ---------------------------------------------------------------------------

const executeBodySchema = {
  type: 'object',
  required: ['prompt'],
  properties: {
    prompt: { type: 'string', minLength: 1 },
    llmResponse: { type: 'string', description: 'Pre-computed LLM response to validate' },
    jurisdiction: { type: 'string', enum: ['eu', 'us', 'ca', 'uk', 'global'] },
    model: { type: 'string' },
    maxTokens: { type: 'number', minimum: 1 },
    preset: { type: 'string', enum: ['eu-ai-act', 'nist-ai-rmf', 'soc2', 'default'] },
  },
} as const

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const executeRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post<{
    Body: {
      prompt: string
      llmResponse?: string
      jurisdiction?: JurisdictionCode
      model?: string
      maxTokens?: number
      preset?: JurisdictionPreset
    }
  }>('/execute', {
    schema: { body: executeBodySchema },
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

    const guardConfig: GuardConfig = {
      defaultJurisdiction: body.jurisdiction ?? 'eu',
      defaultPreset: body.preset ?? 'default',
      defaultMaxTokens: body.maxTokens ?? 8192,
    }

    const guard = createGuard(guardConfig)

    const input: GuardInput = {
      prompt: body.prompt,
      llmCall: async () => body.llmResponse ?? '',
      jurisdiction: body.jurisdiction ?? 'eu',
      model: body.model,
      maxTokens: body.maxTokens,
      preset: body.preset,
    }

    const result: GuardResult = await guard.execute(input)

    return reply.send({
      blocked: result.blocked,
      blockReason: result.blockReason,
      attestation: result.attestation,
    })
  })
}