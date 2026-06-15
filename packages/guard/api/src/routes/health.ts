/**
 * GET /guard/v1/health
 *
 * Health check endpoint — returns service status and version info.
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const healthRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      service: '@taurus/guard-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    })
  })
}