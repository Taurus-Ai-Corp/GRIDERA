import Link from 'next/link'
import { Check, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import { PricingCta } from './pricing-cta'

export const metadata: Metadata = {
  title: 'Pricing',
}

const PLANS = [
  {
    key: 'starter' as const,
    name: 'Starter',
    price: '€399',
    period: '/month',
    description: 'For small teams getting started with EU AI Act compliance.',
    featured: false,
    cta: 'Start Free Trial',
    features: [
      'Up to 3 AI systems',
      'EU AI Act risk classification',
      'Basic conformity assessment',
      'PDF report export',
      'Blockchain audit trail (Hedera HCS)',
      'Email support',
    ],
  },
  {
    key: 'growth' as const,
    name: 'Growth',
    price: '€899',
    period: '/month',
    description: 'For growing teams managing multiple AI systems and regulations.',
    featured: true,
    cta: 'Start Free Trial',
    features: [
      'Up to 20 AI systems',
      'Full EU AI Act + GDPR + DORA coverage',
      'PQC-signed documentation (ML-DSA-65)',
      'Sovereign AI report generation',
      'Advanced audit trail + HTS tokens',
      'ENISA PQC readiness assessment',
      'Priority support',
      'API access',
    ],
  },
  {
    key: 'enterprise' as const,
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large enterprises with complex, multi-jurisdiction requirements.',
    featured: false,
    cta: 'Contact Sales',
    href: '/contact',
    features: [
      'Unlimited AI systems',
      'All regulations + custom framework',
      'Air-gapped / self-hosted deployment',
      'Custom Ollama/vLLM integration',
      'White-label options',
      'Dedicated compliance consultant',
      'SLA guarantees',
      'On-premises blockchain anchoring',
    ],
  },
]

export default function PricingPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="max-w-[1200px] mx-auto px-6 pt-20 pb-14 text-center">
        <span className="inline-block font-mono text-[11px] font-medium tracking-widest text-[#2563EB] uppercase mb-4 px-3 py-1 bg-[#EFF6FF] border border-[#BFDBFE] rounded-full">
          EUR Pricing — EU Jurisdiction
        </span>
        <h1
          className="font-heading font-bold text-graphite mb-4"
          style={{ fontSize: 'clamp(32px, 4.5vw, 52px)' }}
        >
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-graphite-med max-w-[500px] mx-auto">
          14-day free trial on all plans. No credit card required. Cancel anytime.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="max-w-[1200px] mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-brand p-7 flex flex-col ${
                plan.featured
                  ? 'bg-graphite text-white shadow-lg ring-2 ring-accent scale-[1.02]'
                  : 'bg-white border border-graphite-ghost shadow-sm'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center font-mono text-[10px] font-semibold uppercase tracking-widest text-white bg-accent px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan name + price */}
              <div className="mb-6">
                <h2
                  className={`font-heading text-lg font-bold mb-1 ${
                    plan.featured ? 'text-white' : 'text-graphite'
                  }`}
                >
                  {plan.name}
                </h2>
                <div className="flex items-end gap-1 mb-2">
                  <span
                    className={`font-heading text-4xl font-bold ${
                      plan.featured ? 'text-white' : 'text-graphite'
                    }`}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span
                      className={`text-sm pb-1.5 ${
                        plan.featured ? 'text-white/60' : 'text-graphite-light'
                      }`}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm leading-relaxed ${
                    plan.featured ? 'text-white/70' : 'text-graphite-med'
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-7">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      className="h-4 w-4 mt-0.5 shrink-0 text-accent"
                    />
                    <span
                      className={`text-sm ${
                        plan.featured ? 'text-white/85' : 'text-graphite-med'
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA — interactive for starter/growth, static link for enterprise */}
              {plan.key === 'enterprise' ? (
                <Link
                  href="/contact"
                  className={`inline-flex items-center justify-center gap-2 h-11 px-6 text-sm font-semibold rounded-brand transition-colors border border-graphite-ghost text-graphite hover:bg-graphite-whisper`}
                >
                  {plan.cta}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <PricingCTA plan={plan.key} featured={plan.featured} label={plan.cta} />
              )}
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-graphite-light mt-10">
          All prices in EUR, excluding VAT.{' '}
          <Link href="/contact" className="text-accent hover:underline">
            Contact us
          </Link>{' '}
          for annual billing discounts (up to 20% off).
        </p>
      </section>
    </div>
  )
}
