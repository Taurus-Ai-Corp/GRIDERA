const DIFF_CARDS = [
  {
    num: '01',
    title: 'We Sell Compliance, They Sell Hardware',
    body: 'Thales, Entrust, and IBM lead with HSMs that cost $50K–$250K before you write a single policy. GRIDERA|Comply starts at $399/month and is operational in under an hour.',
    competitor: 'vs. Thales · Entrust · IBM',
  },
  {
    num: '02',
    title: 'The 18-Month Hardware Trap',
    body: 'Hardware-first vendors require procurement cycles, firmware updates, and physical key ceremonies. Our software-defined approach deploys to any cloud, any region, same day.',
    competitor: 'vs. Hardware-first vendors',
  },
  {
    num: '03',
    title: 'Automated Discovery',
    body: '8 compliance engines scan your TLS certificates and cryptographic inventory for classical exposure — work that would take a team of consultants weeks to complete manually.',
    competitor: 'vs. Manual assessment teams',
  },
  {
    num: '04',
    title: 'Immutable Hedera Audit Trails',
    body: 'Every compliance event, key rotation, and policy change is anchored to Hedera Consensus Service — tamper-evident, timestamped, and verifiable by any auditor without trusting our servers.',
    competitor: 'vs. Mutable database audit logs',
  },
  {
    num: '05',
    title: 'Accessible to Every Team',
    body: 'Enterprise PQC migration used to require a $250K+ engagement. GRIDERA|Comply democratizes access with SaaS pricing, self-service onboarding, and no minimum commitment.',
    competitor: 'vs. $50K–$250K enterprise engagements',
  },
  {
    num: '06',
    title: 'Continuous, Not Point-in-Time',
    body: 'Annual audits miss the 364 days in between. Our agents run continuously, surfacing new exposure as your codebase evolves and regulations tighten — before auditors do.',
    competitor: 'vs. Point-in-time compliance snapshots',
  },
]

export default function Differentiators() {
  return (
    <section
      id="differentiators"
      className="py-[100px] bg-[var(--bone-deep)]"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section label */}
        <div className="reveal flex items-baseline gap-4 mb-12">
          <span className="font-mono text-[14px] text-[var(--accent)] tracking-[0.02em]">03</span>
          <div>
            <h2 className="font-[var(--font-heading)] text-[28px] font-semibold leading-[1.2] text-[var(--graphite)]">
              Why GRIDERA Wins
            </h2>
            <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--graphite-med)] mt-1">
              Six reasons compliance teams choose us over legacy vendors
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="diff-grid reveal-stagger">
          {DIFF_CARDS.map(({ num, title, body, competitor }) => (
            <div key={num} className="diff-card reveal p-10">
              <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-[var(--accent)] mb-3">
                {num}
              </p>
              <h3 className="font-[var(--font-heading)] text-[18px] font-semibold text-[var(--graphite)] mb-3">
                {title}
              </h3>
              <p className="text-[14px] leading-[1.65] text-[var(--graphite-med)]">{body}</p>
              <p className="font-mono text-[11px] text-[var(--graphite-light)] mt-4 pt-4 border-t border-[var(--graphite-ghost)]">
                {competitor}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
