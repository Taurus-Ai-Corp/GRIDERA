import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateUser, createToken, setAuthCookie } from '@/lib/auth'
import { rateLimit, clientIp } from '@/lib/rate-limit'

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(req: Request) {
  try {
    const ip = clientIp(req)
    const rl = rateLimit(`signin:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSec) },
        },
      )
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const parsed = signInSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { email, password } = parsed.data

    // Per-email soft limit (credential stuffing)
    const emailRl = rateLimit(`signin-email:${email.toLowerCase()}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    })
    if (!emailRl.allowed) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts for this account.' },
        { status: 429, headers: { 'Retry-After': String(emailRl.retryAfterSec) } },
      )
    }

    const user = await authenticateUser({ email, password })
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await createToken({
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      plan: user.plan,
      jurisdiction: user.jurisdiction,
    })

    await setAuthCookie(token)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        plan: user.plan,
        jurisdiction: user.jurisdiction,
      },
    })
  } catch (error) {
    console.error('[auth/signin] Error:', error)
    return NextResponse.json({ error: 'Sign in failed' }, { status: 500 })
  }
}
