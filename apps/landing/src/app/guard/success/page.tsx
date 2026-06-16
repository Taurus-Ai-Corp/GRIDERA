'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/nav'
import Footer from '@/components/footer'

// Executor URL used in examples.
// TODO: guard.gridera.net is currently NXDOMAIN. Set NEXT_PUBLIC_GUARD_EXECUTOR_URL
// in Vercel once DNS is fixed; otherwise requests will fail at runtime.
function getExecutorUrl(): string {
  if (typeof window === 'undefined') return ''
  return (
    process.env['NEXT_PUBLIC_GUARD_EXECUTOR_URL'] ??
    'https://guard.gridera.net/guard/v1/execute'
  )
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const key = searchParams.get('key')
  const tier = searchParams.get('tier') ?? 'sandbox'

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Setting up your account…')
  const [apiKey, setApiKey] = useState<string | null>(key)
  const [copied, setCopied] = useState(false)

  const pollLookup = useCallback(async () => {
    if (!sessionId) return
    const start = Date.now()
    const maxWait = 15_000
    const interval = 1_500

    while (Date.now() - start < maxWait) {
      try {
        const res = await fetch(`/api/guard/lookup?session_id=${encodeURIComponent(sessionId)}`)
        const data = await res.json()
        if (data.found && data.apiKey) {
          setApiKey(data.apiKey)
          setStatus('success')
          setMessage('Your API key is ready.')
          return
        }
      } catch (err) {
        console.error('[success] lookup poll failed:', err)
      }
      await new Promise((resolve) => setTimeout(resolve, interval))
    }

    // Polling window expired — fall back to email message.
    setStatus('success')
    setMessage('Check your email — your API key is on its way.')
  }, [sessionId])

  useEffect(() => {
    if (apiKey) {
      setStatus('success')
      setMessage('Your API key is ready.')
      return
    }
    if (!sessionId) {
      setStatus('error')
      setMessage('Missing session ID — please contact support@gridera.net')
      return
    }
    void pollLookup()
  }, [apiKey, sessionId, pollLookup])

  const copyToClipboard = async () => {
    if (!apiKey) return
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const executorUrl = getExecutorUrl()
  const curlExample = apiKey
    ? `curl -X POST ${executorUrl} \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"input":"What is 2+2?","context":"math question"}'`
    : ''

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <div className="text-6xl mb-6">{status === 'success' ? '✓' : status === 'loading' ? '⏳' : '✗'}</div>
        <h1 className="text-3xl font-bold mb-4">
          {status === 'success' ? 'Welcome to GRIDERA|Guard' : status === 'loading' ? 'Setting up…' : 'Something went wrong'}
        </h1>
        <p className="text-[#888] mb-8">{message}</p>

        {apiKey && (
          <div className="text-left bg-[#0d0d0d] border border-[#262626] rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-mono text-[#00ff88]">YOUR {tier.toUpperCase()} API KEY</div>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 text-xs font-semibold bg-[#262626] hover:bg-[#333] rounded transition"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <code className="block text-sm text-[#e0e0e0] break-all bg-[#151515] p-3 rounded">{apiKey}</code>
            <p className="text-xs text-[#666] mt-3">
              Save this key — we only show it here and in your email. The example below uses it.
            </p>

            {curlExample && (
              <>
                <div className="text-xs font-mono text-[#888] mt-6 mb-2">TRY IT</div>
                <pre className="bg-[#151515] p-3 rounded text-xs text-[#e0e0e0] overflow-x-auto">
                  <code>{curlExample}</code>
                </pre>
              </>
            )}
          </div>
        )}

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
      <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#666]">Setting up…</div>}>
        <SuccessContent />
      </Suspense>
      <Footer />
    </>
  )
}
