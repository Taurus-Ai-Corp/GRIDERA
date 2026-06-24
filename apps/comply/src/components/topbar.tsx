'use client'

import { useAuth } from '@/lib/auth-context'
import { Bell } from 'lucide-react'

export function Topbar() {
  const { user } = useAuth()

  return (
    <header className="h-14 border-b border-graphite-ghost bg-white flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="text-sm font-medium text-graphite-med">
        {user?.email ?? 'Loading...'}
      </div>

      <div className="flex items-center gap-4">
        <button
          className="relative text-graphite-faint hover:text-graphite-med transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}