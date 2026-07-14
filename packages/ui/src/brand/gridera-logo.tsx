import * as React from 'react'
import { cn } from '../lib/utils.js'

interface GrideraLogoProps {
  /** 'icon' = grid only, 'mark' = grid + wordmark, 'wordmark' = text only */
  variant?: 'icon' | 'mark' | 'wordmark'
  /** Override teal accent color */
  color?: string
  /** Size in px — controls the grid icon height */
  size?: number
  /** Show "GRIDERA Compliance" subtitle (only in 'mark' variant) */
  showSubtitle?: boolean
  className?: string
}

/**
 * GRIDERA|Comply logo — 3x3 grid mesh with diagonal lattice bonds.
 *
 * 9 nodes in a regular grid + 4 diagonal lattice connections + Q tail
 * breaking symmetry bottom-right. Center node enlarged (governance).
 * Concept B: pure "grid" minimalism.
 */
export function GrideraLogo({
  variant = 'mark',
  color = '#00CCAA',
  size = 32,
  showSubtitle = false,
  className,
}: GrideraLogoProps) {
  const gridMesh = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="gridera-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid lines (horizontal + vertical) */}
      <g stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity="0.3">
        <line x1="20" y1="20" x2="50" y2="20" />
        <line x1="50" y1="20" x2="80" y2="20" />
        <line x1="20" y1="50" x2="50" y2="50" />
        <line x1="50" y1="50" x2="80" y2="50" />
        <line x1="20" y1="80" x2="50" y2="80" />
        <line x1="50" y1="80" x2="80" y2="80" />
        <line x1="20" y1="20" x2="20" y2="50" />
        <line x1="20" y1="50" x2="20" y2="80" />
        <line x1="50" y1="20" x2="50" y2="50" />
        <line x1="50" y1="50" x2="50" y2="80" />
        <line x1="80" y1="20" x2="80" y2="50" />
        <line x1="80" y1="50" x2="80" y2="80" />
        {/* Diagonal lattice bonds */}
        <line x1="20" y1="20" x2="50" y2="50" />
        <line x1="50" y1="20" x2="80" y2="50" />
        <line x1="20" y1="50" x2="50" y2="80" />
        <line x1="50" y1="50" x2="80" y2="80" />
        {/* Q tail */}
        <line x1="80" y1="80" x2="95" y2="95" />
      </g>

      {/* Grid nodes */}
      <g filter="url(#gridera-glow)">
        <circle cx="20" cy="20" r="3" fill={color} />
        <circle cx="50" cy="20" r="3" fill={color} />
        <circle cx="80" cy="20" r="3" fill={color} />
        <circle cx="20" cy="50" r="3" fill={color} />
        <circle cx="50" cy="50" r="4.5" fill={color} />
        <circle cx="80" cy="50" r="3" fill={color} />
        <circle cx="20" cy="80" r="3" fill={color} />
        <circle cx="50" cy="80" r="3" fill={color} />
        <circle cx="80" cy="80" r="3" fill={color} />
        <circle cx="95" cy="95" r="2" fill={color} />
      </g>
    </svg>
  )

  if (variant === 'icon') {
    return (
      <span className={cn('inline-flex items-center', className)} aria-label="GRIDERA|Comply">
        {gridMesh}
      </span>
    )
  }

  if (variant === 'wordmark') {
    return (
      <span
        className={cn('inline-flex flex-col font-[var(--font-heading)] tracking-tight', className)}
        aria-label="GRIDERA|Comply"
      >
        <span className="flex items-baseline gap-0.5">
          <span className="font-bold">GRIDERA</span>
          <span className="text-[var(--graphite-faint)] mx-0.5">|</span>
          <span className="font-bold" style={{ color }}>COMPLY</span>
        </span>
        {showSubtitle && (
          <span className="text-[0.55em] font-normal tracking-[0.15em] text-[var(--graphite-light)] uppercase">
            GRIDERA Compliance
          </span>
        )}
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)} aria-label="GRIDERA|Comply">
      {gridMesh}
      <span className="inline-flex flex-col font-[var(--font-heading)] tracking-tight leading-tight">
        <span className="flex items-baseline gap-0.5">
          <span className="font-bold">GRIDERA</span>
          <span className="text-[var(--graphite-faint)] mx-0.5">|</span>
          <span className="font-bold" style={{ color }}>COMPLY</span>
        </span>
        {showSubtitle && (
          <span className="text-[0.55em] font-normal tracking-[0.15em] text-[var(--graphite-light)] uppercase">
            GRIDERA Compliance
          </span>
        )}
      </span>
    </span>
  )
}
