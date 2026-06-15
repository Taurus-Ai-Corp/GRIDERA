import { createHash, randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import type { Database } from './client'
import { guardKeys } from './schema/guard-keys'

const API_KEY_PREFIX_LENGTH = 8

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

function generateApiKey(): string {
  return `guard_${randomBytes(32).toString('base64url')}`
}

export async function createGuardKey({
  db,
  email,
  tier = 'sandbox',
  monthlyLimit = 1000,
  stripeCustomerId,
  stripeSubscriptionId,
}: {
  db: Database
  email: string
  tier?: string
  monthlyLimit?: number
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}) {
  const apiKey = generateApiKey()
  const apiKeyHash = hashApiKey(apiKey)
  const apiKeyPrefix = apiKey.slice(0, API_KEY_PREFIX_LENGTH)

  const [record] = await db
    .insert(guardKeys)
    .values({
      email,
      apiKeyHash,
      apiKeyPrefix,
      tier,
      monthlyLimit,
      stripeCustomerId,
      stripeSubscriptionId,
    })
    .returning()

  return { record, apiKey }
}

export async function findGuardKeyByHash(db: Database, hash: string) {
  return db.query.guardKeys.findFirst({
    where: eq(guardKeys.apiKeyHash, hash),
  })
}

export async function findGuardKeyByEmail(db: Database, email: string) {
  return db.query.guardKeys.findFirst({
    where: eq(guardKeys.email, email),
  })
}

export async function activatePaidTier(
  db: Database,
  email: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  tier: 'smb' | 'enterprise' = 'smb'
) {
  const monthlyLimit = tier === 'enterprise' ? 0 : 100_000

  const [record] = await db
    .update(guardKeys)
    .set({
      active: true,
      tier,
      stripeCustomerId,
      stripeSubscriptionId,
      monthlyLimit,
    })
    .where(eq(guardKeys.email, email))
    .returning()

  return record
}

export async function revokeGuardKey(db: Database, id: string) {
  const [record] = await db
    .update(guardKeys)
    .set({
      active: false,
      revokedAt: new Date(),
    })
    .where(eq(guardKeys.id, id))
    .returning()

  return record
}

export async function findGuardKeyByCustomerId(db: Database, stripeCustomerId: string) {
  return db.query.guardKeys.findFirst({
    where: eq(guardKeys.stripeCustomerId, stripeCustomerId),
  })
}

/**
 * Rotate the stored API key for an existing record (e.g. when a sandbox key
 * is promoted to a paid tier and a fresh live key is issued). Only the hash
 * and prefix are persisted — the plaintext key is returned once to the caller.
 */
export async function rotateGuardKeyHash(db: Database, id: string, apiKey: string) {
  const [record] = await db
    .update(guardKeys)
    .set({
      apiKeyHash: hashApiKey(apiKey),
      apiKeyPrefix: apiKey.slice(0, API_KEY_PREFIX_LENGTH),
    })
    .where(eq(guardKeys.id, id))
    .returning()

  return record
}
