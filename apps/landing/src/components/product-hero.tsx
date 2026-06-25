"use client"

interface ProductHeroProps {
  eyebrow: string
  title: React.ReactNode
  description: string
  cta?: { label: string; href: string }
  secondary?: { label: string; href: string }
  badge?: string
}

export default function ProductHero({ eyebrow, title, description, cta, secondary, badge }: ProductHeroProps) {
  return (
    <section className="relative pt-32 pb-20 px-6 text-center border-b border-[var(--graphite-ghost)]">
      <div className="max-w-[1200px] mx-auto relative z-10">
        {badge && (
          <div className="inline-flex items-center gap-2 font-mono text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--accent)] mb-6 px-3 py-[6px] border border-[var(--accent)]">
            <span className="inline-block w-[6px] h-[6px] rounded-full bg-[var(--accent)] dot-pulse" />
            {badge}
          </div>
        )}
        <div className="inline-flex items-center gap-3 font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--accent)] mb-6 px-4 py-[6px] border border-[var(--accent)]">
          <span className="block w-5 h-px bg-[var(--accent)]" aria-hidden="true" />
          {eyebrow}
        </div>

        <h1
          className="font-[var(--font-heading)] font-bold leading-[1.06] tracking-[-0.03em] mb-6"
          style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
        >
          {title}
        </h1>

        <p className="text-[18px] text-[var(--graphite-med)] leading-[1.7] mb-10 max-w-[680px] mx-auto">
          {description}
        </p>

        {(cta || secondary) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {cta && (
              <a href={cta.href} className="btn-primary">
                {cta.label}
                <span aria-hidden="true">→</span>
              </a>
            )}
            {secondary && (
              <a href={secondary.href} className="btn-secondary">
                {secondary.label}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
