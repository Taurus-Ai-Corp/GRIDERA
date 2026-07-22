'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  LayoutDashboard,
  Server,
  ClipboardCheck,
  FileText,
  Shield,
  History,
  GraduationCap,
  ShieldCheck,
  ScrollText,
  BadgeCheck,
  Activity,
  Settings,
  LogOut,
  LineChart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { JurisdictionBadge } from './jurisdiction-badge'

const CELL = (process.env['NEXT_PUBLIC_JURISDICTION'] ?? 'eu').toLowerCase() as
  | 'eu'
  | 'na'
  | 'in'
  | 'ae'
  | 'ca'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Executive', href: '/dashboard/executive', icon: LineChart },
  { label: 'AI Systems', href: '/dashboard/systems', icon: Server },
  { label: 'Assessments', href: '/dashboard/assessments', icon: ClipboardCheck },
  { label: 'Reports', href: '/dashboard/reports', icon: FileText },
  { label: 'Security', href: '/dashboard/security', icon: Shield },
  { label: 'Audit Trail', href: '/dashboard/audit', icon: History },
  { label: 'Education', href: '/dashboard/education', icon: GraduationCap },
  { label: 'Compliance', href: '/dashboard/compliance-matrix', icon: ShieldCheck },
  { label: 'Policies', href: '/dashboard/policies', icon: ScrollText },
  { label: 'SOC 2', href: '/dashboard/soc2', icon: BadgeCheck },
  { label: 'Observability', href: '/dashboard/observe', icon: Activity },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <aside className="fixed top-0 left-0 h-screen w-[260px] bg-white border-r border-graphite-ghost flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-graphite-ghost">
        <div className="flex items-center gap-2">
          <span className="font-heading text-base font-bold text-graphite">
            GRIDERA <span className="text-graphite-faint">|</span> <span className="text-accent">COMPLY</span>
          </span>
          <JurisdictionBadge jurisdiction={CELL} size="sm" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-brand text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent-light text-accent'
                      : 'text-graphite-med hover:bg-graphite-whisper hover:text-graphite',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Divider */}
        <div className="my-3 border-t border-graphite-ghost" />

        <ul>
          <li>
            <Link
              href="/dashboard/settings"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-brand text-sm font-medium transition-colors',
                pathname.startsWith('/dashboard/settings')
                  ? 'bg-accent-light text-accent'
                  : 'text-graphite-med hover:bg-graphite-whisper hover:text-graphite',
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />
              Settings
            </Link>
          </li>
        </ul>
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-graphite-ghost flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-accent-light flex items-center justify-center text-accent font-bold text-xs">
          {user?.email?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs text-graphite-med truncate block">
            {user?.email ?? 'Not signed in'}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="text-graphite-faint hover:text-graphite-med transition-colors"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )
}