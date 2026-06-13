/**
 * @taurus/guard-api — GRIDERA Guard Fastify Server
 *
 * PQC-attested AI guardrails API with EU AI Act compliance.
 * Entry point re-exports the build() and start() functions.
 */

export { build, start } from './server.js'

/** @deprecated Use build() instead — will be removed in v2 */
export { build as buildServer } from './server.js'