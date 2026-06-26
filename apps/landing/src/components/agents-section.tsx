const AGENTS = [
  { name: 'PQC-Scanner',        status: 'Available', delay: '0s' },
  { name: 'QRS-Scorer',         status: 'Available', delay: '0.3s' },
  { name: 'Risk-Classifier',    status: 'Available', delay: '0.6s' },
  { name: 'Assessment-Engine',  status: 'Available', delay: '0.9s' },
  { name: 'Report-Generator',   status: 'Ready',     delay: '1.2s' },
  { name: 'Audit-Logger',       status: 'Available', delay: '1.5s' },
  { name: 'Key-Manager',        status: 'Ready',     delay: '1.8s' },
  { name: 'Compliance-Mapper',  status: 'Available', delay: '2.1s' },
]

const STATUS_COLORS: Record<string, string> = {
  Available: 'text-[var(--accent)]',
  Ready:     'text-[#D4A017]',
}

export default function AgentsSection() {
  return (
    <section id="agents" className="py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section label */}
        <div className="reveal flex items-center gap-5 mb-14">
          <span className="font-mono text-[32px] font-bold text-[var(--accent)] leading-none select-none">
            03
          </span>
          <div>
            <p className="font-[var(--font-heading)] text-[20px] font-bold tracking-[-0.01em] text-[var(--graphite)]">
              Autonomous Compliance Agents
            </p>
            <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--graphite-med)] mt-0.5">
              8 Compliance Engines
            </p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Left: agent list */}
          <div className="reveal">
            <div className="space-y-[2px]">
              {AGENTS.map(({ name, status, delay }) => (
                <div
                  key={name}
                  className="flex items-center gap-4 px-4 py-[10px] border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] hover:bg-[rgba(0,204,170,0.03)] transition-colors"
                >
                  {/* Pulse dot */}
                  <span
                    className="dot-pulse shrink-0 w-[6px] h-[6px] rounded-full bg-[var(--accent)]"
                    style={{ animationDelay: delay }}
                    aria-hidden="true"
                  />
                  {/* Agent name */}
                  <span className="flex-1 font-mono text-[13px] text-[var(--graphite)] tracking-[0.02em]">
                    {name}
                  </span>
                  {/* Status */}
                  <span
                    className={`font-mono text-[11px] uppercase tracking-[0.08em] ${STATUS_COLORS[status] ?? 'text-[var(--graphite-med)]'}`}
                  >
                    {status}
                  </span>
                </div>
              ))}
            </div>
            <p className="font-mono text-[12px] text-[var(--graphite-ghost)] mt-5 tracking-[0.06em]">
              + HEDERA HCS ANCHORING ACTIVE
            </p>
          </div>

          {/* Right: description */}
          <div className="reveal flex flex-col gap-5" style={{ transitionDelay: '150ms' }}>
            <h3
              className="font-[var(--font-heading)] font-bold tracking-[-0.02em] leading-[1.1]"
              style={{ fontSize: 'clamp(24px, 2.5vw, 36px)' }}
            >
              Your compliance team,
              <br />
              <span className="gradient-text">automated.</span>
            </h3>

            <p className="text-[15px] leading-[1.75] text-[var(--graphite-med)]">
              GRIDERA deploys specialized compliance engines that work continuously — scanning your
              cryptographic inventory, scoring quantum-readiness, mapping EU AI Act exposure, and
              generating audit evidence signed with{' '}
              <span className="font-mono text-[var(--accent)] text-[13px]">ML-DSA-65</span> and
              anchored on{' '}
              <span className="font-mono text-[var(--accent)] text-[13px]">Hedera HCS</span>.
            </p>

            <p className="text-[15px] leading-[1.75] text-[var(--graphite-med)]">
              The{' '}
              <span className="font-mono text-[var(--accent)] text-[13px]">PQC-Scanner</span> runs{' '}
              <span className="font-mono text-[var(--accent)] text-[13px]">scanDomain()</span> via{' '}
              <code className="font-mono text-[13px] text-[var(--graphite-med)]">
                @taurus/pqc-engine
              </code>
              . The{' '}
              <span className="font-mono text-[var(--accent)] text-[13px]">Risk-Classifier</span>{' '}
              applies EU AI Act Annex III rule-based classification. The{' '}
              <span className="font-mono text-[var(--accent)] text-[13px]">Report-Generator</span>{' '}
              supports three modes: template, cloud, and sovereign (Ollama/vLLM).
            </p>

            <p
              className="font-mono text-[14px] font-medium text-[var(--accent)] border-l-2 border-[var(--accent)] pl-4 mt-2"
            >
              PQC certificate scan completes in under a minute. Full assessment in a single session.
            </p>

            <a
              href="/scan"
              className="btn-primary self-start mt-2"
            >
              Run a Free PQC Scan →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
