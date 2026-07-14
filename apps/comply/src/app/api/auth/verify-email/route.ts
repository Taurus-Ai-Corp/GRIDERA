import { NextResponse } from 'next/server'
import { verifyPurposeToken } from '@/lib/auth'
import { appBaseUrl } from '@/lib/auth-email'

/**
 * GET /api/auth/verify-email?token=...
 * Confirms the signed email-verify JWT. Full persistence of emailVerifiedAt
 * lands with Better Auth schema work; this endpoint proves mailbox control.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  const base = appBaseUrl()

  if (!token) {
    return NextResponse.redirect(`${base}/sign-in?verify=missing`)
  }

  const claims = await verifyPurposeToken(token, 'email_verify')
  if (!claims) {
    return NextResponse.redirect(`${base}/sign-in?verify=invalid`)
  }

  // Success — mailbox control proven for this user id/email pair
  return NextResponse.redirect(
    `${base}/sign-in?verify=ok&email=${encodeURIComponent(claims.email)}`,
  )
}
