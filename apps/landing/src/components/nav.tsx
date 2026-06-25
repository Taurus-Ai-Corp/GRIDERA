"use client"

import { useState } from 'react'

const PRODUCTS = [
  { name: 'GRIDERA', href: '/', tag: 'Platform' },
  { name: 'Guard', href: '/guard', tag: 'AI Guardrails' },
  { name: 'Scan', href: '/scan', tag: 'PQC Scanner' },
  { name: 'Migrate', href: '/migrate', tag: 'PQC Migration' },
  { name: 'Comply', href: '/comply', tag: 'Risk Reports' },
  { name: 'Lend', href: '/lend', tag: 'MSME Lending' },
  { name: 'Asset', href: '/asset', tag: 'Crypto Assets' },
]

const NAV_LINKS = [
  { label: 'Products', href: '/#products' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [productOpen, setProductOpen] = useState(false)

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] border-b border-[var(--graphite-ghost)]"
      style={{
        background: 'var(--glass-bg, rgba(11,14,20,0.7))',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      }}
    >
      <div className="flex items-center justify-between h-16 max-w-[1200px] mx-auto px-6">
        <a href="/" className="flex flex-col shrink-0">
          <span className="font-[var(--font-heading)] text-[15px] font-bold tracking-[0.04em]">
            <span className="text-[var(--accent)]">GRIDERA</span>
          </span>
          <span className="font-mono text-[8px] tracking-[0.12em] uppercase text-[var(--graphite-light)]">
            by TAURUS AI Corp
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <div
            className="relative"
            onMouseEnter={() => setProductOpen(true)}
            onMouseLeave={() => setProductOpen(false)}
          >
            <button
              type="button"
              className="font-mono text-[11px] font-normal tracking-[0.08em] uppercase text-[var(--graphite-med)] hover:text-[var(--accent)] transition-colors duration-200 flex items-center gap-1"
              aria-expanded={productOpen}
            >
              Products
              <span
                className="inline-block transition-transform duration-200"
                style={{ transform: productOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                ↓
              </span>
            </button>

            {productOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[360px]">
                <div className="glass-surface p-4 grid grid-cols-2 gap-2">
                  {PRODUCTS.filter((p) => p.name !== 'GRIDERA').map((p) => (
                    <a
                      key={p.name}
                      href={p.href}
                      className="group block p-3 hover:bg-[rgba(0,204,170,0.06)] transition-colors"
                    >
                      <div className="font-[var(--font-heading)] text-[14px] font-medium text-[var(--graphite)] group-hover:text-[var(--accent)] transition-colors">
                        {p.name}
                      </div>
                      <div className="font-mono text-[9px] tracking-[0.08em] uppercase text-[var(--graphite-med)] mt-0.5">
                        {p.tag}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {NAV_LINKS.slice(1).map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-mono text-[11px] font-normal tracking-[0.08em] uppercase text-[var(--graphite-med)] hover:text-[var(--accent)] transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <a
            href="https://github.com/Taurus-Ai-Corp/GRIDERA"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] font-normal tracking-[0.08em] uppercase text-[var(--graphite-med)] hover:text-[var(--accent)] transition-colors duration-200"
          >
            GitHub
          </a>
          <a
            href="/scan"
            className="nav-cta-btn inline-flex items-center gap-2 font-mono text-[12px] font-medium tracking-[0.06em] uppercase px-5 py-[10px] transition-all duration-200 hover:-translate-y-px"
          >
            Free Scan
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="md:hidden font-mono text-[12px] text-[var(--graphite-med)] uppercase tracking-wider"
          aria-label="Toggle menu"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[var(--graphite-ghost)] bg-[var(--bone-deep)]">
          <div className="px-6 py-4 space-y-4">
            {PRODUCTS.map((p) => (
              <a
                key={p.name}
                href={p.href}
                className="block font-mono text-[12px] tracking-[0.08em] uppercase text-[var(--graphite-med)] hover:text-[var(--accent)]"
                onClick={() => setOpen(false)}
              >
                {p.name}
              </a>
            ))}
            <hr className="border-[var(--graphite-ghost)]" />
            {NAV_LINKS.slice(1).map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block font-mono text-[12px] tracking-[0.08em] uppercase text-[var(--graphite-med)] hover:text-[var(--accent)]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
