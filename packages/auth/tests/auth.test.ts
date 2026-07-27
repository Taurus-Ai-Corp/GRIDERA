/**
 * Round-trip tests for the reconstructed @taurus/auth.
 *
 * PROVENANCE — read before trusting this package. Its source was never committed
 * to this repository (0 commits across every local and remote ref) and existed on
 * one machine only as compiled `dist/` output. It was reconstructed on 2026-07-26
 * from that output: unminified `tsc` emit with comments intact, plus the `.d.ts`
 * files for the type annotations `tsc` had stripped. Dependency versions
 * (argon2@0.41.1, otpauth@9.5.1, next@16.2.1) were recovered from the surviving
 * pnpm symlinks in node_modules. Nothing imports this package.
 *
 * These tests are therefore the only evidence the reconstruction is faithful.
 * They exercise real cryptography end to end — genuine ML-DSA-65 signing, real
 * argon2id hashing, real TOTP — so a transcription error in the base64url
 * helpers, the shake256 pre-hash, or the base32 encoder would surface as a
 * verification failure rather than passing quietly.
 *
 * Not covered: middleware.ts, which needs a NextRequest and is exercised only
 * through the app. Its route-matching helper is pure and worth testing later.
 */
import { describe, expect, it } from 'vitest'
import { generateKeyPair } from '@taurus/pqc-crypto'
import {
  signJwt,
  verifyJwt,
  decodeJwt,
  hashPassword,
  verifyPassword,
  generateTotpSecret,
  verifyTotp,
  getTotpUri,
  generateRefreshToken,
  hashRefreshToken,
  createSessionCookies,
  clearSessionCookies,
  getSessionCookie,
  getRefreshCookie,
  setCookieHeader,
} from '../src/index.js'

const CLAIMS = {
  sub: 'user_123',
  email: 'ops@taurusai.io',
  orgId: 'org_456',
  role: 'admin' as const,
  jti: 'jti_789',
}

describe('JWT — ML-DSA-65 signed', () => {
  it('signs and verifies a round trip', () => {
    const { publicKey, secretKey } = generateKeyPair()
    const { token, payload } = signJwt(CLAIMS, secretKey, {
      expiresIn: 900,
      kid: 'key-1',
    })

    expect(token.split('.')).toHaveLength(3)
    expect(payload.sub).toBe('user_123')
    expect(payload.exp - payload.iat).toBe(900)

    const verified = verifyJwt(token, publicKey)
    expect(verified).not.toBeNull()
    expect(verified?.email).toBe('ops@taurusai.io')
    expect(verified?.role).toBe('admin')
  })

  it('declares ML-DSA-65 and the key id in the header', () => {
    const { secretKey } = generateKeyPair()
    const { token } = signJwt(CLAIMS, secretKey, { expiresIn: 900, kid: 'key-42' })
    const header = JSON.parse(Buffer.from(token.split('.')[0]!, 'base64url').toString())

    expect(header).toEqual({ alg: 'ML-DSA-65', typ: 'JWT', kid: 'key-42' })
  })

  it('rejects a token verified with the wrong public key', () => {
    const a = generateKeyPair()
    const b = generateKeyPair()
    const { token } = signJwt(CLAIMS, a.secretKey, { expiresIn: 900, kid: 'k' })

    expect(verifyJwt(token, a.publicKey)).not.toBeNull()
    expect(verifyJwt(token, b.publicKey)).toBeNull()
  })

  it('rejects a token whose payload was altered after signing', () => {
    const { publicKey, secretKey } = generateKeyPair()
    const { token } = signJwt(CLAIMS, secretKey, { expiresIn: 900, kid: 'k' })
    const [h, , s] = token.split('.')

    const escalated = Buffer.from(
      JSON.stringify({ ...CLAIMS, role: 'owner', iat: 1, exp: 9_999_999_999 }),
    ).toString('base64url')

    expect(verifyJwt(`${h}.${escalated}.${s}`, publicKey)).toBeNull()
  })

  it('rejects an already-expired token even when the signature is valid', () => {
    const { publicKey, secretKey } = generateKeyPair()
    const { token } = signJwt(CLAIMS, secretKey, { expiresIn: -60, kid: 'k' })

    expect(verifyJwt(token, publicKey)).toBeNull()
  })

  it('rejects structurally malformed tokens without throwing', () => {
    const { publicKey } = generateKeyPair()
    for (const bad of ['', 'a', 'a.b', 'a.b.c.d', 'not.a.token']) {
      expect(verifyJwt(bad, publicKey)).toBeNull()
    }
  })

  it('decodeJwt reads claims WITHOUT verifying — never use it to authorise', () => {
    const { secretKey } = generateKeyPair()
    const { token } = signJwt(CLAIMS, secretKey, { expiresIn: 900, kid: 'k' })
    const [h, p] = token.split('.')

    expect(decodeJwt(token)?.sub).toBe('user_123')
    // A garbage signature still decodes: this is by design, and is exactly why
    // decodeJwt must never gate access.
    expect(decodeJwt(`${h}.${p}.garbage`)?.sub).toBe('user_123')
    expect(decodeJwt('nope')).toBeNull()
  })
})

