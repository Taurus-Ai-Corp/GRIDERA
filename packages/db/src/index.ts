// Core exports - safe for Edge Runtime (no node:crypto)
export { createDb, type Database } from './client'
export { resolveDatabaseUrl, isResidencyStrict } from './resolve'
export * from './schema/index'

// Guard key functions require node:crypto - import separately:
// import { ... } from '@taurus/db/guard-keys'
// Note: Only available in Node.js runtime (API routes, not middleware)
