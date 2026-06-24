import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getStripe, PLANS } from '@/lib/stripe'

const checkoutSchema = z.object({
  plan: z.enum(['starter', 'growth']),
  annual: z.boolean().optional().default(false),
})

export async function POST(req: Request) {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { plan: planKey, annual } = parsed.data
    const plan = PLANS[planKey]
    const priceMonthly = plan.priceMonthly
    if (!priceMonthly) {
      return NextResponse.json({ error: 'Plan not available for checkout' }, { status: 400 })
    }

    const unitAmount = annual ? Math.round(priceMonthly * 0.8 * 12) : priceMonthly
    const interval = annual ? ('year' as const) : ('month' as const)

    const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      // Dynamic payment methods — Stripe auto-selects based on user location/wallet
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: { name: `GRIDERA Comply ${plan.name}` },
            unit_amount: unitAmount,
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?billing=success`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { userId: authUser.id, plan: planKey },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[billing/checkout] Error:', error)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}