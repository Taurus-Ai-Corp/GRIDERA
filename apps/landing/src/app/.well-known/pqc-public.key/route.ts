import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = false

const placeholder = `# GRIDERA ML-DSA-65 public key placeholder
# Replace with real key material before production attestation verification
`

export async function GET() {
  return new NextResponse(placeholder, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
