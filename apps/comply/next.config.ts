import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@taurus/ui',
    '@taurus/pqc-engine',
    '@taurus/pqc-crypto',
    '@taurus/jurisdiction',
    '@taurus/db',
    '@taurus/hedera',
    '@clerk/nextjs',
  ],
  turbopack: {
    // Explicitly set the monorepo root so Next.js 16 Turbopack does not
    // walk up to the parent HEDERA workspace and pick up the wrong pnpm-workspace.yaml.
    root: path.resolve(__dirname, '../..'),
  },
  // Expose the GRIDERA|Guard executor under eu.q-grid.net/guard/v1/* by
  // proxying to the standalone guard API (separate Vercel project). Same-origin
  // for clients, so no CORS and within the CSP connect-src 'self'.
  async rewrites() {
    return [
      {
        source: '/guard/v1/:path*',
        destination: 'https://guard-beryl.vercel.app/guard/v1/:path*',
      },
    ]
  },
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
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://*.clerk.com https://img.clerk.com",
              "connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.com",
              "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
