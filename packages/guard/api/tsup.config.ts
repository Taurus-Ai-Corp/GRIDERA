import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  target: 'node20',
  platform: 'node',
  // Vercel serverless cannot resolve workspace symlinks at runtime, so inline
  // every workspace dependency plus the transitive noble-crypto / hedera packages.
  noExternal: [
    '@taurus/db',
    '@taurus/guard',
    '@taurus/pqc-crypto',
    '@taurus/pqc-engine',
    '@taurus/jurisdiction',
    '@taurus/ui',
    '@noble/post-quantum',
    '@noble/hashes',
    '@hashgraph/sdk',
  ],
})