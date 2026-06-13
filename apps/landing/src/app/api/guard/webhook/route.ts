import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe, getResend } from '@/lib/billing'

// In-memory store for MVP — replace with Neon DB in production
interface GuardCustomer {
  email: string
  stripeCustomerId: string
  subscriptionId: string
  tier: 'sandbox' | 'smb' | 'enterprise'
  apiKey: string
  createdAt: string
}

const customers = new Map<string, GuardCustomer>()

// Crypto-strong API key generator
function generateApiKey(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return 'grd_live_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// Email the customer their API key
async function emailApiKey(customer: GuardCustomer): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[guard/webhook] Resend not configured — skipping email')
    return
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #00ff88;">Welcome to GRIDERA|Guard</h1>
      <p>Your <strong>${customer.tier.toUpperCase()}</strong> subscription is active. Your API key is below.</p>
      <div style="background: #0a0a0a; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #333;">
        <code style="color: #00ff88; font-size: 14px; word-break: break-all;">${customer.apiKey}</code>
      </div>
      <p><strong>Try it now:</strong></p>
      <pre style="background: #151515; padding: 12px; border-radius: 6px; overflow-x: auto; color: #e0e0e0;"><code>curl -X POST https://guard.gridera.net/guard/v1/execute \\
  -H "X-API-Key: ${customer.apiKey}" \\
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
      to: customer.email,
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
    const stripe = getStripe()
    if (!stripe) {
      console.warn('[guard/webhook] Stripe not configured — ignoring webhook')
      return NextResponse.json({ received: true })
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
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? ''
        const apiKey = generateApiKey()

        const customer: GuardCustomer = {
          email,
          stripeCustomerId: customerId,
          subscriptionId,
          tier,
          apiKey,
          createdAt: new Date().toISOString(),
        }
        customers.set(customerId, customer)
        console.log(`[guard/webhook] Customer created: ${email} tier=${tier} key=${apiKey.slice(0, 16)}…`)

        // Fire-and-forget email
        void emailApiKey(customer)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? ''
        const existing = customers.get(customerId)
        if (existing) {
          console.log(`[guard/webhook] Subscription cancelled: ${existing.email}`)
          customers.delete(customerId)
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

// Dev helper: lookup customer (REMOVE in production)
export async function GET() {
  return NextResponse.json({
    count: customers.size,
    customers: Array.from(customers.values()).map((c) => ({
      email: c.email,
      tier: c.tier,
      createdAt: c.createdAt,
      apiKeyPreview: c.apiKey.slice(0, 16) + '…',
    })),
  })
}
