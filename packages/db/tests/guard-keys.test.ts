/**
 * Characterization tests for src/guard-keys.ts.
 *
 * NO DATABASE IS TOUCHED. `Database` is imported as a type only, so the drizzle
 * query builder is never constructed against a real connection — we hand each
 * function a hand-rolled fake that records the builder calls and returns a
 * canned row. `eq(...)` from drizzle-orm is used for real (it just builds an SQL
 * AST object), which keeps the where-clause assertions honest without a driver.
 *
 * What this can prove: key generation, hashing, prefixing, tier/limit defaults,
 * and the exact column payload each function writes.
 * What it cannot prove: that the SQL executes correctly against Postgres.
 */

import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import type { Database } from '../src/client'
import {
  activatePaidTier,
  createGuardKey,
  findGuardKeyByCustomerId,
  findGuardKeyByEmail,
  findGuardKeyByHash,
  hashApiKey,
  revokeGuardKey,
  rotateGuardKeyHash,
} from '../src/guard-keys'

const ROW = { id: 'row-id' }

/**
 * Deep-search a drizzle SQL AST for a bound value. The AST holds a back-
 * reference from column to table, so it is circular and cannot be JSON
 * stringified — hence the explicit `seen` set.
 */
function astContainsValue(node: unknown, needle: unknown, seen = new Set<unknown>()): boolean {
  if (node === needle) return true
  if (typeof node !== 'object' || node === null) return false
  if (seen.has(node)) return false
  seen.add(node)
  return Object.values(node as Record<string, unknown>).some((child) =>
    astContainsValue(child, needle, seen),
  )
}

interface InsertSpy {
  db: Database
  table?: unknown
  values?: Record<string, unknown>
}

function fakeInsertDb(): InsertSpy {
  const spy: InsertSpy = {} as InsertSpy
  spy.db = {
    insert(table: unknown) {
      spy.table = table
      return {
        values(values: Record<string, unknown>) {
          spy.values = values
          return { returning: async () => [ROW] }
        },
      }
    },
  } as unknown as Database
  return spy
}

interface UpdateSpy {
  db: Database
  set?: Record<string, unknown>
  where?: unknown
  rows: unknown[]
}

function fakeUpdateDb(rows: unknown[] = [ROW]): UpdateSpy {
  const spy: UpdateSpy = { rows } as UpdateSpy
  spy.db = {
    update() {
      return {
        set(values: Record<string, unknown>) {
          spy.set = values
          return {
            where(clause: unknown) {
              spy.where = clause
              return { returning: async () => spy.rows }
            },
          }
        },
      }
    },
  } as unknown as Database
  return spy
}

interface QuerySpy {
  db: Database
  where?: unknown
  result: unknown
}

/**
 * `...rest` rather than a default parameter: the "no row found" cases need to
 * pass an explicit `undefined`, which a default would silently replace with ROW.
 */
function fakeQueryDb(...rest: unknown[]): QuerySpy {
  const result = rest.length > 0 ? rest[0] : ROW
  const spy: QuerySpy = { result } as QuerySpy
  spy.db = {
    query: {
      guardKeys: {
        findFirst: async (args: { where: unknown }) => {
          spy.where = args.where
          return spy.result
        },
      },
    },
  } as unknown as Database
  return spy
}

