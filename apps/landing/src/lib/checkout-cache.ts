/**
 * Short-lived in-memory cache handing a freshly-issued API key from the Stripe
 * webhook to the success page that polls for it.
 *
 * This lives here, and not in a route module, because App Router route files may
 * only export route handlers (GET/POST/…) and the recognised route config keys
 * (dynamic, revalidate, runtime, …). Exporting anything else — this Map, for
 * instance — makes the file fail Next.js's Route type contract with
 * "does not match the required types of a Next.js Route". `lookup/route.ts`
 * previously imported it straight from `webhook/route.ts`, which is what
 * triggered that error.
 *
 * Unchanged from the original: still process-local, still 5-minute expiry, and
 * still not durable across serverless instances. The pre-existing note applies —
 * replace with a signed token or Redis before scaling horizontally.
 */
export type CheckoutSessionEntry = {
  apiKey: string
  email: string
  tier: 'sandbox' | 'smb' | 'enterprise'
  createdAt: number
}

export const checkoutSessionCache = new Map<string, CheckoutSessionEntry>()