describe('password — argon2id', () => {
  it('hashes and verifies a round trip', async () => {
    const hash = await hashPassword('correct horse battery staple')

    expect(hash.startsWith('$argon2id$')).toBe(true)
    expect(await verifyPassword(hash, 'correct horse battery staple')).toBe(true)
    expect(await verifyPassword(hash, 'wrong password')).toBe(false)
  })

  it('salts — the same password hashes differently every time', async () => {
    const a = await hashPassword('same-password')
    const b = await hashPassword('same-password')

    expect(a).not.toBe(b)
    expect(await verifyPassword(a, 'same-password')).toBe(true)
    expect(await verifyPassword(b, 'same-password')).toBe(true)
  })

  it('returns false rather than throwing on a malformed hash', async () => {
    expect(await verifyPassword('not-a-hash', 'x')).toBe(false)
    expect(await verifyPassword('', 'x')).toBe(false)
  })
})

describe('TOTP', () => {
  it('generates a base32 secret and an otpauth URI', () => {
    const { secret, uri } = generateTotpSecret()

    // 20 random bytes → 32 base32 characters.
    expect(secret).toMatch(/^[A-Z2-7]+$/)
    expect(secret).toHaveLength(32)
    expect(uri.startsWith('otpauth://totp/')).toBe(true)
    expect(uri).toContain('issuer=GRIDERA')
  })

  it('rejects a wrong code and issues distinct secrets', () => {
    const { secret } = generateTotpSecret()

    expect(verifyTotp(secret, '000000')).toBe(false)
    expect(verifyTotp(secret, 'not-a-code')).toBe(false)
    expect(generateTotpSecret().secret).not.toBe(generateTotpSecret().secret)
  })

  it('embeds the account email in the URI label', () => {
    const { secret } = generateTotpSecret()
    const uri = getTotpUri(secret, 'ops@taurusai.io')

    expect(uri).toContain('ops%40taurusai.io')
    expect(uri).toContain('issuer=GRIDERA')
  })
})

describe('refresh tokens', () => {
  it('returns a token with its matching sha256 hash', () => {
    const { token, hash } = generateRefreshToken()

    // 48 random bytes, base64url — no padding, URL-safe alphabet only.
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(hash).toHaveLength(64)
    expect(hashRefreshToken(token)).toBe(hash)
  })

  it('never repeats a token', () => {
    const seen = new Set(Array.from({ length: 50 }, () => generateRefreshToken().token))
    expect(seen.size).toBe(50)
  })
})

describe('session cookies', () => {
  it('sets HttpOnly, Secure, SameSite=Strict on both cookies', () => {
    const [access, refresh] = createSessionCookies({
      accessToken: 'AT',
      refreshToken: 'RT',
    })

    for (const c of [access, refresh]) {
      expect(c).toContain('HttpOnly')
      expect(c).toContain('SameSite=Strict')
      expect(c).toContain('Secure')
    }
    // The refresh cookie is scoped to the refresh endpoint, so it is not sent
    // on ordinary requests — losing an access token does not leak it.
    expect(access).toContain('Path=/;')
    expect(refresh).toContain('Path=/api/auth/refresh;')
    expect(access).toContain('Max-Age=900')
    expect(refresh).toContain('Max-Age=604800')
  })

  it('omits Secure only when explicitly disabled, for local http dev', () => {
    const [access] = createSessionCookies({
      accessToken: 'AT',
      refreshToken: 'RT',
      secure: false,
    })
    expect(access).not.toContain('Secure')
  })

  it('scopes cookies to a domain when one is given', () => {
    const cookies = createSessionCookies({
      accessToken: 'AT',
      refreshToken: 'RT',
      domain: '.q-grid.net',
    })
    for (const c of cookies) expect(c).toContain('Domain=.q-grid.net')
  })

  it('clears both cookies with Max-Age=0', () => {
    const cleared = clearSessionCookies()
    expect(cleared).toHaveLength(2)
    for (const c of cleared) expect(c).toContain('Max-Age=0')
  })

  it('reads the access and refresh cookies by name', () => {
    const jar = { __session: 'AT', __refresh: 'RT', other: 'x' }
    expect(getSessionCookie(jar)).toBe('AT')
    expect(getRefreshCookie(jar)).toBe('RT')
    expect(getSessionCookie({})).toBeUndefined()
  })

  it('appends to an existing Set-Cookie header rather than replacing it', () => {
    expect(setCookieHeader('a=1')).toBe('a=1')
    expect(setCookieHeader('b=2', 'a=1')).toBe('a=1, b=2')
  })
})
