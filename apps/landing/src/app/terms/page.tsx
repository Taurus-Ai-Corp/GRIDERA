import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/nav'
import Footer from '@/components/footer'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service for GRIDERA|Comply — AI compliance automation platform. Subscription terms, acceptable use, and governing law.',
}

const TOC = [
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'service-description', label: '2. Service Description' },
  { id: 'account-registration', label: '3. Account Registration' },
  { id: 'subscription-plans', label: '4. Subscription Plans' },
  { id: 'free-trial', label: '5. Free Trial' },
  { id: 'payment-terms', label: '6. Payment Terms' },
  { id: 'acceptable-use', label: '7. Acceptable Use' },
  { id: 'intellectual-property', label: '8. Intellectual Property' },
  { id: 'limitation', label: '9. Limitation of Liability' },
  { id: 'data-handling', label: '10. Data Handling' },
  { id: 'termination', label: '11. Termination' },
  { id: 'governing-law', label: '12. Governing Law' },
  { id: 'contact', label: '13. Contact' },
]

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-[14px] text-[var(--graphite-med)] font-mono">
            Last updated: <time dateTime="2026-03-29">March 29, 2026</time>
          </p>
          <p className="mt-4 text-[16px] leading-[1.75] text-[var(--graphite-med)]">
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of{' '}
            <strong className="text-[var(--graphite)]">GRIDERA|Comply</strong>, operated by{' '}
            <strong className="text-[var(--graphite)]">TAURUS AI Corp</strong>. By accessing or
            using the service, you agree to be bound by these Terms.
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

          {/* 1. Acceptance */}
          <section id="acceptance">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              1. Acceptance of Terms
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <p>
                By creating an account, starting a free trial, or using any feature of GRIDERA|Comply,
                you confirm that you have read, understood, and agreed to these Terms and
                our{' '}
                <Link href="/privacy" className="text-[var(--accent)] underline underline-offset-2">
                  Privacy Policy
                </Link>
                .
              </p>
              <p>
                If you are using GRIDERA|Comply on behalf of an organization, you represent that you
                have authority to bind that organization to these Terms.
              </p>
              <p>
                If you do not agree with any part of these Terms, do not use the service.
              </p>
            </div>
          </section>

          {/* 2. Service Description */}
          <section id="service-description">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              2. Service Description
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <p>
                GRIDERA|Comply is an AI-assisted compliance automation platform. The service
                includes:
              </p>
              <ul className="space-y-3">
                {[
                  'Post-quantum cryptography (PQC) compliance assessments aligned to NIST FIPS 203 (ML-KEM-768) and NIST FIPS 204 (ML-DSA-65)',
                  'EU AI Act compliance assessments and risk classification under REGULATION (EU) 2024/1689',
                  'SWIFT Customer Security Programme (CSP) 2027 readiness assessments',
                  'AI-generated compliance reports with gap analysis and remediation guidance',
                  'Hedera blockchain-anchored audit trails providing cryptographic proof-of-compliance',
                  'Free GRIDERA|Scan tool for PQC vulnerability assessment of public-facing endpoints',
                  'ML-DSA-65 post-quantum signatures on all compliance artifacts',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[var(--accent)] mt-[6px] shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                We reserve the right to modify, add, or remove features with reasonable notice to
                users. Material changes to core functionality will be communicated at least 30 days
                in advance.
              </p>
            </div>
          </section>

          {/* 3. Account Registration */}
          <section id="account-registration">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              3. Account Registration
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <p>
                Accounts are created and managed via GRIDERA first-party authentication. You agree to:
              </p>
              <ul className="space-y-3">
                {[
                  'Provide accurate, current, and complete information during registration',
                  'Maintain the security of your credentials and not share them with others',
                  'Notify us immediately at admin@taurusai.io if you suspect unauthorized access to your account',
                  'Accept responsibility for all activities that occur under your account',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[var(--accent)] mt-[6px] shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                We reserve the right to suspend or terminate accounts that violate these Terms or
                that we reasonably believe have been compromised.
              </p>
            </div>
          </section>

          {/* 4. Subscription Plans */}
          <section id="subscription-plans">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              4. Subscription Plans
            </h2>
            <p className="text-[var(--graphite-med)] mb-6">
              GRIDERA|Comply is offered under the following subscription tiers:
            </p>
            <div className="border border-[var(--graphite-ghost)] overflow-hidden mb-6">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-[var(--graphite-ghost)] bg-[var(--bone-deep)]">
                    <th className="text-left px-4 py-3 font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--graphite-med)]">
                      Plan
                    </th>
                    <th className="text-left px-4 py-3 font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--graphite-med)]">
                      Price
                    </th>
                    <th className="text-left px-4 py-3 font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--graphite-med)]">
                      Key Features
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--graphite-ghost)] text-[var(--graphite-med)]">
                  <tr>
                    <td className="px-4 py-3 text-[var(--graphite)] font-medium">Starter</td>
                    <td className="px-4 py-3 font-mono">€399/mo</td>
                    <td className="px-4 py-3">1 seat, EU AI Act assessment, basic audit trail</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-[var(--graphite)] font-medium">Growth</td>
                    <td className="px-4 py-3 font-mono">€899/mo</td>
                    <td className="px-4 py-3">5 seats, all frameworks, Hedera HCS anchoring, API access</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-[var(--graphite)] font-medium">Enterprise</td>
                    <td className="px-4 py-3 font-mono">Custom</td>
                    <td className="px-4 py-3">Unlimited seats, Sovereign AI, SLA, dedicated support, DPA</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[var(--graphite-med)]">
              Annual billing is available at a 20% discount. Current pricing is always displayed at{' '}
              <Link href="/pricing" className="text-[var(--accent)] underline underline-offset-2">
                q-grid.net/pricing
              </Link>
              .
            </p>
          </section>

          {/* 5. Free Trial */}
          <section id="free-trial">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              5. Free Trial
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <p>
                New accounts are eligible for a <strong className="text-[var(--graphite)]">14-day free trial</strong> of the Growth plan. No credit
                card is required to start.
              </p>
              <ul className="space-y-3">
                {[
                  'Full access to all Growth plan features during the trial period',
                  'Reports and audit trails generated during the trial are retained if you subscribe',
                  'After 14 days, the account reverts to a read-only state until a subscription is activated',
                  'One free trial per organization — additional free trials at our discretion',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[var(--accent)] mt-[6px] shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 6. Payment Terms */}
          <section id="payment-terms">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              6. Payment Terms
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <p>
                Subscriptions are billed in EUR via Stripe. By subscribing, you agree to the
                following:
              </p>
              <ul className="space-y-3">
                {[
                  'Monthly subscriptions renew automatically on the same day each month unless cancelled',
                  'Annual subscriptions renew automatically on the anniversary date',
                  'You may cancel at any time from your account settings — cancellation takes effect at the end of the current billing period, with no refund for the remaining term',
                  'Failed payments result in a 3-day grace period before service suspension, with email notification at each attempt',
                  'EU VAT is applied where applicable in accordance with EU VAT Directive 2006/112/EC',
                  'We reserve the right to change pricing with 60 days\' notice to subscribers',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[var(--accent)] mt-[6px] shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 7. Acceptable Use */}
          <section id="acceptable-use">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              7. Acceptable Use
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <p>You agree to use GRIDERA|Comply only for lawful purposes. You must not:</p>
              <ul className="space-y-3">
                {[
                  'Use the service for any illegal purpose or in violation of any applicable law or regulation',
                  'Reverse engineer, decompile, disassemble, or attempt to derive source code from any part of the platform',
                  'Scrape, crawl, or systematically extract data from the platform without our written permission',
                  'Attempt to gain unauthorized access to any system, account, or data through the platform',
                  'Use the service to assess systems you do not own or have explicit authorization to test',
                  'Submit false, misleading, or fraudulent assessment data',
                  'Resell, sublicense, or otherwise commercialize access to the platform without a written reseller agreement',
                  'Use the service in a manner that could damage, disable, or impair its availability',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[var(--graphite-light)] mt-[6px] shrink-0">✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                Violations may result in immediate account suspension. We cooperate with law
                enforcement investigations and may disclose account information pursuant to a valid
                legal process.
              </p>
            </div>
          </section>

          {/* 8. Intellectual Property */}
          <section id="intellectual-property">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              8. Intellectual Property
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <div>
                <h3 className="font-medium text-[var(--graphite)] mb-2">Our Intellectual Property</h3>
                <p>
                  GRIDERA, GRIDERA|Comply, TAURUS AI Corp, and related marks are trademarks of TAURUS
                  AI Corp. The platform software, assessment frameworks, AI agent logic, scoring
                  methodologies, and underlying PQC implementations are our proprietary intellectual
                  property. All rights reserved.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--graphite)] mb-2">Your Content & Reports</h3>
                <p>
                  Compliance reports generated using your assessment data belong to you. You retain
                  ownership of all data you submit to the platform. By submitting data, you grant us
                  a limited license to process it solely to provide the service.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--graphite)] mb-2">Assessment Templates</h3>
                <p>
                  The question sets, scoring rubrics, and assessment templates used within GRIDERA|Comply
                  are our intellectual property. You may not reproduce or redistribute them
                  outside the platform without written permission.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--graphite)] mb-2">Feedback</h3>
                <p>
                  If you provide feedback, suggestions, or ideas about the service, you grant us a
                  royalty-free, worldwide license to use that feedback without restriction or
                  obligation to you.
                </p>
              </div>
            </div>
          </section>

          {/* 9. Limitation of Liability */}
          <section id="limitation">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              9. Limitation of Liability
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <div className="p-4 border border-[var(--graphite-ghost)] bg-[var(--bone-deep)]">
                <p className="font-medium text-[var(--graphite)] mb-2">Important Notice</p>
                <p>
                  GRIDERA|Comply provides compliance assessment guidance and automation tools.
                  Assessments and reports generated by the platform are <strong className="text-[var(--graphite)]">informational only
                  and do not constitute legal advice</strong>. The platform is not a substitute for
                  qualified legal counsel, certified compliance professionals, or official regulatory
                  guidance.
                </p>
              </div>
              <p>
                To the maximum extent permitted by applicable law:
              </p>
              <ul className="space-y-3">
                {[
                  'GRIDERA|Comply is provided "as is" without warranty of any kind, express or implied, including fitness for a particular compliance purpose',
                  'We do not warrant that assessments will identify all compliance gaps or that following our guidance will result in regulatory compliance',
                  'Our total liability for any claim arising from use of the service is limited to the amount you paid us in the 12 months preceding the claim',
                  'We are not liable for indirect, incidental, special, or consequential damages including loss of profits, data, or business opportunities',
                  'We are not liable for regulatory penalties, fines, or enforcement actions taken against your organization',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[var(--accent)] mt-[6px] shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                Some jurisdictions do not allow exclusions of implied warranties or limitations of
                liability. In such cases, these exclusions apply only to the maximum extent
                permitted by law.
              </p>
            </div>
          </section>

          {/* 10. Data Handling */}
          <section id="data-handling">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              10. Data Handling
            </h2>
            <p className="text-[var(--graphite-med)]">
              Your use of GRIDERA|Comply is also governed by our{' '}
              <Link href="/privacy" className="text-[var(--accent)] underline underline-offset-2">
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference. The Privacy Policy describes
              in detail how we collect, use, store, and protect your data, including data residency,
              GDPR rights, and sovereign AI options.
            </p>
            <p className="mt-4 text-[var(--graphite-med)]">
              Enterprise customers may request a Data Processing Agreement (DPA) by contacting{' '}
              <a
                href="mailto:admin@taurusai.io"
                className="text-[var(--accent)] underline underline-offset-2"
              >
                admin@taurusai.io
              </a>
              . The DPA governs the processing of personal data in accordance with GDPR Article 28.
            </p>
          </section>

          {/* 11. Termination */}
          <section id="termination">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              11. Termination
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <div>
                <h3 className="font-medium text-[var(--graphite)] mb-2">By You</h3>
                <p>
                  You may cancel your subscription at any time from your account settings. Service
                  access continues through the end of the paid period.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--graphite)] mb-2">By Us</h3>
                <p>
                  We may suspend or terminate your account if you materially breach these Terms and
                  fail to cure the breach within 14 days of written notice. We may terminate
                  immediately for violations involving illegal activity, security threats, or abuse.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--graphite)] mb-2">Data Export After Termination</h3>
                <p>
                  Upon termination, you have <strong className="text-[var(--graphite)]">30 days</strong> to export your data (compliance
                  reports, assessment responses, audit trail records) in JSON or PDF format. After 30
                  days, data is deleted from our systems in accordance with our retention policy.
                  Hedera HCS hashes are immutable and cannot be deleted from the public ledger.
                </p>
              </div>
            </div>
          </section>

          {/* 12. Governing Law */}
          <section id="governing-law">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              12. Governing Law
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <p>
                These Terms are governed by and construed in accordance with the laws of the
                Province of <strong className="text-[var(--graphite)]">Ontario, Canada</strong> and
                the federal laws of Canada applicable therein, without regard to conflict of law
                principles.
              </p>
              <p>
                Any dispute arising under these Terms shall be resolved through good-faith
                negotiation. If negotiation fails, disputes shall be submitted to binding
                arbitration under the Arbitration Act, 1991 (Ontario), administered in Toronto,
                Ontario, with proceedings conducted in English.
              </p>
              <p>
                For EU customers, nothing in this clause limits your rights under applicable EU
                consumer protection laws or your right to pursue claims before your local courts.
              </p>
            </div>
          </section>

          {/* 13. Contact */}
          <section id="contact">
            <h2 className="font-[var(--font-heading)] text-[24px] font-medium tracking-[-0.01em] mb-6 pb-3 border-b border-[var(--graphite-ghost)]">
              13. Contact
            </h2>
            <div className="space-y-4 text-[var(--graphite-med)]">
              <p>
                For questions about these Terms, billing inquiries, or legal notices:
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
                    Email
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
            href="/privacy"
            className="font-mono text-[13px] text-[var(--graphite-med)] hover:text-[var(--accent)] transition-colors duration-200"
          >
            Privacy Policy →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
