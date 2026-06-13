import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getResend } from '@/lib/billing'

// Crypto-strong API key generator
function generateApiKey(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return 'grd_test_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// POST /api/guard/signup — free sandbox tier signup
// No Stripe, no payment. Just email → API key.
const signupSchema = z.object({
  email: z.string().email(),
  useCase: z.string().max(500).optional(),
})

// In-memory sandbox store (replace with DB in production)
const sandboxKeys = new Map<string, { email: string; apiKey: string; createdAt: string }>()

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { email, useCase } = parsed.data
    const normalizedEmail = email.trim().toLowerCase()

    // Idempotent — return existing key if email already signed up
    const existing = sandboxKeys.get(normalizedEmail)
    if (existing) {
      return NextResponse.json({
        apiKey: existing.apiKey,
        tier: 'sandbox',
        message: 'Welcome back — here is your existing key',
      })
    }

    const apiKey = generateApiKey()
    sandboxKeys.set(normalizedEmail, {
      email: normalizedEmail,
      apiKey,
      createdAt: new Date().toISOString(),
    })

    // Email the API key
    const resend = getResend()
    if (resend) {
      const html = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #00ff88;">Welcome to GRIDERA|Guard Sandbox</h1>
          <p>Your free API key is below. 1,000 verifications/month, no credit card required.</p>
          <div style="background: #0a0a0a; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #333;">
            <code style="color: #00ff88; font-size: 14px; word-break: break-all;">${apiKey}</code>
          </div>
          <p><strong>Try it now:</strong></p>
          <pre style="background: #151515; padding: 12px; border-radius: 6px; overflow-x: auto; color: #e0e0e0;"><code>curl -X POST https://guard.gridera.net/guard/v1/execute \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"input":"What is 2+2?","context":"math question"}'</code></pre>
          ${useCase ? `<p style="color: #888; font-size: 12px;">Your use case: ${useCase}</p>` : ''}
          <p style="color: #888; font-size: 12px;">Need more? Upgrade to SMB (€99/mo) for 100K verifications + Hedera HCS anchoring.</p>
        </body>
        </html>
      `

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resend.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resend.from,
          to: normalizedEmail,
          subject: 'Your GRIDERA|Guard sandbox API key',
          html,
        }),
      }).catch((err) => console.error('[guard/signup] Email send failed:', err))
    }

    console.log(`[guard/signup] Sandbox key issued: ${normalizedEmail}`)

    return NextResponse.json({
      apiKey,
      tier: 'sandbox',
      message: 'Sandbox key issued. Check your email for a copy.',
    })
  } catch (err) {
    console.error('[guard/signup] Error:', err)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}

// Dev helper: list sandbox signups (REMOVE in production)
export async function GET() {
  return NextResponse.json({
    count: sandboxKeys.size,
    keys: Array.from(sandboxKeys.values()).map((k) => ({
      email: k.email,
      createdAt: k.createdAt,
      apiKeyPreview: k.apiKey.slice(0, 16) + '…',
    })),
  })
}
