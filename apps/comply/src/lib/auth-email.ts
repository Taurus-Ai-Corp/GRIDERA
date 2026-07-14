/**
 * Transactional auth email via Resend HTTP API (no Clerk).
 */

export function getResend(): { apiKey: string; from: string } | null {
  const apiKey = process.env['RESEND_API_KEY']
  if (!apiKey) return null
  return {
    apiKey,
    from: process.env['RESEND_FROM_EMAIL'] ?? 'GRIDERA <noreply@q-grid.net>',
  }
}

export function appBaseUrl(): string {
  const explicit = process.env['NEXT_PUBLIC_APP_URL']
  if (explicit) return explicit.replace(/\/$/, '')
  const vercel = process.env['VERCEL_URL']
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`.replace(/\/$/, '')
  return 'https://eu.q-grid.net'
}

export async function sendAuthEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn('[auth-email] RESEND_API_KEY not set — email not sent:', opts.subject, opts.to)
    return { ok: false, error: 'email_not_configured' }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resend.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resend.from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[auth-email] Resend failed', res.status, body)
    return { ok: false, error: `resend_${res.status}` }
  }
  return { ok: true }
}
