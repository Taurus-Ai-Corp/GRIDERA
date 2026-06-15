/**
 * GET /guard/v1/pricing
 *
 * Returns the built-in model pricing table and cost estimation info.
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { DEFAULT_PRICING } from '../guard-core/index.js'
import type { ModelPricingTable } from '../guard-core/index.js'

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const pricingRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/pricing', async (_request, reply) => {
    return reply.send({
      pricing: DEFAULT_PRICING as ModelPricingTable,
      timestamp: new Date().toISOString(),
    })
  })
}