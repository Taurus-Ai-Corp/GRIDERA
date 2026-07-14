const CHECK = (
  <span className="text-[var(--accent)] font-bold" aria-label="Yes">
    ✓
  </span>
)
const CROSS = (
  <span className="text-[var(--graphite-light)] opacity-50" aria-label="No">
    ✗
  </span>
)
const PARTIAL = (
  <span className="text-[#D4A017]" aria-label="Partial">
    ~
  </span>
)

const ROWS: Array<{ label: string; gridera: React.ReactNode; ibm: React.ReactNode; fortanix: React.ReactNode; thales: React.ReactNode; entrust: React.ReactNode }> = [
  {
    label: 'Starting Price',
    gridera: <span className="font-semibold text-[var(--accent)]">$399/mo</span>,
    ibm: <span>$50K+</span>,
    fortanix: <span>$25K+</span>,
    thales: <span>$50K+</span>,
    entrust: <span>$75K+</span>,
  },
  {
    label: 'EU AI Act Focus',
    gridera: CHECK,
    ibm: PARTIAL,
    fortanix: CROSS,
    thales: PARTIAL,
    entrust: CROSS,
  },
  {
    label: 'Assessment Automation',
    gridera: PARTIAL,
    ibm: PARTIAL,
    fortanix: PARTIAL,
    thales: CROSS,
    entrust: CROSS,
  },
  {
    label: 'Blockchain Audit Trail',
    gridera: PARTIAL,
    ibm: CROSS,
    fortanix: CROSS,
    thales: CROSS,
    entrust: CROSS,
  },
  {
    label: 'PQC Certificate Scanning',
    gridera: CHECK,
    ibm: CROSS,
    fortanix: CROSS,
    thales: CROSS,
    entrust: CROSS,
  },
  {
    label: 'Post-Quantum Crypto',
    gridera: CHECK,
    ibm: CHECK,
    fortanix: CHECK,
    thales: PARTIAL,
    entrust: PARTIAL,
  },
  {
    label: 'Self-Hosted AI',
    gridera: CHECK,
    ibm: PARTIAL,
    fortanix: CROSS,
    thales: CROSS,
    entrust: CROSS,
  },
  {
    label: 'Deployment Time',
    gridera: <span className="font-semibold text-[var(--accent)]">Same day</span>,
    ibm: <span>6–18 mo</span>,
    fortanix: <span>3–6 mo</span>,
    thales: <span>6–12 mo</span>,
    entrust: <span>6–12 mo</span>,
  },
]

const HEADERS = [
  { key: 'gridera', label: 'GRIDERA|Comply', highlight: true },
  { key: 'ibm', label: 'IBM Quantum Safe', highlight: false },
  { key: 'fortanix', label: 'Fortanix', highlight: false },
  { key: 'thales', label: 'Thales HSM', highlight: false },
  { key: 'entrust', label: 'Entrust', highlight: false },
] as const

export default function CompetitiveTable() {
  return (
    <section id="compare" className="py-[100px] bg-[var(--bone-deep)]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section label */}
        <div className="reveal flex items-baseline gap-4 mb-12">
          <span className="font-mono text-[14px] text-[var(--accent)] tracking-[0.02em]">04</span>
          <div>
            <h2 className="font-[var(--font-heading)] text-[28px] font-semibold leading-[1.2] text-[var(--graphite)]">
              Competitive Comparison
            </h2>
            <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--graphite-med)] mt-1">
              GRIDERA|Comply vs. legacy cryptography vendors
            </p>
          </div>
        </div>

        {/* Table — horizontally scrollable on mobile */}
        <div className="reveal overflow-x-auto border border-[var(--graphite-ghost)]">
          <table className="w-full border-collapse text-[14px] min-w-[700px]">
            <thead>
              <tr>
                {/* Row label column */}
                <th className="text-left px-4 py-4 font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--graphite-med)] border-b-2 border-[var(--graphite-ghost)] w-[200px]">
                  Feature
                </th>
                {HEADERS.map(({ key, label, highlight }) => (
                  <th
                    key={key}
                    className={`text-left px-4 py-4 font-mono text-[11px] font-medium tracking-[0.1em] uppercase border-b-2 whitespace-nowrap ${
                      highlight
                        ? 'text-[var(--accent)] border-[var(--accent)] bg-[rgba(0,204,170,0.06)]'
                        : 'text-[var(--graphite-med)] border-[var(--graphite-ghost)]'
                    }`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ label, gridera, ibm, fortanix, thales, entrust }) => (
                <tr key={label} className="group">
                  <td className="px-4 py-[14px] border-b border-[var(--graphite-ghost)] font-medium text-[var(--graphite)] group-hover:bg-[rgba(255,255,255,0.02)] whitespace-nowrap">
                    {label}
                  </td>
                  <td className="px-4 py-[14px] border-b border-[var(--graphite-ghost)] bg-[rgba(0,204,170,0.06)] group-hover:bg-[rgba(0,204,170,0.1)]">
                    {gridera}
                  </td>
                  {[ibm, fortanix, thales, entrust].map((val, i) => (
                    <td
                      key={i}
                      className="px-4 py-[14px] border-b border-[var(--graphite-ghost)] text-[var(--graphite-med)] group-hover:bg-[rgba(255,255,255,0.02)]"
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA below table */}
        <div className="mt-8 text-center">
          <a href="/scan" className="btn-primary inline-flex">
            Start Free PQC Scan
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
