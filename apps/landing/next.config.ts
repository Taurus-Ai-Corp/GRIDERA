import type { NextConfig } from 'next'
import path from 'path'

// Build identifier to force cache invalidation on Vercel CDN
const BUILD_ID = 'gridera-jwt-auth-v2-' + Date.now()

const nextConfig: NextConfig = {
  transpilePackages: [
    '@taurus/ui',
    '@taurus/pqc-engine',
    '@taurus/pqc-crypto',
    '@taurus/jurisdiction',
    '@taurus/db',
  ],
  turbopack: {
    // Explicitly set the monorepo root so Next.js 16 Turbopack does not
    // walk up to the parent HEDERA workspace and pick up the wrong pnpm-workspace.yaml.
    root: path.resolve(__dirname, '../..'),
  },
  generateBuildId: async () => BUILD_ID,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },
}

export default nextConfig
