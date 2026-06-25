interface ProductSectionProps {
  id?: string
  eyebrow?: string
  title: string
  children: React.ReactNode
  className?: string
  bg?: 'bone' | 'bone-deep'
}

export default function ProductSection({ id, eyebrow, title, children, className = '', bg = 'bone' }: ProductSectionProps) {
  return (
    <section id={id} className={`py-24 ${bg === 'bone-deep' ? 'bg-[var(--bone-deep)] border-y border-[var(--graphite-ghost)]' : 'bg-[var(--bone)]'} ${className}`}>
      <div className={`max-w-[1200px] mx-auto px-6 ${!eyebrow ? '' : ''}`}>
        {eyebrow && (
          <div className="flex items-baseline gap-4 mb-10">
            <span className="font-mono text-[14px] text-[var(--accent)] tracking-[0.02em]">§</span>
            <div>
              <h2 className="font-[var(--font-heading)] text-[28px] md:text-[36px] font-semibold tracking-[-0.02em] leading-[1.2] text-[var(--graphite)]">
                {title}
              </h2>
              <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--graphite-med)] mt-1">
                {eyebrow}
              </p>
            </div>
          </div>
        )}
        {!eyebrow && (
          <h2 className="font-[var(--font-heading)] text-[28px] md:text-[36px] font-semibold tracking-[-0.02em] leading-[1.2] text-[var(--graphite)] mb-10">
            {title}
          </h2>
        )}
        {children}
      </div>
    </section>
  )
}
