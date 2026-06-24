'use client'

import { useAuth } from '@/lib/auth-context'

export function PricingCta() {
  const { user } = useAuth()

  return (
    <div className="mt-8 text-center">
      {user ? (
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-brand bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-accent-dark transition-colors"
        >
          Go to Dashboard
        </a>
      ) : (
        <a
          href="/sign-in"
          className="inline-flex items-center justify-center rounded-brand bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-accent-dark transition-colors"
        >
          Get Started
        </a>
      )}
    </div>
  )
}