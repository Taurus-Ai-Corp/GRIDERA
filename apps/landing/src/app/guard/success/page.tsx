'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/nav'
import Footer from '@/components/footer'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Setting up your account…')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      setMessage('Missing session ID — please contact support@gridera.net')
      return
    }
    // Webhook is async — typically fires within 5 seconds
    const timer = setTimeout(() => {
      setStatus('success')
      setMessage('Check your email — your API key is on its way.')
    }, 3000)
    return () => clearTimeout(timer)
  }, [sessionId])

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-6">{status === 'success' ? '✓' : status === 'loading' ? '⏳' : '✗'}</div>
        <h1 className="text-3xl font-bold mb-4">
          {status === 'success' ? 'Welcome to GRIDERA|Guard' : status === 'loading' ? 'Setting up…' : 'Something went wrong'}
        </h1>
        <p className="text-[#888] mb-8">{message}</p>
        <Link
          href="/guard"
          className="inline-block px-6 py-3 bg-[#262626] hover:bg-[#333] rounded-lg font-semibold transition"
        >
          ← Back to GRIDERA|Guard
        </Link>
      </div>
    </main>
  )
}

export default function GuardSuccessPage() {
  return (
    <>
      <Nav />
      <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
        <SuccessContent />
      </Suspense>
      <Footer />
    </>
  )
}
