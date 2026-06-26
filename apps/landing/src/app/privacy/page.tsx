import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/nav'
import Footer from '@/components/footer'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for GRIDERA|Comply — how we collect, use, store, and protect your data. GDPR-compliant. Last updated March 29, 2026.',
}

const TOC = [
  { id: 'information-we-collect', label: '1. Information We Collect' },
  { id: 'how-we-use', label: '2. How We Use Your Information' },
  { id: 'data-storage', label: '3. Data Storage & Security' },
  { id: 'data-residency', label: '4. Data Residency' },
  { id: 'your-rights', label: '5. Your Rights (GDPR)' },
  { id: 'third-party', label: '6. Third-Party Services' },
  { id: 'cookies', label: '7. Cookies' },
  { id: 'sovereign-ai', label: '8. Sovereign AI Option' },
  { id: 'contact', label: '9. Contact & DPO' },
  { id: 'updates', label: '10. Updates' },
]

export default function PrivacyPage() {
  return (
    <div className="bg-[var(--bone)] text-[var(--graphite)] min-h-screen">
      <Nav />

      <main className="max-w-[800px] mx-auto px-6 pt-32 pb-24">
        {/* Header */}
        <div className="mb-12">
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--accent)] mb-4">
            Legal
          </p>
          <h1 className="font-[var(--font-heading)] text-[36px] md:text-[48px] font-medium tracking-[-0.02em] leading-[1.15] mb-4">
            Privacy Policy
          </h1>
          <p className="text-[14px] text-[var(--graphite-med)] font-mono">
            Last updated: <time dateTime="2026-03-29">March 29, 2026</time>
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-[var(--graphite-med)]">
            TAURUS AI Corp (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates{' '}
            <strong className="text-[var(--graphite)]">GRIDERA|Comply</strong> and{' '}
            <strong className="text-[var(--graphite)]">GRIDERA|Scan</strong>. This Privacy Policy
            explains how we collect, use, store, and protect information when you use our services.
          </p>
        </div>

        {/* Table of Contents */}
        <nav
          aria-label="Table of contents"
          className="mb-12 p-6 border border-[var(--graphite-ghost)] bg-[var(--bone-deep)]"
        >
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--graphite-med)] mb-4">
            Contents
          </p>
          <ol className="space-y-2">
            {TOC.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="text-[14px] text-[var(--graphite-med)] hover:text-[var(--accent)] transition-colors duration-200"
                >
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-12 text-[16px] leading-[1.75]">

          {/* 1. Information We Collect */}
          <section id="information-we-collect">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              1. Information We Collect
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <div>
                <h3 className="font-medium text-[var(--graphite)] mb-1">Account Information</h3>
                <p>
                  Name and email address provided when you register via Clerk authentication. We
                  store only what is necessary to manage your account and deliver the service.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--graphite)] mb-1">AI System Details</h3>
                <p>
                  Information about your AI systems that you submit during registration, including
                  system name, type, deployment context, and risk classification inputs. This data
                  is used solely to generate your compliance assessments.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--graphite)] mb-1">Assessment Responses</h3>
                <p>
                  Answers you provide during compliance assessments (EU AI Act, NIST FIPS 203/204,
                  SWIFT 2027). These responses are stored to generate reports and track compliance
                  progress over time.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--graphite)] mb-1">Scan Data</h3>
                <p>
                  Domain names and publicly accessible SSL certificate information submitted through
                  GRIDERA|Scan. This data consists exclusively of publicly available information.
                  We do not access any non-public systems.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--graphite)] mb-1">Usage Analytics</h3>
                <p>
                  Server-side event data (pages visited, features used, session duration) used to
                  improve the platform. No third-party advertising analytics are used.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--graphite)] mb-1">Payment Information</h3>
                <p>
                  Billing is processed by Stripe. We receive only a tokenized payment reference and
                  subscription status — we never store credit card numbers, CVV codes, or full
                  payment details on our servers.
                </p>
              </div>
            </div>
          </section>

          {/* 2. How We Use */}
          <section id="how-we-use">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              2. How We Use Your Information
            </h2>
            <ul className="space-y-3 text-[var(--graphite-med)]">
              {[
                'Provide compliance assessment services and generate compliance reports.',
                'Anchor audit trail hashes to the Hedera blockchain for immutable verification. Only cryptographic hashes are anchored — raw assessment data is never written to the public ledger.',
                'Apply ML-DSA-65 post-quantum signatures to all generated artifacts for tamper-evidence and long-term verifiability.',
                'Send transactional emails (assessment complete, report ready, billing receipts) via Resend.',
                'Respond to support requests and account inquiries.',
                'Improve platform performance, fix bugs, and develop new compliance frameworks.',
                'Comply with applicable laws and enforce our Terms of Service.',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="text-[var(--accent)] mt-[6px] shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 3. Data Storage & Security */}
          <section id="data-storage">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              3. Data Storage & Security
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <p>
                Data is stored in Neon PostgreSQL with regional routing (see Section 4). We apply
                multiple layers of security:
              </p>
              <ul className="space-y-3">
                {[
                  'ML-DSA-65 post-quantum digital signatures on all compliance artifacts (NIST FIPS 204)',
                  'ML-KEM-768 key encapsulation for key exchange (NIST FIPS 203)',
                  'AES-256-GCM encryption for cryptographic keys at rest',
                  'TLS 1.3 for all data in transit',
                  'Hedera HCS (Hashgraph Consensus Service) for immutable audit anchoring — hashes only, never raw data',
                  'Access controls: least-privilege database roles, short-lived credentials, no standing access',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[var(--accent)] mt-[6px] shrink-0 font-mono text-[12px]">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                In the event of a data breach that poses a high risk to your rights and freedoms, we
                will notify you within 72 hours of becoming aware, as required under GDPR Article
                34.
              </p>
            </div>
          </section>

          {/* 4. Data Residency */}
          <section id="data-residency">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              4. Data Residency
            </h2>
            <p className="text-[var(--graphite-med)] mb-6">
              We operate regional database instances to keep your data in your jurisdiction. Your
              data is routed based on the domain you access:
            </p>
            <div className="border border-[var(--graphite-ghost)] overflow-hidden">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-[var(--graphite-ghost)] bg-[var(--bone-deep)]">
                    <th className="text-left px-4 py-3 font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--graphite-med)]">
                      Region
                    </th>
                    <th className="text-left px-4 py-3 font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--graphite-med)]">
                      Domain
                    </th>
                    <th className="text-left px-4 py-3 font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--graphite-med)]">
                      Data Location
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--graphite-ghost)]">
                  {[
                    ['EU', 'eu.q-grid.net', 'Frankfurt, Germany (aws-eu-central-1)'],
                    ['North America', 'na.q-grid.net', 'US East (aws-us-east-2)'],
                    ['India', 'in.q-grid.net', 'Mumbai, India (aws-ap-south-1)'],
                    ['UAE', 'ae.q-grid.net', 'Bahrain (aws-me-central-1)'],
                  ].map(([region, domain, location]) => (
                    <tr key={region}>
                      <td className="px-4 py-3 text-[var(--graphite)]">{region}</td>
                      <td className="px-4 py-3 font-mono text-[13px] text-[var(--accent)]">
                        {domain}
                      </td>
                      <td className="px-4 py-3 text-[var(--graphite-med)]">{location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[var(--graphite-med)]">
              EU customer data is never transferred outside the European Economic Area without
              appropriate safeguards (Standard Contractual Clauses or equivalent).
            </p>
          </section>

          {/* 5. Your Rights (GDPR) */}
          <section id="your-rights">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              5. Your Rights (GDPR)
            </h2>
            <p className="text-[var(--graphite-med)] mb-6">
              If you are in the European Economic Area, you have the following rights under the
              General Data Protection Regulation:
            </p>
            <div className="space-y-4 text-[var(--graphite-med)]">
              {[
                {
                  right: 'Right of Access (Article 15)',
                  desc: 'Request a copy of all personal data we hold about you.',
                },
                {
                  right: 'Right to Rectification (Article 16)',
                  desc: 'Request correction of inaccurate or incomplete personal data.',
                },
                {
                  right: 'Right to Erasure (Article 17)',
                  desc: 'Request deletion of your personal data. Note: data anchored to Hedera HCS as cryptographic hashes cannot be deleted from the public ledger, but raw data associated with those hashes can be deleted from our systems.',
                },
                {
                  right: 'Right to Data Portability (Article 20)',
                  desc: 'Request an export of your data in a machine-readable format (JSON or CSV).',
                },
                {
                  right: 'Right to Restrict Processing (Article 18)',
                  desc: 'Request that we limit how we process your data in certain circumstances.',
                },
                {
                  right: 'Right to Object (Article 21)',
                  desc: 'Object to processing of your personal data based on legitimate interests.',
                },
              ].map(({ right, desc }) => (
                <div key={right} className="flex gap-3">
                  <span className="text-[var(--accent)] mt-[6px] shrink-0">—</span>
                  <div>
                    <span className="font-medium text-[var(--graphite)]">{right}: </span>
                    <span>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 border border-[var(--accent)] bg-[var(--accent-glow)]">
              <p className="text-[var(--graphite)]">
                To exercise any of these rights, email{' '}
                <a
                  href="mailto:admin@taurusai.io"
                  className="text-[var(--accent)] underline underline-offset-2"
                >
                  admin@taurusai.io
                </a>
                . We will respond within 30 days. You also have the right to lodge a complaint with
                your local supervisory authority (e.g., the CNIL in France, ICO in the UK, or the
                relevant EU member state DPA).
              </p>
            </div>
          </section>

          {/* 6. Third-Party Services */}
          <section id="third-party">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              6. Third-Party Services
            </h2>
            <p className="text-[var(--graphite-med)] mb-6">
              We use the following third-party processors. Each has been evaluated for GDPR
              compliance and where applicable, Data Processing Agreements are in place:
            </p>
            <div className="space-y-4">
              {[
                {
                  name: 'Clerk',
                  purpose: 'Authentication and identity management (SSO, MFA, session management)',
                  link: 'https://clerk.com/privacy',
                },
                {
                  name: 'Stripe',
                  purpose:
                    'Payment processing. Card data is handled exclusively by Stripe and never stored on our servers',
                  link: 'https://stripe.com/privacy',
                },
                {
                  name: 'Hedera',
                  purpose:
                    'Blockchain audit trail anchoring via Hedera Consensus Service (HCS). Only cryptographic hashes are written to this public ledger',
                  link: 'https://hedera.com/privacy',
                },
                {
                  name: 'Vercel',
                  purpose:
                    'Application hosting and edge network. Handles TLS termination and HTTP request routing',
                  link: 'https://vercel.com/legal/privacy-policy',
                },
                {
                  name: 'Neon',
                  purpose:
                    'Serverless PostgreSQL database provider with regional data residency',
                  link: 'https://neon.tech/privacy-policy',
                },
                {
                  name: 'Resend',
                  purpose:
                    'Transactional email delivery (assessment notifications, billing receipts)',
                  link: 'https://resend.com/privacy',
                },
              ].map(({ name, purpose, link }) => (
                <div
                  key={name}
                  className="flex gap-4 p-4 border border-[var(--graphite-ghost)] bg-[var(--bone-deep)]"
                >
                  <div className="shrink-0 w-[100px]">
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[13px] font-medium text-[var(--accent)] hover:underline"
                    >
                      {name}
                    </a>
                  </div>
                  <p className="text-[14px] text-[var(--graphite-med)]">{purpose}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 7. Cookies */}
          <section id="cookies">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              7. Cookies
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <p>
                We use a minimal set of cookies. We do not use advertising cookies, cross-site
                tracking cookies, or sell your data to ad networks.
              </p>
              <div className="border border-[var(--graphite-ghost)] overflow-hidden">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="border-b border-[var(--graphite-ghost)] bg-[var(--bone-deep)]">
                      <th className="text-left px-4 py-3 font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--graphite-med)]">
                        Cookie
                      </th>
                      <th className="text-left px-4 py-3 font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--graphite-med)]">
                        Type
                      </th>
                      <th className="text-left px-4 py-3 font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--graphite-med)]">
                        Purpose
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--graphite-ghost)]">
                    {[
                      ['__session', 'Essential', 'Clerk authentication session token'],
                      ['__client_uat', 'Essential', 'Clerk client-side user activity token'],
                      ['__cf_bm', 'Essential', 'Cloudflare bot management (Vercel infrastructure)'],
                    ].map(([cookie, type, purpose]) => (
                      <tr key={cookie}>
                        <td className="px-4 py-3 font-mono text-[13px] text-[var(--graphite)]">
                          {cookie}
                        </td>
                        <td className="px-4 py-3 text-[var(--accent)] text-[13px]">{type}</td>
                        <td className="px-4 py-3 text-[var(--graphite-med)]">{purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                Analytics are collected via server-side event logging — no client-side tracking
                scripts are injected, which means no third-party cookies from analytics providers.
              </p>
            </div>
          </section>

          {/* 8. Sovereign AI */}
          <section id="sovereign-ai">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              8. Sovereign AI Option
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <p>
                Enterprise customers can elect to use <strong className="text-[var(--graphite)]">Sovereign AI mode</strong> for compliance
                report generation. In this mode:
              </p>
              <ul className="space-y-3">
                {[
                  'AI inference runs on the customer\'s own infrastructure using a self-hosted model (Ollama, vLLM, or compatible OpenAI-API endpoint)',
                  'Assessment data and report content never leave the customer\'s network boundary',
                  'GRIDERA|Comply acts as a thin orchestration layer — it sends structured prompts to your local AI endpoint and formats the response',
                  'Blockchain anchoring (Hedera HCS hashes) still occurs from customer infrastructure, ensuring audit trails remain intact without data exposure',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[var(--accent)] mt-[6px] shrink-0 font-mono text-[12px]">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                Sovereign AI mode is available on Enterprise plans. Contact{' '}
                <a
                  href="mailto:admin@taurusai.io"
                  className="text-[var(--accent)] underline underline-offset-2"
                >
                  admin@taurusai.io
                </a>{' '}
                to configure this for your organization.
              </p>
            </div>
          </section>

          {/* 9. Contact & DPO */}
          <section id="contact">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              9. Contact & Data Protection Officer
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <p>
                For all privacy-related requests, data subject rights exercises, or DPA inquiries:
              </p>
              <div className="p-6 border border-[var(--graphite-ghost)] bg-[var(--bone-deep)] space-y-2 text-[14px]">
                <p>
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--graphite-light)]">
                    Organization
                  </span>
                  <br />
                  <span className="text-[var(--graphite)]">TAURUS AI Corp</span>
                </p>
                <p>
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--graphite-light)]">
                    Jurisdictions
                  </span>
                  <br />
                  <span className="text-[var(--graphite)]">Ontario, Canada · Dubai IFZA · Wyoming LLC</span>
                </p>
                <p>
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--graphite-light)]">
                    Data Protection Officer
                  </span>
                  <br />
                  <a
                    href="mailto:admin@taurusai.io"
                    className="text-[var(--accent)] underline underline-offset-2"
                  >
                    admin@taurusai.io
                  </a>
                </p>
              </div>
              <p>
                We aim to respond to all privacy requests within 30 days. For urgent security
                matters, mark your email subject line with{' '}
                <span className="font-mono text-[13px] text-[var(--graphite)]">[URGENT PRIVACY]</span>.
              </p>
            </div>
          </section>

          {/* 10. Updates */}
          <section id="updates">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              10. Updates to This Policy
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our
                practices, applicable law, or the services we offer. When we make material changes:
              </p>
              <ul className="space-y-3">
                {[
                  'Registered users will be notified by email at least 14 days before changes take effect',
                  'The "Last updated" date at the top of this page will be revised',
                  'For significant changes, we will display a notice in the application dashboard',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[var(--accent)] mt-[6px] shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                Continued use of GRIDERA|Comply after changes become effective constitutes acceptance
                of the updated Privacy Policy.
              </p>
            </div>
          </section>

        </div>

        {/* Back to home */}
        <div className="mt-16 pt-8 border-t border-[var(--graphite-ghost)] flex items-center justify-between">
          <Link
            href="/"
            className="font-mono text-[13px] text-[var(--graphite-med)] hover:text-[var(--accent)] transition-colors duration-200 flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Home</span>
          </Link>
          <Link
            href="/terms"
            className="font-mono text-[13px] text-[var(--graphite-med)] hover:text-[var(--accent)] transition-colors duration-200"
          >
            Terms of Service →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
