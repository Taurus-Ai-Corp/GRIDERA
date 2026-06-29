'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, Shield, Cpu, Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 1 | 2 | 3 | 4

const STEPS = [
  { id: 1 as const, label: 'Organization', icon: Building2 },
  { id: 2 as const, label: 'Team', icon: Users },
  { id: 3 as const, label: 'Framework', icon: Shield },
  { id: 4 as const, label: 'First System', icon: Cpu },
]

const INDUSTRIES = [
  { value: 'finance', label: 'Financial Services' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'government', label: 'Government' },
  { value: 'technology', label: 'Technology' },
  { value: 'defense', label: 'Defense' },
  { value: 'education', label: 'Education' },
  { value: 'employment', label: 'Employment / HR' },
  { value: 'other', label: 'Other' },
] as const

const ORG_SIZES = [
  { value: '1-10', label: '1–10 employees' },
  { value: '11-50', label: '11–50 employees' },
  { value: '51-200', label: '51–200 employees' },
  { value: '201-1000', label: '201–1,000 employees' },
  { value: '1000+', label: '1,000+ employees' },
] as const

const FRAMEWORKS = [
  { value: 'eu-ai-act', label: 'EU AI Act', description: 'European Union Artificial Intelligence Act (Regulation 2024/1689)' },
  { value: 'nist-ai-rmf', label: 'NIST AI RMF', description: 'US National Institute of Standards and Technology AI Risk Management Framework' },
  { value: 'dpdp-act', label: 'DPDP Act', description: 'India Digital Personal Data Protection Act 2023' },
  { value: 'adgm-guidance', label: 'ADGM Guidance', description: 'Abu Dhabi Global Market AI & Data Governance Framework' },
] as const

const AUTONOMY_LEVELS = [
  { value: 'advisory', label: 'Advisory', description: 'AI provides recommendations, humans make decisions' },
  { value: 'semi-autonomous', label: 'Semi-Autonomous', description: 'AI makes some decisions with human oversight' },
  { value: 'fully-autonomous', label: 'Fully Autonomous', description: 'AI operates independently with minimal human intervention' },
] as const

interface OrgData {
  name: string
  industry: string
  size: string
}

interface SystemData {
  name: string
  description: string
  autonomyLevel: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Organization
  const [org, setOrg] = useState<OrgData>({ name: '', industry: 'technology', size: '1-10' })

  // Step 2: Team (placeholder — invites deferred to Phase 2.2)
  const [teamSkipped, setTeamSkipped] = useState(false)

  // Step 3: Framework
  const [framework, setFramework] = useState('eu-ai-act')

  // Step 4: First system
  const [system, setSystem] = useState<SystemData>({ name: '', description: '', autonomyLevel: 'advisory' })

  function canProceed(): boolean {
    switch (step) {
      case 1: return org.name.trim().length >= 2
      case 2: return true // team invites are optional
      case 3: return !!framework
      case 4: return system.name.trim().length >= 2
    }
  }

