import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateUser, createToken, setAuthCookie } from '@/lib/auth'

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ─── POST /api/auth/signin ────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const parsed = signInSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { email, password } = parsed.data

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