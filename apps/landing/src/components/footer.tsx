const FOOTER_LINKS = {
  Products: [
    { label: 'GRIDERA Platform', href: '/' },
    { label: 'GRIDERA Guard', href: '/guard' },
    { label: 'GRIDERA Scan', href: '/scan' },
    { label: 'GRIDERA Migrate', href: '/migrate' },
    { label: 'GRIDERA Comply', href: '/comply' },
    { label: 'GRIDERA Lend', href: '/lend' },
    { label: 'GRIDERA Asset', href: '/asset' },
  ],
  Resources: [
    { label: 'Pricing', href: '/pricing' },
    { label: 'Free PQC Scan', href: '/scan' },
    { label: 'Blog', href: '/blog' },
    { label: 'GitHub', href: 'https://github.com/Taurus-Ai-Corp/GRIDERA', external: true },
  ],
  Company: [
    { label: 'Contact', href: 'mailto:admin@taurusai.io' },
    { label: 'Hedera', href: 'https://hedera.com', external: true },
    { label: 'TAURUS AI Corp', href: 'https://taurusai.io', external: true },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'GDPR', href: '/privacy#gdpr' },
    { label: 'Cookie Notice', href: '/cookies' },
  ],
}

export default function Footer() {
  return (
    <footer className="pt-16 pb-10 border-t border-[var(--graphite-ghost)]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-12 mb-12">
          <div>
            <div className="mb-4">
              <div className="font-[var(--font-heading)] text-[16px] font-bold tracking-[0.04em]">
                <span className="text-[var(--accent)]">GRIDERA</span>
              </div>
              <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-[var(--graphite-light)] mt-0.5">
                by TAURUS AI Corp
              </div>
            </div>
            <p className="text-[14px] leading-[1.6] text-[var(--graphite-med)] max-w-[300px]">
              The first compliance-first post-quantum cryptography platform. Built for security
              teams who need to be quantum-safe before the deadline, not after.
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              {['NIST FIPS 203', 'NIST FIPS 204', 'EU AI Act', 'SWIFT 2027'].map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[10px] font-medium tracking-[0.06em] uppercase px-3 py-[4px] border border-[var(--graphite-ghost)] text-[var(--graphite-med)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--graphite-med)] mb-5">
                {group}
              </p>
              <ul className="space-y-1">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...('external' in link && link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-[14px] text-[var(--graphite-med)] hover:text-[var(--accent)] transition-colors duration-200 py-1 block"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--graphite-ghost)] pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="font-mono text-[11px] tracking-[0.06em] text-[var(--graphite-light)]">
            &copy; {new Date().getFullYear()} Taurus AI Corp. Ontario, Canada &middot; Dubai IFZA
            &middot; Wyoming LLC
          </p>
          <p className="font-mono text-[11px] tracking-[0.06em] text-[var(--graphite-light)]">
            Powered by{' '}
            <a
              href="https://hedera.com"
              className="text-[var(--accent)] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hedera
            </a>{' '}
            &middot; NIST FIPS 203/204
          </p>
        </div>
      </div>
    </footer>
  )
}
