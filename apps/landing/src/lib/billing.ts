import Stripe from 'stripe'

let _stripe: Stripe | null = null
let _stripeInitError: string | null = null

export function getStripe(): Stripe | null {
  const key = process.env['STRIPE_SECRET_KEY']
  if (!key) return null
  if (!_stripe) {
    try {
      _stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
    } catch (err) {
      _stripeInitError = err instanceof Error ? err.message : String(err)
      console.error('[billing] Stripe client init failed:', _stripeInitError)
      return null
    }
  }
  return _stripe
}

// Diagnostic: returns the most recent Stripe client-init error (if any).
// Used by /api/guard/checkout to surface root cause in the 500 response.
export function getStripeInitError(): string | null {
  return _stripeInitError
}

export function getResend(): { apiKey: string; from: string } | null {
  const apiKey = process.env['RESEND_API_KEY']
  if (!apiKey) return null
  return { apiKey, from: process.env['RESEND_FROM_EMAIL'] ?? 'GRIDERA <noreply@q-grid.net>' }
}
