import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EU AI Act Risk Assessment',
  description:
    'Free 2-minute assessment to determine your AI system\'s risk classification under the EU AI Act (August 2026 deadline). Get your score and compliance roadmap.',
  openGraph: {
    title: 'EU AI Act Risk Assessment | Quantum Grid',
    description:
      'Is your AI system HIGH RISK under the EU AI Act? Find out in 2 minutes. Free assessment by GRIDERA|Comply.',
    url: 'https://q-grid.net/assess',
    siteName: 'Quantum Grid',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://q-grid.net/og-assess.png',
        width: 1200,
        height: 630,
        alt: 'EU AI Act Risk Assessment — Quantum Grid',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EU AI Act Risk Assessment | Quantum Grid',
    description:
      'Is your AI system HIGH RISK under the EU AI Act? Free 2-minute assessment.',
    images: ['https://q-grid.net/og-assess.png'],
  },
}

export default function AssessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
