import type { NextConfig } from 'next'

const GUARD_EXECUTOR_ORIGIN =
  process.env['GUARD_EXECUTOR_ORIGIN'] ?? 'https://guard-beryl.vercel.app'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  /**
   * Proxy GRIDERA|Guard executor under the Comply domain so EU clients never
   * need guard.gridera.net (NXDOMAIN) or a separate host in product copy.
   * Health: GET /guard/v1/health → guard-beryl.
   */
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/guard/v1/:path*',
          destination: `${GUARD_EXECUTOR_ORIGIN}/guard/v1/:path*`,
        },
      ],
    }
  },
}

export default nextConfig