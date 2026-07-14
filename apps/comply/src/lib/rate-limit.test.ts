import { describe, it, expect } from 'vitest'
import { rateLimit } from './rate-limit'

describe('rateLimit', () => {
  it('allows under limit and blocks over', () => {
    const key = `test-${Date.now()}-${Math.random()}`
    const a = rateLimit(key, { limit: 2, windowMs: 60_000 })
    const b = rateLimit(key, { limit: 2, windowMs: 60_000 })
    const c = rateLimit(key, { limit: 2, windowMs: 60_000 })
    expect(a.allowed).toBe(true)
    expect(b.allowed).toBe(true)
    expect(c.allowed).toBe(false)
    expect(c.retryAfterSec).toBeGreaterThan(0)
  })
})
