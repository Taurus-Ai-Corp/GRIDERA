import { cn } from '@/lib/utils'

interface JurisdictionBadgeProps {
  jurisdiction: 'eu' | 'na' | 'in' | 'ae' | 'ca'
  size?: 'sm' | 'md'
  className?: string
}

const JURISDICTION_STYLES: Record<
  JurisdictionBadgeProps['jurisdiction'],
  { bg: string; label: string }
> = {
  eu: { bg: 'bg-[#2563EB]', label: 'EU' },
  na: { bg: 'bg-[#DC2626]', label: 'NA' },
  in: { bg: 'bg-[#EA580C]', label: 'IN' },
  ae: { bg: 'bg-[#059669]', label: 'AE' },
  ca: { bg: 'bg-[#DC2626]', label: 'CA' },
}

export function JurisdictionBadge({
  jurisdiction,
  size = 'md',
  className,
}: JurisdictionBadgeProps) {
  const { bg, label } = JURISDICTION_STYLES[jurisdiction]

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded font-mono font-semibold text-white uppercase tracking-wide',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        bg,
        className,
      )}
    >
      {label}
    </span>
  )
}
