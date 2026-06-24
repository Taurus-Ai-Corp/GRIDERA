import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getStripe } from '@/lib/stripe'
import { getDb } from '@/lib/db'

// POST /api/billing/portal — create a Stripe Customer Portal session
// Looks up stripeCustomerId from the users table by Clerk ID.
export async function POST() {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
    }

    // Look up Stripe customer ID from DB
    const db = getDb()
    let customerId: string | null = null
    if (db) {
      const { users } = await import('@taurus/db')
      const row = await db.query.users.findFirst({
        where: eq(users.id, authUser.id),
        columns: { stripeCustomerId: true },
      })
      customerId = row?.stripeCustomerId ?? null
    }

    if (!customerId) {
      return NextResponse.json({ error: 'No billing account found — please subscribe first' }, { status: 400 })
    }

    const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/dashboard/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[billing/portal] Error:', error)
    return NextResponse.json({ error: 'Portal session failed' }, { status: 500 })
  }
}
