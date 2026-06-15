import { NextResponse } from 'next/server'
import {
  createDb,
  createGuardKey,
  activatePaidTier,
  findGuardKeyByEmail,
  findGuardKeyByCustomerId,
  rotateGuardKeyHash,
  revokeGuardKey,
} from '@taurus/db'
import { getStripe, getResend } from '@/lib/billing'
import type Stripe from 'stripe'

// Executor URL used in examples and emails.
// TODO: guard.gridera.net is currently NXDOMAIN. Set NEXT_PUBLIC_GUARD_EXECUTOR_URL
// in Vercel once DNS is fixed; otherwise requests will fail at runtime.
function getExecutorUrl(): string {
  return (
    process.env['NEXT_PUBLIC_GUARD_EXECUTOR_URL'] ??
    'https://guard.gridera.net/guard/v1/execute'
  )
}

function getDb() {
  const databaseUrl = process.env['DATABASE_URL']
  if (!databaseUrl) return null
  return createDb(databaseUrl)
}

// Shared, short-lived in-memory cache used only for the success page lookup.
// The webhook stores {apiKey, email, tier} keyed by Stripe session id; the lookup
// route reads it so the success page can display the key once. TTL is enforced
// in lookup with a 5-minute expiry. This is acceptable for the MVP but should be
// replaced by an encrypted/signed token or Redis before scaling horizontally.
export const checkoutSessionCache = new Map<
  string,
  { apiKey: string; email: string; tier: 'sandbox' | 'smb' | 'enterprise'; createdAt: number }
>()

function generateApiKey(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return 'grd_live_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function emailApiKey({
  email,
  apiKey,
  tier,
}: {
  email: string
  apiKey: string
  tier: 'sandbox' | 'smb' | 'enterprise'
}): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[guard/webhook] Resend not configured — skipping email')
    return
  }

  const executorUrl = getExecutorUrl()
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #00ff88;">Welcome to GRIDERA|Guard</h1>
      <p>Your <strong>${tier.toUpperCase()}</strong> subscription is active. Your API key is below.</p>
      <div style="background: #0a0a0a; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #333;">
        <code style="color: #00ff88; font-size: 14px; word-break: break-all;">${apiKey}</code>
      </div>
      <p><strong>Try it now:</strong></p>
      <pre style="background: #151515; padding: 12px; border-radius: 6px; overflow-x: auto; color: #e0e0e0;"><code>curl -X POST ${executorUrl} \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"input":"What is 2+2?","context":"math question"}'</code></pre>
      <p style="color: #888; font-size: 12px;">Save this key — it's only shown once. Manage your subscription at any time from your dashboard.</p>
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
      to: email,
      subject: 'Your GRIDERA|Guard API key',
      html,
    }),
  })
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: Request) {
  try {
    const db = getDb()
    const stripe = getStripe()
    if (!stripe) {
      console.warn('[guard/webhook] Stripe not configured — ignoring webhook')
      return NextResponse.json({ received: true })
    }

    if (!db) {
      console.error('[guard/webhook] DATABASE_URL not configured')
      return NextResponse.json({ received: false, error: 'Database not configured' }, { status: 503 })
    }

    const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET']
    if (!webhookSecret) {
      console.error('[guard/webhook] STRIPE_WEBHOOK_SECRET not set')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const sig = req.headers.get('stripe-signature')
    if (!sig) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    const rawBody = await req.text()
    // We do NOT send customer_email in the webhook handler for subscription.deleted
    // because the customer may have unsubscribed intentionally — keep the data, log it.
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[guard/webhook] Signature verification failed:', message)
      return NextResponse.json(
        { error: 'Invalid signature', detail: message },
        { status: 400 },
      )
    }

    console.log(`[guard/webhook] Event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const email = session.metadata?.['email'] ?? session.customer_email ?? ''
        const tier = (session.metadata?.['tier'] ?? 'smb') as 'sandbox' | 'smb' | 'enterprise'
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? ''
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? ''

        if (!email || !customerId || !subscriptionId) {
          console.warn('[guard/webhook] Missing checkout metadata', { email, customerId, subscriptionId })
          break
        }

        const normalizedEmail = email.trim().toLowerCase()
        let apiKey: string

        // If a sandbox record already exists for this email, promote it to paid.
        // Otherwise create a fresh paid key.
        const existing = await findGuardKeyByEmail(db, normalizedEmail)

        if (existing) {
          const paidTier = tier === 'sandbox' ? 'smb' : tier
          await activatePaidTier(db, normalizedEmail, customerId, subscriptionId, paidTier)
          apiKey = generateApiKey()
          await rotateGuardKeyHash(db, existing.id, apiKey).catch((err) => {
            console.error('[guard/webhook] Failed to rotate key hash for existing record:', err)
          })
        } else {
          const result = await createGuardKey({
            db,
            email: normalizedEmail,
            tier,
            monthlyLimit: tier === 'enterprise' ? 0 : 100_000,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          })
          apiKey = result.apiKey
        }

        checkoutSessionCache.set(session.id, {
          apiKey,
          email: normalizedEmail,
          tier,
          createdAt: Date.now(),
        })

        console.log(`[guard/webhook] Customer created/activated: ${normalizedEmail} tier=${tier} key=${apiKey.slice(0, 16)}…`)

        // Fire-and-forget email
        void emailApiKey({ email: normalizedEmail, apiKey, tier })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? ''
        const record = await findGuardKeyByCustomerId(db, customerId)
        if (record) {
          await revokeGuardKey(db, record.id)
          console.log(`[guard/webhook] Subscription cancelled: ${record.email}`)
        }
        break
      }

      default:
        console.log(`[guard/webhook] Unhandled: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[guard/webhook] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
