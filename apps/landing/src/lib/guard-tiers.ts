// GRIDERA|Guard — pricing tiers (in cents, EUR)
// Aligned with docs/superpowers/specs/GRIDERA-GUARD-SAAS-LAUNCH.md

export const GUARD_TIERS = {
  sandbox: {
    name: 'Sandbox',
    tagline: 'For evaluating PQC-attested guardrails',
    monthlyPrice: 0,
    annualMonthly: 0,
    priceLabel: 'Free',
    stripePriceId: null, // free tier — no checkout
    cta: 'Get Free API Key',
    ctaHref: '/guard/signup?tier=sandbox',
    popular: false,
    features: [
      '1,000 guard verifications / month',
      'EU AI Act + NIST AI RFM presets',
      'PQC-signed attestations (ML-DSA-65)',
      'Community support (Discord)',
      'No credit card required',
    ],
  },
  smb: {
    name: 'SMB',
    tagline: 'For production AI guardrails in your stack',
    monthlyPrice: 99_00, // €99
    annualMonthly: 79_00, // €79/mo billed annually
    priceLabel: '€99/mo',
    // Read at module load so the route can use pre-created Stripe Prices.
    // Set via `vercel env add STRIPE_GUARD_SMB_PRICE_ID production` with
    // a `price_xxx` ID from your Stripe dashboard.
    stripePriceId: process.env['STRIPE_GUARD_SMB_PRICE_ID'] ?? null,
    cta: 'Start 14-day Trial',
    ctaHref: '/guard/checkout?tier=smb',
    popular: true,
    features: [
      '100,000 guard verifications / month',
      'PQC attestations + Hedera HCS anchoring',
      'EU AI Act + NIST AI RMF + SOC 2 presets',
      '3 jurisdiction configs (EU, NA, AE)',
      'Email support (24h response)',
      'API key + dashboard',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    tagline: 'For regulated industries & sovereign deployments',
    monthlyPrice: 299_00, // €299
    annualMonthly: 249_00, // €249/mo billed annually
    priceLabel: '€299/mo',
    // Read at module load. Set via `vercel env add STRIPE_GUARD_ENT_PRICE_ID production`.
    stripePriceId: process.env['STRIPE_GUARD_ENT_PRICE_ID'] ?? null,
    cta: 'Start 14-day Trial',
    ctaHref: '/guard/checkout?tier=enterprise',
    popular: false,
    features: [
      'Unlimited verifications',
      'PQC + HCS + custom audit retention',
      'All presets + custom rule engine',
      'All jurisdictions + on-prem option',
      'BYO-Cloud (your NIM endpoint, your VPC)',
      'Priority support (4h response, dedicated Slack)',
      'Custom SLAs and DPA',
    ],
  },
} as const

export type GuardTier = keyof typeof GUARD_TIERS
