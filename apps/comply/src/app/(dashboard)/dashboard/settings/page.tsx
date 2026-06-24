'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { CreditCard, Building2, Cpu, Check, ExternalLink, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLANS, type PlanKey } from '@/lib/stripe'

type Tab = 'plan' | 'organization' | 'ai-provider'

const TABS: { id: Tab; label: string; icon: typeof CreditCard }[] = [
  { id: 'plan', label: 'Plan', icon: CreditCard },
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'ai-provider', label: 'AI Provider', icon: Cpu },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('plan')
  const { user } = useAuth()

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-graphite">Settings</h1>
        <p className="text-sm text-graphite-med mt-1">Manage your plan, organization, and AI preferences.</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-graphite-ghost mb-8">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-graphite-med hover:text-graphite hover:border-graphite-ghost',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'plan' && <PlanTab />}
      {activeTab === 'organization' && <OrganizationTab user={user} />}
      {activeTab === 'ai-provider' && <AIProviderTab />}
    </div>
  )
}

// ─── Plan Tab ─────────────────────────────────────────────────────────────────

function PlanTab() {
  const [loading, setLoading] = useState<PlanKey | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<PlanKey | null>(null)
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json() as Promise<{ plan: string | null; stripeCustomerId: string | null }>)
      .then((data) => {
        if (data.plan && data.plan !== 'free') setCurrentPlan(data.plan as PlanKey)
        if (data.stripeCustomerId) setHasStripeCustomer(true)
      })
      .catch(() => { /* ignore — fallback to no plan */ })
  }, [])

  const billingConfigured = !!process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY']

  async function handleCheckout(plan: PlanKey) {
    setLoading(plan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, annual: false }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        console.error('[settings/plan] Checkout error:', data.error)
        return
      }
      window.location.href = data.url
    } catch (err) {
      console.error('[settings/plan] Checkout fetch failed:', err)
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        console.error('[settings/plan] Portal error:', data.error)
        return
      }
      window.location.href = data.url
    } catch (err) {
      console.error('[settings/plan] Portal fetch failed:', err)
    } finally {
      setPortalLoading(false)
    }
  }

  // Stripe not configured in env
  if (!billingConfigured) {
    return (
      <div className="rounded-brand border border-graphite-ghost bg-graphite-whisper p-6">
        <p className="text-sm text-graphite-med">
          Billing is not configured in this environment.{' '}
          <a
            href="mailto:admin@taurusai.io"
            className="text-accent hover:underline"
          >
            Contact admin@taurusai.io
          </a>{' '}
          to enable Stripe billing.
        </p>
      </div>
    )
  }

  const activePlan = currentPlan ? PLANS[currentPlan] : null

  return (
    <div className="space-y-6">
      {/* Current plan status banner */}
      {currentPlan && activePlan ? (
        <div className="rounded-brand border border-accent bg-accent-light p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-graphite">
              Current plan: <span className="text-accent">{activePlan.name}</span>
            </p>
            <p className="text-xs text-graphite-med mt-0.5">
              €{((activePlan.priceMonthly ?? 0) / 100).toFixed(0)}/month
            </p>
          </div>
          {hasStripeCustomer && (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-semibold border border-graphite-ghost rounded-brand text-graphite hover:bg-white transition-colors disabled:opacity-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {portalLoading ? 'Loading…' : 'Manage Billing'}
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-brand border border-graphite-ghost bg-graphite-whisper p-4">
          <p className="text-sm text-graphite-med">
            No active plan. Choose a plan below to get started.
          </p>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(['starter', 'growth'] as const).map((planKey) => {
          const plan = PLANS[planKey]
          const isCurrent = currentPlan === planKey
          const isLoadingThis = loading === planKey

          return (
            <div
              key={planKey}
              className={cn(
                'rounded-brand border p-5 flex flex-col transition-shadow',
                isCurrent
                  ? 'border-accent ring-1 ring-accent shadow-sm'
                  : 'border-graphite-ghost hover:shadow-sm',
              )}
            >
              <div className="mb-4">
                <h3 className="font-heading font-bold text-graphite">{plan.name}</h3>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-2xl font-bold text-graphite">
                    €{((plan.priceMonthly ?? 0) / 100).toFixed(0)}
                  </span>
                  <span className="text-sm text-graphite-light pb-0.5">/month</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-graphite-med">
                    <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="h-9 flex items-center justify-center text-xs font-semibold text-accent">
                  Current plan
                </div>
              ) : (
                <button
                  onClick={() => void handleCheckout(planKey)}
                  disabled={isLoadingThis || loading !== null}
                  className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-semibold rounded-brand bg-accent text-white hover:bg-accent-dark transition-colors disabled:opacity-50"
                >
                  {isLoadingThis ? 'Loading…' : currentPlan ? 'Upgrade' : 'Start Free Trial'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Enterprise callout */}
      <div className="rounded-brand border border-graphite-ghost p-5 flex items-center justify-between">
        <div>
          <h3 className="font-heading font-semibold text-graphite">Enterprise</h3>
          <p className="text-sm text-graphite-med mt-0.5">
            Unlimited systems, sovereign AI, SSO/SAML, dedicated CSM.
          </p>
        </div>
        <a
          href="mailto:admin@taurusai.io"
          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-semibold border border-graphite-ghost rounded-brand text-graphite hover:bg-graphite-whisper transition-colors whitespace-nowrap"
        >
          Contact Sales
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <p className="text-xs text-graphite-light">
        All prices in EUR, excluding VAT. Annual billing available (20% discount) —{' '}
        <a href="mailto:admin@taurusai.io" className="text-accent hover:underline">
          contact us
        </a>
        .
      </p>
    </div>
  )
}

// ─── Organization Tab ─────────────────────────────────────────────────────────

interface OrganizationTabProps {
  user: {
    id?: string
    email?: string
    fullName?: string
    organizationId?: string
    plan?: string
  } | null
}

function OrganizationTab({ user }: OrganizationTabProps) {
  const jurisdiction = process.env['NEXT_PUBLIC_JURISDICTION'] ?? 'eu'

  const JURISDICTION_LABELS: Record<string, string> = {
    eu: 'European Union (EU AI Act + GDPR)',
    na: 'North America (NIST AI RMF)',
    in: 'India (DPDP Act)',
    ae: 'UAE (ADGM)',
  }

  return (
    <div className="space-y-6">
      <div className="rounded-brand border border-graphite-ghost divide-y divide-graphite-ghost">
        {/* Display name */}
        <div className="p-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-light mb-2">
            Display Name
          </label>
          <p className="text-sm text-graphite">
            {user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? '—'}
          </p>
        </div>

        {/* Email */}
        <div className="p-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-light mb-2">
            Email
          </label>
          <p className="text-sm text-graphite">
            {user?.primaryEmailAddress?.emailAddress ?? '—'}
          </p>
        </div>

        {/* Jurisdiction — read-only, set by deployment */}
        <div className="p-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-light mb-2">
            Jurisdiction
          </label>
          <p className="text-sm text-graphite">
            {JURISDICTION_LABELS[jurisdiction] ?? jurisdiction.toUpperCase()}
          </p>
          <p className="text-xs text-graphite-light mt-1">
            Jurisdiction is set at deployment and cannot be changed here.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── AI Provider Tab ──────────────────────────────────────────────────────────

function AIProviderTab() {
  const [mode, setMode] = useState<'cloud' | 'sovereign'>('cloud')
  const [sovereignUrl, setSovereignUrl] = useState('')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    // In production, persist to DB / user metadata via API
    console.log('[settings/ai-provider] Saving:', { mode, sovereignUrl })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-brand border border-graphite-ghost p-5 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-graphite mb-1">Report Generation Mode</h3>
          <p className="text-xs text-graphite-med">
            Choose how AI-generated compliance reports are produced.
          </p>
        </div>

        {/* Cloud option */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="ai-mode"
            value="cloud"
            checked={mode === 'cloud'}
            onChange={() => setMode('cloud')}
            className="mt-0.5 accent-accent"
          />
          <div>
            <p className="text-sm font-medium text-graphite">Cloud AI</p>
            <p className="text-xs text-graphite-med mt-0.5">
              Reports generated via GRIDERA AI Gateway (Gemini / OpenAI). Data leaves your network.
            </p>
          </div>
        </label>

        {/* Sovereign option */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="ai-mode"
            value="sovereign"
            checked={mode === 'sovereign'}
            onChange={() => setMode('sovereign')}
            className="mt-0.5 accent-accent"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-graphite">Sovereign AI</p>
            <p className="text-xs text-graphite-med mt-0.5">
              Reports generated by your own Ollama / vLLM instance. Data stays on-premises.
              Recommended for enterprise and regulated environments.
            </p>
          </div>
        </label>

        {/* Sovereign endpoint input */}
        {mode === 'sovereign' && (
          <div className="ml-6 space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-light mb-1.5">
                Endpoint URL
              </label>
              <input
                type="url"
                value={sovereignUrl}
                onChange={(e) => setSovereignUrl(e.target.value)}
                placeholder="http://localhost:11434/api/generate"
                className="w-full h-9 px-3 text-sm border border-graphite-ghost rounded-brand bg-white text-graphite placeholder:text-graphite-faint focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <p className="text-xs text-graphite-light mt-1">
                Ollama default: <code className="font-mono">http://localhost:11434/api/generate</code>
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        className={cn(
          'inline-flex items-center gap-2 h-9 px-5 text-sm font-semibold rounded-brand transition-colors',
          saved
            ? 'bg-green-600 text-white'
            : 'bg-accent text-white hover:bg-accent-dark',
        )}
      >
        {saved ? (
          <>
            <Check className="h-4 w-4" />
            Saved
          </>
        ) : (
          'Save Preferences'
        )}
      </button>
    </div>
  )
}