  async function handleComplete() {
    setSaving(true)
    setError(null)

    try {
      // Create organization
      const orgRes = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: org.name, industry: org.industry, size: org.size }),
      })
      if (!orgRes.ok) {
        const data = await orgRes.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to create organization')
      }

      // Register first system
      const sysRes = await fetch('/api/systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: system.name,
          description: system.description,
          autonomyLevel: system.autonomyLevel,
          industry: org.industry,
        }),
      })
      if (!sysRes.ok) {
        const data = await sysRes.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to register system')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-heading text-2xl font-bold text-graphite">
          Welcome to GRIDERA|Comply
        </h1>
        <p className="text-sm text-graphite-med mt-1">
          Let&apos;s set up your compliance workspace in a few steps.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1 mb-8">
        {STEPS.map((s) => {
          const Icon = s.icon
          const isActive = s.id === step
          const isDone = s.id < step
          return (
            <div key={s.id} className="flex items-center gap-1">
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  isActive && 'bg-accent text-white',
                  isDone && 'bg-accent-light text-accent',
                  !isActive && !isDone && 'bg-graphite-whisper text-graphite-light',
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {s.id < 4 && (
                <ChevronRight className={cn('h-3 w-3', s.id < step ? 'text-accent' : 'text-graphite-faint')} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="rounded-brand border border-graphite-ghost bg-white p-6 space-y-5">
        {step === 1 && (
          <>
            <div>
              <h2 className="font-heading font-semibold text-graphite mb-1">Create Your Organization</h2>
              <p className="text-xs text-graphite-med">This is your company or team that will manage AI compliance.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-light mb-1.5">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={org.name}
                  onChange={(e) => setOrg({ ...org, name: e.target.value })}
                  placeholder="Acme Corp"
                  className="w-full h-10 px-3 text-sm border border-graphite-ghost rounded-brand bg-white text-graphite placeholder:text-graphite-faint focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-light mb-1.5">
                  Industry
                </label>
                <select
                  value={org.industry}
                  onChange={(e) => setOrg({ ...org, industry: e.target.value })}
                  className="w-full h-10 px-3 text-sm border border-graphite-ghost rounded-brand bg-white text-graphite focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  {INDUSTRIES.map((i) => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-light mb-1.5">
                  Company Size
                </label>
                <select
                  value={org.size}
                  onChange={(e) => setOrg({ ...org, size: e.target.value })}
                  className="w-full h-10 px-3 text-sm border border-graphite-ghost rounded-brand bg-white text-graphite focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  {ORG_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="font-heading font-semibold text-graphite mb-1">Invite Your Team</h2>
              <p className="text-xs text-graphite-med">Add team members to collaborate on compliance. You can skip this and invite later.</p>
            </div>

            <div className="rounded-brand border border-dashed border-graphite-ghost p-8 text-center">
              <Users className="h-8 w-8 text-graphite-faint mx-auto mb-3" />
              <p className="text-sm text-graphite-med mb-1">Team invites coming soon</p>
              <p className="text-xs text-graphite-light">
                You&apos;ll be able to invite CISOs, CTOs, and auditors with role-based access.
                For now, continue as the primary admin.
              </p>
            </div>

            {!teamSkipped && (
              <button
                onClick={() => setTeamSkipped(true)}
                className="text-xs text-accent hover:underline"
              >
                Skip for now — I&apos;ll invite my team later
              </button>
            )}
            {teamSkipped && (
              <p className="text-xs text-graphite-light flex items-center gap-1">
                <Check className="h-3 w-3 text-green-600" />
                Skipped — you can invite team members anytime from Settings.
              </p>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h2 className="font-heading font-semibold text-graphite mb-1">Select Compliance Framework</h2>
              <p className="text-xs text-graphite-med">Choose the primary regulatory framework for your assessments.</p>
            </div>

            <div className="space-y-2">
              {FRAMEWORKS.map((fw) => (
                <label
                  key={fw.value}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-brand border cursor-pointer transition-colors',
                    framework === fw.value
                      ? 'border-accent bg-accent-light'
                      : 'border-graphite-ghost hover:border-graphite-light',
                  )}
                >
                  <input
                    type="radio"
                    name="framework"
                    value={fw.value}
                    checked={framework === fw.value}
                    onChange={(e) => setFramework(e.target.value)}
                    className="mt-0.5 accent-accent"
                  />
                  <div>
                    <p className="text-sm font-medium text-graphite">{fw.label}</p>
                    <p className="text-xs text-graphite-med mt-0.5">{fw.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div>
              <h2 className="font-heading font-semibold text-graphite mb-1">Register Your First AI System</h2>
              <p className="text-xs text-graphite-med">Add an AI system to begin your compliance assessment.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-light mb-1.5">
                  System Name
                </label>
                <input
                  type="text"
                  value={system.name}
                  onChange={(e) => setSystem({ ...system, name: e.target.value })}
                  placeholder="Customer Support Chatbot"
                  className="w-full h-10 px-3 text-sm border border-graphite-ghost rounded-brand bg-white text-graphite placeholder:text-graphite-faint focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-light mb-1.5">
                  Description
                </label>
                <textarea
                  value={system.description}
                  onChange={(e) => setSystem({ ...system, description: e.target.value })}
                  placeholder="What does this AI system do? What data does it process?"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-graphite-ghost rounded-brand bg-white text-graphite placeholder:text-graphite-faint focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite-light mb-1.5">
                  Autonomy Level
                </label>
                <div className="space-y-2">
                  {AUTONOMY_LEVELS.map((level) => (
                    <label
                      key={level.value}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-brand border cursor-pointer transition-colors',
                        system.autonomyLevel === level.value
                          ? 'border-accent bg-accent-light'
                          : 'border-graphite-ghost hover:border-graphite-light',
                      )}
                    >
                      <input
                        type="radio"
                        name="autonomy"
                        value={level.value}
                        checked={system.autonomyLevel === level.value}
                        onChange={(e) => setSystem({ ...system, autonomyLevel: e.target.value })}
                        className="mt-0.5 accent-accent"
                      />
                      <div>
                        <p className="text-sm font-medium text-graphite">{level.label}</p>
                        <p className="text-xs text-graphite-med mt-0.5">{level.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-brand px-3 py-2">{error}</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep((step - 1) as Step)}
          disabled={step === 1}
          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium border border-graphite-ghost rounded-brand text-graphite hover:bg-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep((step + 1) as Step)}
            disabled={!canProceed()}
            className="inline-flex items-center gap-1.5 h-9 px-5 text-sm font-semibold rounded-brand bg-accent text-white hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => void handleComplete()}
            disabled={!canProceed() || saving}
            className="inline-flex items-center gap-1.5 h-9 px-5 text-sm font-semibold rounded-brand bg-accent text-white hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Complete Setup
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
