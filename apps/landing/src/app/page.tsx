import Nav from '@/components/nav'
import Hero from '@/components/hero'
import ProofBar from '@/components/proof-bar'
import Differentiators from '@/components/differentiators'
import CompetitiveTable from '@/components/competitive-table'
import AgentsSection from '@/components/agents-section'
import FrameworkReference from '@/components/framework-reference'
import CtaSection from '@/components/cta-section'
import Footer from '@/components/footer'
import LatticeCanvas from '@/components/lattice-canvas'
import MicroDots from '@/components/micro-dots'
import ScrollRevealInit from '@/components/scroll-reveal-init'
import PlatformProducts from '@/components/platform-products'

export default function Home() {
  return (
    <main>
      <LatticeCanvas />
      <MicroDots />
      <ScrollRevealInit />
      <Nav />
      <Hero />
      <div className="section-divider section-divider--dark-to-deep" aria-hidden="true" />
      <ProofBar />
      <div className="section-divider section-divider--deep-to-dark" aria-hidden="true" />
      <Differentiators />
      <div className="section-divider section-divider--dark-to-deep" aria-hidden="true" />
      <PlatformProducts />
      <div className="section-divider section-divider--deep-to-dark" aria-hidden="true" />
      <CompetitiveTable />
      <div className="section-divider section-divider--dark-to-deep" aria-hidden="true" />
      <AgentsSection />
      <div className="section-divider section-divider--deep-to-dark" aria-hidden="true" />
      <FrameworkReference />
      <div className="section-divider section-divider--dark-to-deep" aria-hidden="true" />
      <CtaSection />
      <Footer />
    </main>
  )
}
