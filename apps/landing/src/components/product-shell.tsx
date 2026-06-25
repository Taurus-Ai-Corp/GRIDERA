import Nav from '@/components/nav'
import Footer from '@/components/footer'

export default function ProductShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Nav />
      <main className="min-h-[100dvh]">{children}</main>
      <Footer />
    </>
  )
}
