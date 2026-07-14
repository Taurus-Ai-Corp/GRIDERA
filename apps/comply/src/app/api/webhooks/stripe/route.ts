import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { logAuditEvent } from '@/lib/audit-logger'
import { getDb } from '@/lib/db'
import { eq } from 'drizzle-orm'

// Stripe webhooks must read the raw body — do NOT parse as JSON before verifying
export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: Request) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      console.warn('[webhooks/stripe] Stripe not configured — ignoring webhook')
      return NextResponse.json({ received: true })
    }

    const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET']
    if (!webhookSecret) {
      console.error('[webhooks/stripe] STRIPE_WEBHOOK_SECRET not set')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const sig = req.headers.get('stripe-signature')
    if (!sig) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    const rawBody = await req.text()

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    } catch (err) {
      console.error('[webhooks/stripe] Signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`[webhooks/stripe] Received event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.['userId'] ?? 'unknown'
        const plan = session.metadata?.['plan'] ?? 'unknown'
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? ''
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? ''

        console.log(`[webhooks/stripe] Checkout completed: userId=${userId} plan=${plan} customer=${customerId} subscription=${subscriptionId}`)

        // Persist stripeCustomerId and plan to user record (fire-and-forget)
        void persistSubscription(userId, customerId, plan as 'starter' | 'growth')

        // Log to PQC-signed audit trail
        void logAuditEvent({
          userId,
          entityType: 'system',
          entityId: subscriptionId || session.id,
          action: 'created',
          details: `Stripe checkout completed — plan=${plan} customer=${customerId} subscription=${subscriptionId}`,
        })
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.['userId'] ?? 'unknown'
        const status = subscription.status

        console.log(`[webhooks/stripe] Subscription updated: userId=${userId} status=${status}`)

        void logAuditEvent({
          userId,
          entityType: 'system',
          entityId: subscription.id,
          action: 'updated',
          details: `Stripe subscription updated — status=${status}`,
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.['userId'] ?? 'unknown'
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? ''

        console.log(`[webhooks/stripe] Subscription cancelled: userId=${userId} id=${subscription.id}`)

        // Downgrade user to free plan (fire-and-forget)
        void downgradeUser(customerId)

        void logAuditEvent({
          userId,
          entityType: 'system',
          entityId: subscription.id,
          action: 'updated',
          details: `Stripe subscription cancelled — id=${subscription.id}`,
        })
        break
      }

      default:
        console.log(`[webhooks/stripe] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[webhooks/stripe] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ─── DB Persistence (fire-and-forget, never blocks response) ─────────────────

async function persistSubscription(userId: string, stripeCustomerId: string, plan: 'starter' | 'growth'): Promise<void> {
  try {
    const db = getDb()
    if (!db) return
    const { users } = await import('@taurus/db')
    // Prefer internal user id (JWT auth). Fall back to legacy clerk_id column only if needed.
    const byId = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true },
    })
    if (byId) {
      await db.update(users).set({ stripeCustomerId, plan }).where(eq(users.id, userId))
      return
    }
    await db.update(users).set({ stripeCustomerId, plan }).where(eq(users.clerkId, userId))
  } catch (err) {
    console.error('[webhooks/stripe] Failed to persist subscription:', err)
  }
}

async function downgradeUser(stripeCustomerId: string): Promise<void> {
  try {
    const db = getDb()
    if (!db) return
    const { users } = await import('@taurus/db')
    await db.update(users)
      .set({ plan: 'free' })
      .where(eq(users.stripeCustomerId, stripeCustomerId))
  } catch (err) {
    console.error('[webhooks/stripe] Failed to downgrade user:', err)
  }
}
