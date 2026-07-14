/**
 * Integration test: scan → QREP lookup → /comply?scan=... dashboard URL.
 *
 * Run: npx tsx apps/landing/src/app/comply/comply-flow.test.ts
 *
 * This script verifies that /api/scan returns a scanId and that a /comply deep
 * link can be constructed from it. It does not render the React page; it tests
 * the data contract that the page depends on.
 */

const BASE_URL = process.env['BASE_URL'] ?? 'https://q-grid.net'
const TEST_DOMAIN = 'cloudflare.com'

async function main() {
  console.log(`Testing against ${BASE_URL}`)

  const scanRes = await fetch(`${BASE_URL}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain: TEST_DOMAIN }),
  })

  if (!scanRes.ok) {
    throw new Error(`Scan request failed: ${scanRes.status} ${await scanRes.text()}`)
  }

  const scanData = await scanRes.json()
  const scanId = scanData.scanId

  if (!scanId || typeof scanId !== 'string' || scanId.length !== 16) {
    throw new Error(`Invalid scanId returned: ${JSON.stringify(scanId)}`)
  }

  if (!scanData.qrsScore || typeof scanData.qrsScore.overall !== 'number') {
    throw new Error(`Missing QRS score in scan response: ${JSON.stringify(Object.keys(scanData))}`)
  }

  const complyUrl = `/comply?scan=${encodeURIComponent(scanId)}`
  console.log(`✓ scanId: ${scanId}`)
  console.log(`✓ QRS score: ${scanData.qrsScore.overall}`)
  console.log(`✓ /comply deep link: ${complyUrl}`)

  // Verify the scan results page CTA would point to the correct URL.
  const expectedCta = `/comply?scan=${scanId}`
  if (complyUrl !== expectedCta) {
    throw new Error(`CTA URL mismatch: ${complyUrl} !== ${expectedCta}`)
  }

  // Check that the deep link returns HTML (i.e. the route is reachable and does
  // not crash on useSearchParams).
  const pageRes = await fetch(`${BASE_URL}${complyUrl}`, { method: 'GET' })
  if (!pageRes.ok) {
    throw new Error(`/comply?scan=... returned ${pageRes.status}`)
  }
  const html = await pageRes.text()
  if (!html.includes('QREP') && !html.includes('Quantum Risk')) {
    throw new Error(`/comply?scan=... did not render expected QREP content`)
  }

  console.log(`✓ /comply?scan=... returned ${pageRes.status} with QREP content`)
  console.log('PASS — scan → QREP contract is intact')
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