describe('hashApiKey', () => {
  it('is SHA-256, hex-encoded', () => {
    // Known vector for the empty string.
    expect(hashApiKey('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
  })

  it('matches an independent SHA-256 of the same input', () => {
    const key = 'guard_abc123'
    expect(hashApiKey(key)).toBe(createHash('sha256').update(key).digest('hex'))
  })

  it('is deterministic', () => {
    expect(hashApiKey('guard_xyz')).toBe(hashApiKey('guard_xyz'))
  })

  it('produces 64 hex characters', () => {
    expect(hashApiKey('anything')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is sensitive to a single-character change', () => {
    expect(hashApiKey('guard_a')).not.toBe(hashApiKey('guard_b'))
  })

  it('is case-sensitive', () => {
    expect(hashApiKey('GUARD_A')).not.toBe(hashApiKey('guard_a'))
  })
})

describe('createGuardKey', () => {
  it('returns a plaintext key with the guard_ prefix', async () => {
    const spy = fakeInsertDb()
    const { apiKey } = await createGuardKey({ db: spy.db, email: 'a@b.com' })
    expect(apiKey.startsWith('guard_')).toBe(true)
  })

  it('generates a 32-byte base64url secret after the prefix', async () => {
    const spy = fakeInsertDb()
    const { apiKey } = await createGuardKey({ db: spy.db, email: 'a@b.com' })
    const secret = apiKey.slice('guard_'.length)
    // 32 bytes base64url == 43 chars, unpadded, url-safe alphabet only.
    expect(secret).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('generates a different key on every call', async () => {
    const a = await createGuardKey({ db: fakeInsertDb().db, email: 'a@b.com' })
    const b = await createGuardKey({ db: fakeInsertDb().db, email: 'a@b.com' })
    expect(a.apiKey).not.toBe(b.apiKey)
  })

  it('NEVER persists the plaintext key — only the hash and prefix', async () => {
    const spy = fakeInsertDb()
    const { apiKey } = await createGuardKey({ db: spy.db, email: 'a@b.com' })
    const persisted = JSON.stringify(spy.values)
    expect(persisted).not.toContain(apiKey)
    expect(persisted).not.toContain(apiKey.slice('guard_'.length))
  })

  it('persists the SHA-256 hash of the plaintext key', async () => {
    const spy = fakeInsertDb()
    const { apiKey } = await createGuardKey({ db: spy.db, email: 'a@b.com' })
    expect(spy.values?.['apiKeyHash']).toBe(hashApiKey(apiKey))
  })

  it('persists an 8-character prefix taken from the start of the key', async () => {
    const spy = fakeInsertDb()
    const { apiKey } = await createGuardKey({ db: spy.db, email: 'a@b.com' })
    expect(spy.values?.['apiKeyPrefix']).toBe(apiKey.slice(0, 8))
    expect(String(spy.values?.['apiKeyPrefix'])).toHaveLength(8)
  })

  it("defaults tier to 'sandbox' and monthlyLimit to 1000", async () => {
    const spy = fakeInsertDb()
    await createGuardKey({ db: spy.db, email: 'a@b.com' })
    expect(spy.values?.['tier']).toBe('sandbox')
    expect(spy.values?.['monthlyLimit']).toBe(1000)
  })

  it('honours an explicit tier and monthlyLimit', async () => {
    const spy = fakeInsertDb()
    await createGuardKey({
      db: spy.db,
      email: 'a@b.com',
      tier: 'enterprise',
      monthlyLimit: 0,
    })
    expect(spy.values?.['tier']).toBe('enterprise')
    expect(spy.values?.['monthlyLimit']).toBe(0)
  })

  it('passes through email and optional Stripe identifiers', async () => {
    const spy = fakeInsertDb()
    await createGuardKey({
      db: spy.db,
      email: 'a@b.com',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
    })
    expect(spy.values?.['email']).toBe('a@b.com')
    expect(spy.values?.['stripeCustomerId']).toBe('cus_1')
    expect(spy.values?.['stripeSubscriptionId']).toBe('sub_1')
  })

  it('leaves Stripe identifiers undefined when not supplied', async () => {
    const spy = fakeInsertDb()
    await createGuardKey({ db: spy.db, email: 'a@b.com' })
    expect(spy.values?.['stripeCustomerId']).toBeUndefined()
    expect(spy.values?.['stripeSubscriptionId']).toBeUndefined()
  })

  it('returns the inserted record alongside the plaintext key', async () => {
    const spy = fakeInsertDb()
    const result = await createGuardKey({ db: spy.db, email: 'a@b.com' })
    expect(result.record).toBe(ROW)
  })
})

describe('activatePaidTier', () => {
  it("defaults to the 'smb' tier with a 100,000 monthly limit", async () => {
    const spy = fakeUpdateDb()
    await activatePaidTier(spy.db, 'a@b.com', 'cus_1', 'sub_1')
    expect(spy.set?.['tier']).toBe('smb')
    expect(spy.set?.['monthlyLimit']).toBe(100_000)
  })

  it("gives the 'enterprise' tier an unlimited (0) monthly limit", async () => {
    const spy = fakeUpdateDb()
    await activatePaidTier(spy.db, 'a@b.com', 'cus_1', 'sub_1', 'enterprise')
    expect(spy.set?.['tier']).toBe('enterprise')
    expect(spy.set?.['monthlyLimit']).toBe(0)
  })

  it('marks the key active and stores the Stripe identifiers', async () => {
    const spy = fakeUpdateDb()
    await activatePaidTier(spy.db, 'a@b.com', 'cus_9', 'sub_9')
    expect(spy.set?.['active']).toBe(true)
    expect(spy.set?.['stripeCustomerId']).toBe('cus_9')
    expect(spy.set?.['stripeSubscriptionId']).toBe('sub_9')
  })

  it('does not touch the stored key material', async () => {
    const spy = fakeUpdateDb()
    await activatePaidTier(spy.db, 'a@b.com', 'cus_1', 'sub_1')
    expect(spy.set).not.toHaveProperty('apiKeyHash')
    expect(spy.set).not.toHaveProperty('apiKeyPrefix')
  })

  it('returns the first updated row', async () => {
    const spy = fakeUpdateDb([ROW, { id: 'second' }])
    await expect(activatePaidTier(spy.db, 'a@b.com', 'c', 's')).resolves.toBe(ROW)
  })

  it('returns undefined when no row matched', async () => {
    const spy = fakeUpdateDb([])
    await expect(activatePaidTier(spy.db, 'a@b.com', 'c', 's')).resolves.toBeUndefined()
  })
})

describe('revokeGuardKey', () => {
  it('sets active to false', async () => {
    const spy = fakeUpdateDb()
    await revokeGuardKey(spy.db, 'id-1')
    expect(spy.set?.['active']).toBe(false)
  })

  it('stamps revokedAt with a Date', async () => {
    const spy = fakeUpdateDb()
    const before = Date.now()
    await revokeGuardKey(spy.db, 'id-1')
    const revokedAt = spy.set?.['revokedAt']
    expect(revokedAt).toBeInstanceOf(Date)
    expect((revokedAt as Date).getTime()).toBeGreaterThanOrEqual(before)
  })

  it('does not clear the stored hash (revocation is a flag, not a delete)', async () => {
    const spy = fakeUpdateDb()
    await revokeGuardKey(spy.db, 'id-1')
    expect(spy.set).not.toHaveProperty('apiKeyHash')
  })

  it('returns undefined when no row matched', async () => {
    const spy = fakeUpdateDb([])
    await expect(revokeGuardKey(spy.db, 'missing')).resolves.toBeUndefined()
  })
})

describe('rotateGuardKeyHash', () => {
  it('stores the hash of the new key, never the plaintext', async () => {
    const spy = fakeUpdateDb()
    const newKey = 'guard_rotated_value'
    await rotateGuardKeyHash(spy.db, 'id-1', newKey)
    expect(spy.set?.['apiKeyHash']).toBe(hashApiKey(newKey))
    expect(JSON.stringify(spy.set)).not.toContain(newKey)
  })

  it('updates the prefix to the first 8 characters of the new key', async () => {
    const spy = fakeUpdateDb()
    await rotateGuardKeyHash(spy.db, 'id-1', 'guard_rotated_value')
    expect(spy.set?.['apiKeyPrefix']).toBe('guard_ro')
  })

  it('does not reactivate or re-tier the key as a side effect', async () => {
    const spy = fakeUpdateDb()
    await rotateGuardKeyHash(spy.db, 'id-1', 'guard_x')
    expect(spy.set).not.toHaveProperty('active')
    expect(spy.set).not.toHaveProperty('tier')
    expect(spy.set).not.toHaveProperty('monthlyLimit')
  })

  it('returns undefined when no row matched', async () => {
    const spy = fakeUpdateDb([])
    await expect(rotateGuardKeyHash(spy.db, 'missing', 'guard_x')).resolves.toBeUndefined()
  })
})

describe('lookup helpers', () => {
  it('findGuardKeyByHash queries with a where clause and returns the row', async () => {
    const spy = fakeQueryDb()
    await expect(findGuardKeyByHash(spy.db, 'deadbeef')).resolves.toBe(ROW)
    expect(spy.where).toBeDefined()
  })

  it('findGuardKeyByEmail returns the row', async () => {
    const spy = fakeQueryDb()
    await expect(findGuardKeyByEmail(spy.db, 'a@b.com')).resolves.toBe(ROW)
    expect(spy.where).toBeDefined()
  })

  it('findGuardKeyByCustomerId returns the row', async () => {
    const spy = fakeQueryDb()
    await expect(findGuardKeyByCustomerId(spy.db, 'cus_1')).resolves.toBe(ROW)
    expect(spy.where).toBeDefined()
  })

  it.each([
    ['findGuardKeyByHash', findGuardKeyByHash],
    ['findGuardKeyByEmail', findGuardKeyByEmail],
    ['findGuardKeyByCustomerId', findGuardKeyByCustomerId],
  ] as const)('%s resolves undefined when nothing matches', async (_name, fn) => {
    const spy = fakeQueryDb(undefined)
    await expect(fn(spy.db, 'nope')).resolves.toBeUndefined()
  })

  it('lookups take a plaintext-free argument — callers must hash first', async () => {
    // Characterization: findGuardKeyByHash does NOT hash for you. Passing a raw
    // key here would silently never match. Locking this in so a future change
    // to hash-on-behalf-of-caller is a conscious one.
    const spy = fakeQueryDb()
    const rawKey = 'guard_plaintext'
    await findGuardKeyByHash(spy.db, rawKey)
    expect(astContainsValue(spy.where, rawKey)).toBe(true)
    expect(astContainsValue(spy.where, hashApiKey(rawKey))).toBe(false)
  })
})
