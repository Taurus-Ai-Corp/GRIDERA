import Link from 'next/link'

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Free PQC Scan', href: 'https://q-grid.net/scan', external: true },
    { label: 'Dashboard', href: '/dashboard' },
  ],
  Company: [
    { label: 'GRIDERA', href: 'https://q-grid.net', external: true },
    { label: 'Contact', href: 'mailto:admin@taurusai.io', external: true },
    { label: 'GitHub', href: 'https://github.com/Taurus-Ai-Corp/GRIDERA', external: true },
    { label: 'Hedera', href: 'https://hedera.com', external: true },
  ],
  Legal: [
    { label: 'Privacy Policy', href: 'https://q-grid.net/privacy', external: true },
    { label: 'Terms of Service', href: 'https://q-grid.net/terms', external: true },
    { label: 'GDPR', href: 'https://q-grid.net/privacy#gdpr', external: true },
  ],
}

export function PublicFooter() {
  return (
    <footer className="bg-[#F3F4F6] border-t border-graphite-ghost">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Top: brand + columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="col-span-1">
            <div className="mb-3">
              <div className="font-heading text-base font-bold text-graphite">
                GRIDERA <span className="text-graphite-faint">|</span> <span className="text-accent">COMPLY</span>
              </div>
              <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-graphite-light mt-0.5">
                by TAURUS AI Corp
              </div>
            </div>
            <p className="text-sm text-graphite-med leading-relaxed max-w-[220px]">
              EU AI Act compliance automation with blockchain audit trails and
              post-quantum cryptography.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-graphite uppercase tracking-widest mb-4">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-graphite-med hover:text-graphite transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-graphite-med hover:text-graphite transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-graphite-ghost flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-graphite-light">
            © 2026 TAURUS AI Corp. Ontario, Canada | Dubai IFZA | Wyoming LLC
          </p>
          <p className="text-xs text-graphite-light">
            EU data residency:{' '}
            <span className="font-mono">eu-central-1</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
