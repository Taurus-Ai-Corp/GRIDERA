import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createDb } from '@taurus/db'
import { createGuardKey } from '@taurus/db/guard-keys'
import { getResend } from '@/lib/billing'

// Executor URL used in examples and emails.
// Prefer eu.q-grid.net rewrite → guard-beryl; override via NEXT_PUBLIC_GUARD_EXECUTOR_URL.
function getExecutorUrl(): string {
  return (
    process.env['NEXT_PUBLIC_GUARD_EXECUTOR_URL'] ??
    'https://eu.q-grid.net/guard/v1/execute'
  )
}

function getDb() {
  const databaseUrl = process.env['DATABASE_URL']
  if (!databaseUrl) return null
  return createDb(databaseUrl)
}

// POST /api/guard/signup — free sandbox tier signup
// No Stripe, no payment. Just email → API key persisted to DB.
const signupSchema = z.object({
  email: z.string().email(),
  useCase: z.string().max(500).optional(),
})

export async function POST(req: Request) {
  try {
    const db = getDb()
    if (!db) {
      console.error('[guard/signup] DATABASE_URL not configured')
      return NextResponse.json(
        {
          error: 'Database not configured',
          hint: 'DATABASE_URL is not set. Add it via `vercel env add DATABASE_URL production`.',
        },
        { status: 503 },
      )
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { email, useCase } = parsed.data
    const normalizedEmail = email.trim().toLowerCase()

    // Create a new sandbox key on every signup. If an active record exists for this
    // email, the unique constraint forces an upsert-like update of the hash/prefix.
    const { record, apiKey } = await createGuardKey({
      db,
      email: normalizedEmail,
      tier: 'sandbox',
      monthlyLimit: 1000,
    })

    if (!record) {
      return NextResponse.json({ error: 'Failed to create or update key' }, { status: 500 })
    }

    // Email the API key
    const resend = getResend()
    const executorUrl = getExecutorUrl()
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
          <pre style="background: #151515; padding: 12px; border-radius: 6px; overflow-x: auto; color: #e0e0e0;"><code>curl -X POST ${executorUrl} \\
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

    console.log(`[guard/signup] Sandbox key issued: ${normalizedEmail} id=${record.id}`)

    const redirectUrl = `/guard/success?key=${encodeURIComponent(apiKey)}&email=${encodeURIComponent(normalizedEmail)}&tier=sandbox`

    return NextResponse.json({
      apiKey,
      tier: 'sandbox',
      message: 'Sandbox key issued. Check your email for a copy.',
      redirectUrl,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[guard/signup] Error:', err)
    return NextResponse.json({ error: 'Signup failed', detail: message }, { status: 500 })
  }
}
