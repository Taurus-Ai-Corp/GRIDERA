import { NextResponse } from 'next/server'
import { storeScanResult } from '@/lib/scan-store'

export async function POST(req: Request) {
  try {
    const { domain } = await req.json()

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain required' }, { status: 400 })
    }

    // Clean domain (remove protocol, path, trailing slash, etc.)
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .trim()
      .toLowerCase()

    if (!cleanDomain || cleanDomain.length < 3) {
      return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })
    }

    // Dynamic imports to avoid build issues with Node.js modules
    const { scanDomain, calculateQrsScore, generateRecommendations } = await import('@taurus/pqc-engine')
    const { createStamp, generateKeyPair } = await import('@taurus/pqc-crypto')

    const scanResult = await scanDomain(cleanDomain)
    const qrsScore = calculateQrsScore(scanResult)
    const recommendations = generateRecommendations(scanResult, 'na')

    // PQC stamp — use platform key from env if available, otherwise generate ephemeral key
    const publicKeyHex = process.env['PLATFORM_PQC_PUBLIC_KEY']
    const secretKeyHex = process.env['PLATFORM_PQC_SECRET_KEY']

    let stamp
    if (publicKeyHex && secretKeyHex) {
      const publicKey = Uint8Array.from(Buffer.from(publicKeyHex, 'hex'))
      const secretKey = Uint8Array.from(Buffer.from(secretKeyHex, 'hex'))
      stamp = createStamp(
        {
          type: 'scan',
          id: crypto.randomUUID(),
          payload: { domain: cleanDomain, qrsScore },
          jurisdiction: 'na',
        },
        secretKey,
        publicKey,
      )
    } else {
      // Dev fallback — generate ephemeral key
      const kp = generateKeyPair()
      stamp = createStamp(
        {
          type: 'scan',
          id: crypto.randomUUID(),
          payload: { domain: cleanDomain, qrsScore },
          jurisdiction: 'na',
        },
        kp.secretKey,
        kp.publicKey,
      )
    }

    const scanId = stamp.hash.slice(0, 16)

    const response = {
      scanId,
      domain: cleanDomain,
      qrsScore,
      algorithms: scanResult.algorithms,
      certificates: scanResult.certificates,
      recommendations,
      tlsVersion: scanResult.tlsVersion,
      scannedAt: scanResult.scannedAt,
      error: scanResult.error,
      pqcStamp: {
        hash: stamp.hash,
        signature: stamp.signature.slice(0, 128) + '...',
        algorithm: stamp.algorithm,
        timestamp: stamp.timestamp,
      },
    }

    // Persist so /comply?scan=<id> can load it later
    storeScanResult({ ...response, createdAt: Date.now() })

    return NextResponse.json(
      response,
      {
        headers: {
          'X-PQC-Signature': stamp.signature.slice(0, 64),
          'X-PQC-Algorithm': 'ML-DSA-65',
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scan failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
