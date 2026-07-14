import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createUser,
  createToken,
  setAuthCookie,
  createPurposeToken,
} from '@/lib/auth'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { appBaseUrl, sendAuthEmail } from '@/lib/auth-email'

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .max(128),
  name: z.string().max(100).optional(),
})

export async function POST(req: Request) {
  try {
    const ip = clientIp(req)
    const rl = rateLimit(`signup:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSec) },
        },
      )
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const parsed = signUpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { email, password, name } = parsed.data

    const user = await createUser({ email, password, name })
    if (!user) {
      // Avoid email enumeration detail; still 400 for bad create
      return NextResponse.json(
        { error: 'Could not create account. Email may already be registered.' },
        { status: 400 },
      )
    }

    const token = await createToken({
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      plan: user.plan,
      jurisdiction: user.jurisdiction,
    })
    await setAuthCookie(token)

    // Best-effort verification email (does not block signup)
    try {
      const verifyTok = await createPurposeToken('email_verify', user.id, user.email, '48h')
      const link = `${appBaseUrl()}/api/auth/verify-email?token=${encodeURIComponent(verifyTok)}`
      await sendAuthEmail({
        to: user.email,
        subject: 'Verify your GRIDERA account',
        html: `<p>Welcome to GRIDERA|Comply.</p><p><a href="${link}">Verify your email</a> (link expires in 48 hours).</p>`,
      })
    } catch (e) {
      console.warn('[auth/signup] verify email skipped', e)
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        plan: user.plan,
        jurisdiction: user.jurisdiction,
        name,
      },
    })
  } catch (error) {
    console.error('[auth/signup] Error:', error)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}
