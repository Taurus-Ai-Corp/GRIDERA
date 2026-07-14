import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createPurposeToken, getUserByEmail } from '@/lib/auth'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { appBaseUrl, sendAuthEmail } from '@/lib/auth-email'

const schema = z.object({
  email: z.string().email(),
})

/**
 * Always returns 200 with generic message (no email enumeration).
 */
export async function POST(req: Request) {
  try {
    const ip = clientIp(req)
    const rl = rateLimit(`forgot:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 })
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: true, message: 'If an account exists, a reset link was sent.' },
        { status: 200 },
      )
    }

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const email = parsed.data.email.toLowerCase()
    const user = await getUserByEmail(email)
    if (user) {
      const token = await createPurposeToken('password_reset', user.id, user.email, '1h')
      const link = `${appBaseUrl()}/sign-in?reset=${encodeURIComponent(token)}`
      await sendAuthEmail({
        to: user.email,
        subject: 'Reset your GRIDERA password',
        html: `<p>Reset your password:</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour. If you did not request this, ignore this email.</p>`,
      })
    }

    return NextResponse.json({
      ok: true,
      message: 'If an account exists, a reset link was sent.',
    })
  } catch (error) {
    console.error('[auth/forgot-password]', error)
    return NextResponse.json({
      ok: true,
      message: 'If an account exists, a reset link was sent.',
    })
  }
}
