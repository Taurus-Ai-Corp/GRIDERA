import { NextResponse } from 'next/server'
import { z } from 'zod'
import { updatePassword, verifyPurposeToken } from '@/lib/auth'
import { rateLimit, clientIp } from '@/lib/rate-limit'

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(10).max(128),
})

export async function POST(req: Request) {
  try {
    const ip = clientIp(req)
    const rl = rateLimit(`reset:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const claims = await verifyPurposeToken(parsed.data.token, 'password_reset')
    if (!claims) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    const ok = await updatePassword(claims.userId, parsed.data.password)
    if (!ok) {
      return NextResponse.json({ error: 'Could not update password' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'Password updated. You can sign in.' })
  } catch (error) {
    console.error('[auth/reset-password]', error)
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
  }
}
