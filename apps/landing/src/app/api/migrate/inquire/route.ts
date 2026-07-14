import { NextResponse } from 'next/server'
import { getResend } from '@/lib/billing'

// In-memory store fallback when RESEND_API_KEY is not configured.
// Cleared on process restart — purely for local dev / preview environments.
const _inbox: Record<string, unknown>[] = []

type InquiryBody = {
  name?: string
  email?: string
  company?: string
  repoUrl?: string
  message?: string
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  let record: { name: string; email: string; company: string; repoUrl: string; message: string; submittedAt: string } | null = null
  
  try {
    const body = (await req.json().catch(() => null)) as InquiryBody | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { name, email, company, repoUrl, message } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!company || typeof company !== 'string' || !company.trim()) {
      return NextResponse.json({ error: 'Company is required' }, { status: 400 })
    }

    record = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company.trim(),
      repoUrl: repoUrl?.trim() || '',
      message: message?.trim() || '',
      submittedAt: new Date().toISOString(),
    }

    const resend = getResend()

    if (!resend) {
      // No Resend key configured — log and store in memory, still return success.
      console.log('[migrate/inquire] No RESEND_API_KEY — storing in memory:')
      console.log(JSON.stringify(record, null, 2))
      _inbox.push(record)
      return NextResponse.json({ success: true, note: 'Logged (no email service configured)' })
    }

    // Send notification email to admin
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
        <h1 style="color: #00CCAA;">New Gridera.Migrate Inquiry</h1>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; width: 120px; vertical-align: top;">Name</td>
            <td style="padding: 8px 0;">${escapeHtml(record.name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; vertical-align: top;">Email</td>
            <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(record.email)}" style="color: #00CCAA;">${escapeHtml(record.email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; vertical-align: top;">Company</td>
            <td style="padding: 8px 0;">${escapeHtml(record.company)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; vertical-align: top;">Repository</td>
            <td style="padding: 8px 0;">${record.repoUrl ? escapeHtml(record.repoUrl) : '<span style="color:#888;">Not provided</span>'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; vertical-align: top;">Message</td>
            <td style="padding: 8px 0;">${record.message ? escapeHtml(record.message).replace(/\n/g, '<br/>') : '<span style="color:#888;">None</span>'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; vertical-align: top;">Submitted</td>
            <td style="padding: 8px 0; font-family: monospace; font-size: 13px;">${escapeHtml(record.submittedAt)}</td>
          </tr>
        </table>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">
          This is a lead capture inquiry from q-grid.net/migrate. Engagement range: $250K–$1M+.
        </p>
      </body>
      </html>
    `

    const sendResult = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resend.from,
        to: 'admin@taurusai.io',
        replyTo: record.email,
        subject: `[Migrate Inquiry] ${record.company} — ${record.name}`,
        html,
      }),
    })

    if (!sendResult.ok) {
      const errText = await sendResult.text().catch(() => 'unknown')
      console.error('[migrate/inquire] Resend send failed:', sendResult.status, errText)
      // Fall back to in-memory storage instead of failing
      console.log('[migrate/inquire] Falling back to in-memory storage due to email failure')
      _inbox.push(record)
      return NextResponse.json({ success: true, note: 'Logged (email send failed, stored locally)' })
    }

    console.log(`[migrate/inquire] Inquiry from ${record.email} (${record.company}) — email sent to admin`)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[migrate/inquire] Error:', err)
    // Only fall back to in-memory storage if we have a valid record
    if (record) {
      try {
        _inbox.push(record)
        console.log('[migrate/inquire] Record saved to in-memory fallback storage')
        return NextResponse.json({ success: true, note: 'Logged (error occurred, stored locally)' })
      } catch (storageErr) {
        console.error('[migrate/inquire] Fallback storage also failed:', storageErr)
      }
    }
    // No valid record or storage failed — return error
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Inquiry submission failed', detail: message }, { status: 500 })
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}