import { NextResponse } from 'next/server'
import { createDb } from '@taurus/db'
import { checkoutSessionCache } from '../webhook/route'

function getDb() {
  const databaseUrl = process.env['DATABASE_URL']
  if (!databaseUrl) return null
  return createDb(databaseUrl)
}

// GET /api/guard/lookup
//
// Looks up a completed checkout/session by:
//   - ?session_id=<Stripe Checkout session id>
//   - ?email=<customer email>
//
// Because API keys are only stored as hashes, the key can only be returned once
// immediately after checkout. We use a short-lived in-process cache shared with the
// webhook handler (5-minute TTL) to bridge the async webhook → success page flow.
// This is an MVP trade-off; replace with a signed/encrypted token or Redis before
// scaling horizontally.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')
    const email = searchParams.get('email')?.trim().toLowerCase()

    if (!sessionId && !email) {
      return NextResponse.json({ error: 'Provide session_id or email' }, { status: 400 })
    }

    // 1. Try the short-lived in-memory cache first so the success page can show the key.
    if (sessionId) {
      const cached = checkoutSessionCache.get(sessionId)
      if (cached && Date.now() - cached.createdAt < 5 * 60 * 1000) {
        return NextResponse.json({
          found: true,
          apiKey: cached.apiKey,
          email: cached.email,
          tier: cached.tier,
        })
      }
    }

    // 2. Fallback to DB lookup. We cannot return the plaintext key, but we can
    // confirm the account exists and which tier it has.
    const db = getDb()
    if (!db) {
      return NextResponse.json(
        { found: false, error: 'Database not configured' },
        { status: 503 },
      )
    }

    let record = null
    if (sessionId) {
      record = await db.query.guardKeys.findFirst({
        where: (k, { eq }) => eq(k.stripeSubscriptionId, sessionId),
      })
    }
    if (!record && email) {
      record = await db.query.guardKeys.findFirst({
        where: (k, { eq }) => eq(k.email, email),
      })
    }

    if (!record) {
      return NextResponse.json({ found: false })
    }

    return NextResponse.json({
      found: true,
      email: record.email,
      tier: record.tier as 'sandbox' | 'smb' | 'enterprise',
      apiKey: null,
      message: 'Check your email — your API key is on its way.',
    })
  } catch (err) {
    console.error('[guard/lookup] Error:', err)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
