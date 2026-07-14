const FRAMEWORKS = [
  {
    standard: 'ML-DSA',
    reference: 'FIPS 204',
    status: 'Active' as const,
    href: 'https://csrc.nist.gov/pubs/fips/204/final',
  },
  {
    standard: 'ML-KEM',
    reference: 'FIPS 203',
    status: 'Active' as const,
    href: 'https://csrc.nist.gov/pubs/fips/203/final',
  },
  {
    standard: 'SLH-DSA',
    reference: 'FIPS 205',
    status: 'Active' as const,
    href: 'https://csrc.nist.gov/pubs/fips/205/final',
  },
  {
    standard: 'EU AI Act',
    reference: 'Reg 2024/1689',
    status: 'Pending' as const,
    href: 'https://eur-lex.europa.eu/eli/reg/2024/1689',
  },
  {
    standard: 'NIST PQC',
    reference: 'SP 800-208',
    status: 'Active' as const,
    href: 'https://csrc.nist.gov/pubs/sp/800/208/final',
  },
  {
    standard: 'PIPEDA',
    reference: 'Canada',
    status: 'Active' as const,
    href: 'https://laws-lois.justice.gc.ca/eng/acts/p-8.6/',
  },
  {
    standard: 'GDPR',
    reference: 'EU',
    status: 'Active' as const,
    href: 'https://eur-lex.europa.eu/eli/reg/2016/679',
  },
  {
    standard: 'VARA',
    reference: 'UAE',
    status: 'Active' as const,
    href: 'https://www.vara.ae/',
  },
  {
    standard: 'RBI / SEBI',
    reference: 'India',
    status: 'Active' as const,
    href: 'https://www.rbi.org.in/',
  },
  {
    standard: 'SWIFT CSP',
    reference: '2027',
    status: 'Upcoming' as const,
    href: 'https://www.swift.com/myswift/customer-security-programme-csp',
  },
  {
    standard: 'CNSA 2.0',
    reference: 'NSA · Jan 2027 gate',
    status: 'Upcoming' as const,
    href: 'https://media.defense.gov/2022/Sep/07/2003071836/-1/-1/0/CSI_CNSA_2.0_FAQ_.PDF',
  },
  {
    standard: 'EO 14412',
    reference: 'US Federal PQC',
    status: 'Active' as const,
    href: 'https://www.federalregister.gov/executive-orders',
  },
  {
    standard: 'FIPS 140-2 Sunset',
    reference: 'Sept 2026',
    status: 'Upcoming' as const,
    href: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program',
  },
  {
    standard: 'CMMC 2.0',
    reference: 'DoD · Nov 2026',
    status: 'Upcoming' as const,
    href: 'https://dodcio.defense.gov/cmmc/',
  },
]

const JURISDICTIONS = ['EU', 'US', 'UK', 'CA', 'UAE', 'IN', 'SG']

const STATUS_STYLES: Record<'Active' | 'Pending' | 'Upcoming', string> = {
  Active:   'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30',
  Pending:  'bg-[#D4A017]/10 text-[#D4A017] border-[#D4A017]/30',
  Upcoming: 'bg-[var(--graphite-ghost)]/30 text-[var(--graphite-med)] border-[var(--graphite-ghost)]',
}

export default function FrameworkReference() {
  return (
    <section id="frameworks" className="py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section label */}
        <div className="reveal flex items-center gap-5 mb-14">
          <span className="font-mono text-[32px] font-bold text-[var(--accent)] leading-none select-none">
            04
          </span>
          <div>
            <p className="font-[var(--font-heading)] text-[20px] font-bold tracking-[-0.01em] text-[var(--graphite)]">
              Framework Reference
            </p>
            <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--graphite-med)] mt-0.5">
              Compliance Standards Mapping
            </p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-12 items-start">
          {/* Left: table */}
          <div className="reveal border border-[var(--graphite-ghost)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--graphite-ghost)]">
                  {['Standard', 'Reference', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--graphite-med)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FRAMEWORKS.map(({ standard, reference, status, href }) => (
                  <tr
                    key={standard}
                    className="border-b border-[var(--graphite-ghost)] last:border-0 hover:bg-[var(--accent)]/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[13px] text-[var(--graphite)] hover:text-[var(--accent)] transition-colors"
                      >
                        {standard}
                      </a>
                    </td>
                    <td className="px-5 py-3 font-mono text-[12px] text-[var(--graphite-med)]">
                      {reference}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`font-mono text-[10px] font-medium border px-2 py-[3px] uppercase tracking-wider ${STATUS_STYLES[status]}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right: description */}
          <div className="reveal flex flex-col gap-6" style={{ transitionDelay: '150ms' }}>
            <p className="text-[15px] leading-[1.75] text-[var(--graphite-med)]">
              GRIDERA maps your infrastructure against the complete landscape of quantum-safe
              compliance requirements. From NIST PQC standards to the EU AI Act&apos;s August 2026
              deadline — every framework is tracked, scored, and reported.
            </p>
            <p className="text-[15px] leading-[1.75] text-[var(--graphite-med)]">
              Continuous monitoring detects drift from compliance baselines and alerts your team
              before gaps become audit findings.
            </p>

            {/* Jurisdiction badges */}
            <div>
              <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--graphite-med)] mb-4">
                Multi-Jurisdiction Coverage
              </p>
              <div className="flex flex-wrap gap-2">
                {JURISDICTIONS.map((j) => (
                  <span
                    key={j}
                    className="font-mono text-[11px] font-medium tracking-[0.06em] uppercase px-3 py-[5px] border border-[var(--graphite-ghost)] text-[var(--graphite-med)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  >
                    {j}
                  </span>
                ))}
              </div>
            </div>

            <a
              href="https://eu.q-grid.net/sign-up"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary self-start"
            >
              Start compliance assessment →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
