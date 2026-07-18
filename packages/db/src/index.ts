// createDb requires the Node.js runtime: the Supabase/pooler path uses
// postgres.js (node:net). Neon's HTTP driver is edge-safe, but importing this
// module is not — use createDb only in Node API routes, never in middleware/edge.
// resolveDatabaseUrl, isResidencyStrict, and the schema exports are pure/edge-safe.
export { createDb, type Database } from './client'
export { resolveDatabaseUrl, isResidencyStrict } from './resolve'
export * from './schema/index'

// Guard key functions require node:crypto - import separately:
// import { ... } from '@taurus/db/guard-keys'
// Note: Only available in Node.js runtime (API routes, not middleware)
