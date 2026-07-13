import { NextResponse } from 'next/server'

// Generates a CycloneDX 1.6 CBOM for a domain and returns it as a signed
// download. Re-scans server-side (the in-memory scan store is per-instance
// on serverless, and client-posted scan data can't be trusted for a signed
// artifact).
export async function POST(req: Request) {
  try {
    const { domain } = await req.json()

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain required' }, { status: 400 })
    }

    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .trim()
      .toLowerCase()

    if (!cleanDomain || cleanDomain.length < 3) {
      return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })
    }

    // Dynamic imports to avoid build issues with Node.js modules
    const { scanDomain, generateCBOM, signCBOM } = await import('@taurus/pqc-engine')
    const { generateKeyPair } = await import('@taurus/pqc-crypto')

    const scanResult = await scanDomain(cleanDomain)
    if (scanResult.error) {
      return NextResponse.json({ error: `Scan failed: ${scanResult.error}` }, { status: 502 })
    }

    const cbom = generateCBOM(scanResult, { targetName: cleanDomain })

    // Sign with the platform key when configured, ephemeral otherwise
    const publicKeyHex = process.env['PLATFORM_PQC_PUBLIC_KEY']
    const secretKeyHex = process.env['PLATFORM_PQC_SECRET_KEY']
    let keys
    if (publicKeyHex && secretKeyHex) {
      keys = {
        publicKey: Uint8Array.from(Buffer.from(publicKeyHex, 'hex')),
        secretKey: Uint8Array.from(Buffer.from(secretKeyHex, 'hex')),
      }
    } else {
      keys = generateKeyPair()
    }
    const signed = signCBOM(cbom, keys.secretKey, keys.publicKey)

    return new NextResponse(JSON.stringify(signed, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${cleanDomain}-cbom-cyclonedx-1.6.json"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'CBOM generation failed' }, { status: 500 })
  }
}
