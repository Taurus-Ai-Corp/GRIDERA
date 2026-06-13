/**
 * GET /guard/v1/attestations/:id
 *
 * Retrieve a signed attestation by ID from the audit trail.
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { createGuard, InMemoryAuditAdapter } from '../guard-core/index.js'
import type { GuardConfig } from '../guard-core/index.js'

// ---------------------------------------------------------------------------
// Shared audit adapter — in production, swap with persistent store
// ---------------------------------------------------------------------------

const auditAdapter = new InMemoryAuditAdapter()
const guardConfig: GuardConfig = { auditAdapter }

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const attestationsRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get<{
    Params: { id: string }
  }>('/attestations/:id', async (request, reply) => {
    const { id } = request.params

    const guard = createGuard(guardConfig)
    const attestation = await guard.getAttestation(decodeURIComponent(id))

    if (!attestation) {
      return reply.status(404).send({
        statusCode: 404,
        error: {
          code: 'NOT_FOUND',
          message: `Attestation '${id}' not found`,
          timestamp: new Date().toISOString(),
        },
      })
    }

    return reply.send(attestation)
  })
}

// Export the shared audit adapter for use by other modules
export { auditAdapter }