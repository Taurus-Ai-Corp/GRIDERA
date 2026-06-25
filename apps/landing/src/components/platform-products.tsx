import Link from 'next/link'

const PRODUCTS = [
  {
    id: 'guard',
    name: 'Guard',
    tagline: 'PQC-signed LLM guardrails',
    desc: 'Every LLM call signed with ML-DSA-65. EU AI Act, NIST AI RMF, and SOC 2 rule packs with Hedera HCS anchoring.',
    href: '/guard',
  },
  {
    id: 'scan',
    name: 'Scan',
    tagline: 'Free PQC vulnerability scanner',
    desc: 'Scan any domain for quantum-vulnerable TLS, certificate algorithms, and NIST FIPS 203/204 gaps in seconds.',
    href: '/scan',
  },
  {
    id: 'migrate',
    name: 'Migrate',
    tagline: 'Autonomous PQC migration',
    desc: 'AI swarms analyze your codebase, refactor legacy crypto to ML-KEM and ML-DSA, and deliver signed pull requests.',
    href: '/migrate',
  },
  {
    id: 'comply',
    name: 'Comply',
    tagline: 'Quantum risk exposure reports',
    desc: 'Data-asset-level harvest-window analysis, financial exposure quantification, and CBOM generation for regulators.',
    href: '/comply',
  },
  {
    id: 'lend',
    name: 'Lend',
    tagline: 'MSME lending platform',
    desc: 'Quantum-safe credit scoring, automated KYC, repayment intelligence, and regulator dashboards for emerging markets.',
    href: '/lend',
  },
  {
    id: 'asset',
    name: 'Asset',
    tagline: 'Enterprise crypto asset management',
    desc: 'Quantum-safe custody, token lifecycle management, policy engine, and immutable audit trails for institutions.',
    href: '/asset',
  },
]

export default function PlatformProducts() {
  return (
    <section id="products" className="py-24 bg-[var(--bone)]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-baseline gap-4 mb-12">
          <span className="font-mono text-[14px] text-[var(--accent)] tracking-[0.02em]">§</span>
          <div>
            <h2 className="font-[var(--font-heading)] text-[28px] md:text-[36px] font-semibold tracking-[-0.02em] leading-[1.2] text-[var(--graphite)]">
              The GRIDERA Platform
            </h2>
            <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--graphite-med)] mt-1">
              Six products. One post-quantum compliance fabric.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((product) => (
            <Link
              key={product.id}
              href={product.href}
              className="group block border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] p-6 hover:border-[var(--accent)]/40 hover:bg-[rgba(0,204,170,0.04)] transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-[var(--font-heading)] text-[20px] font-semibold text-[var(--graphite)] group-hover:text-[var(--accent)] transition-colors">
                  {product.name}
                </span>
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--accent)] border border-[var(--accent)] px-2 py-[2px]">
                  {product.tagline}
                </span>
              </div>
              <p className="text-[14px] text-[var(--graphite-med)] leading-[1.7] mb-6">{product.desc}</p>
              <span className="font-mono text-[11px] font-medium tracking-[0.06em] uppercase text-[var(--accent)] flex items-center gap-1">
                Explore <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
