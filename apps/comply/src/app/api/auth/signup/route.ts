import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createUser, createToken, setAuthCookie } from '@/lib/auth'

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().max(100).optional(),
})

// ─── POST /api/auth/signup ────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const parsed = signUpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { email, password, name } = parsed.data

    const user = await createUser({ email, password, name })
    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
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
        name,
      },
    })
  } catch (error) {
    console.error('[auth/signup] Error:', error)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}