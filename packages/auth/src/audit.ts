import { createStamp } from '@taurus/pqc-crypto'
import type { Jurisdiction, PqcStamp } from '@taurus/pqc-crypto'

export interface AuthEvent {
  userId: string
  eventType:
    | 'login'
    | 'logout'
    | 'register'
    | 'password_reset_requested'
    | 'password_reset_completed'
    | 'mfa_enabled'
    | 'mfa_disabled'
    | 'mfa_verified'
    | 'mfa_failed'
    | 'login_failed'
    | 'token_refreshed'
    | 'token_revoked'
  ip?: string
  userAgent?: string
  jurisdiction: Jurisdiction
}

export async function logAuthEvent(
  event: AuthEvent,
  pqcSecretKey: Uint8Array,
  pqcPublicKey: Uint8Array,
): Promise<PqcStamp> {
  const payload = {
    ...event,
    timestamp: Date.now(),
  }

  return createStamp(
    {
      type: 'audit',
      id: crypto.randomUUID(),
      payload,
      jurisdiction: event.jurisdiction,
    },
    pqcSecretKey,
    pqcPublicKey,
  )
}
