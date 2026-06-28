import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getStripe, getStripeInitError } from '@/lib/billing'
import { GUARD_TIERS, type GuardTier } from '@/lib/guard-tiers'

const checkoutSchema = z.object({
  tier: z.enum(['smb', 'enterprise']),
  email: z.string().email(),
  annual: z.boolean().optional().default(false),
})

// POST /api/guard/checkout — start Stripe Checkout for a Guard subscription
// Free (sandbox) tier skips Stripe and goes to /guard/signup instead.
//
// Pricing strategy:
//   - When STRIPE_GUARD_SMB_PRICE_ID / STRIPE_GUARD_ENT_PRICE_ID env vars are
//     set, use those pre-created Stripe Price IDs (recommended — keeps the
//     product catalogue in one place).
//   - When the env vars are missing, fall back to inline price_data so the
//     route still works for local dev / first-time setup.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { tier, email, annual } = parsed.data
    const plan = GUARD_TIERS[tier as GuardTier]

    const stripe = getStripe()
    if (!stripe) {
      const initError = getStripeInitError()
      return NextResponse.json(
        {
          error: 'Billing not configured',
          hint: initError
            ? `Stripe client failed to initialise: ${initError}`
            : 'STRIPE_SECRET_KEY is not set in the production environment. Add it via `vercel env add STRIPE_SECRET_KEY production`.',
        },
        { status: 503 },
      )
    }

    const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'

    // Prefer pre-created Stripe Price IDs over inline price_data.
    const preCreatedPriceId = plan.stripePriceId

    const lineItem = preCreatedPriceId
      ? { price: preCreatedPriceId, quantity: 1 }
      : (() => {
          const unitAmount = annual ? plan.annualMonthly * 12 : plan.monthlyPrice
          const interval = annual ? ('year' as const) : ('month' as const)
          return {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `GRIDERA|Guard ${plan.name}`,
                description: plan.tagline,
              },
              unit_amount: unitAmount,
              recurring: { interval },
            },
            quantity: 1,
          }
        })()

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [lineItem],
      // 14-day trial — no charge until day 15
      subscription_data: {
        trial_period_days: 14,
        metadata: { tier, email },
      },
      success_url: `${appUrl}/guard/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/guard`,
      metadata: { tier, email },
      // Allow promo codes
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    // Surface the actual Stripe error message so debugging from curl/Vercel logs is possible.
    const message = err instanceof Error ? err.message : 'Unknown error'
    const stripeError =
      err && typeof err === 'object' && 'raw' in err
        ? (err as { raw?: { message?: string; code?: string; type?: string } }).raw
        : undefined
    console.error('[guard/checkout] Error:', message, stripeError)
    return NextResponse.json(
      {
        error: 'Checkout failed',
        detail: message,
        stripeCode: stripeError?.code,
        stripeType: stripeError?.type,
      },
      { status: 500 },
    )
  }
}
