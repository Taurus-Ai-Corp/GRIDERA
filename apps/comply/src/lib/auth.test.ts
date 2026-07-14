import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}))

vi.mock('jose', () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuer: vi.fn().mockReturnThis(),
    setAudience: vi.fn().mockReturnThis(),
    setSubject: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue('mock-jwt-token'),
  })),
  jwtVerify: vi.fn().mockResolvedValue({
    payload: {
      sub: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123',
      plan: 'starter',
      iat: 1234567890,
      exp: 1234571490,
    },
  }),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$12$hashedpassword'),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue('$2b$12$hashedpassword'),
  compare: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn().mockReturnValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: 'new-user-123',
            email: 'new@example.com',
            organizationId: null,
            plan: 'free',
            jurisdiction: 'eu',
          },
        ]),
      }),
    }),
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'user-123',
          email: 'test@example.com',
          passwordHash: '$2b$12$hashedpassword',
          organizationId: 'org-123',
          plan: 'starter',
          jurisdiction: 'eu',
        }),
      },
    },
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
}))

vi.mock('@taurus/db', () => ({
  users: {
    id: 'id',
    email: 'email',
    passwordHash: 'passwordHash',
    organizationId: 'organizationId',
    plan: 'plan',
    jurisdiction: 'jurisdiction',
    stripeCustomerId: 'stripeCustomerId',
  },
}))

import {
  createToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  getAuthCookie,
  getCurrentUser,
  requireAuth,
  createUser,
  authenticateUser,
  getUserById,
  updateUserPlan,
  linkUserToOrganization,
  hashPassword,
  verifyPassword,
} from './auth'

import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { jwtVerify } from 'jose'
import * as bcrypt from 'bcryptjs'

describe('auth', () => {
  let mockCookies: {
    get: ReturnType<typeof vi.fn>
    set: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env['JWT_SECRET'] = 'test-secret-at-least-32-characters-long!!'
    // NODE_ENV is read-only in vitest/TS — leave unset (dev path allows test secret)
    mockCookies = (await cookies()) as unknown as typeof mockCookies
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(bcrypt.hash).mockResolvedValue('$2b$12$hashedpassword' as never)
  })

  describe('createToken', () => {
    it('should create a JWT token with user payload', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
        plan: 'starter',
      }
      const token = await createToken(payload)
      expect(token).toBe('mock-jwt-token')
    })
  })

  describe('verifyToken', () => {
    it('should return payload for valid token', async () => {
      const payload = await verifyToken('any-token')
      expect(payload?.sub).toBe('user-123')
      expect(payload?.email).toBe('test@example.com')
    })

    it('should return null for invalid token', async () => {
      ;(jwtVerify as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Invalid'))
      const payload = await verifyToken('bad')
      expect(payload).toBeNull()
    })
  })

  describe('password hashing', () => {
    it('hashes with bcrypt', async () => {
      const h = await hashPassword('secure-password-here')
      expect(h).toContain('$2b$')
      expect(bcrypt.hash).toHaveBeenCalled()
    })

    it('verifies bcrypt hashes', async () => {
      const ok = await verifyPassword('x', '$2b$12$hashedpassword')
      expect(ok).toBe(true)
    })
  })

  describe('cookies', () => {
    it('setAuthCookie sets httpOnly cookie', async () => {
      await setAuthCookie('tok')
      expect(mockCookies.set).toHaveBeenCalled()
    })

    it('clearAuthCookie deletes cookie', async () => {
      await clearAuthCookie()
      expect(mockCookies.delete).toHaveBeenCalled()
    })

    it('getAuthCookie reads cookie', async () => {
      mockCookies.get.mockReturnValue({ value: 'tok' })
      await expect(getAuthCookie()).resolves.toBe('tok')
    })
  })

  describe('getCurrentUser', () => {
    it('returns null without cookie', async () => {
      mockCookies.get.mockReturnValue(undefined)
      await expect(getCurrentUser()).resolves.toBeNull()
    })

    it('returns user from valid token', async () => {
      mockCookies.get.mockReturnValue({ value: 'tok' })
      const user = await getCurrentUser()
      expect(user?.id).toBe('user-123')
    })
  })

  describe('requireAuth', () => {
    it('throws when unauthenticated', async () => {
      mockCookies.get.mockReturnValue(undefined)
      await expect(requireAuth()).rejects.toThrow('Unauthorized')
    })
  })

  describe('createUser', () => {
    it('creates user with bcrypt hash', async () => {
      const user = await createUser({
        email: 'new@example.com',
        password: 'longpassword1',
      })
      expect(user?.id).toBe('new-user-123')
      expect(bcrypt.hash).toHaveBeenCalled()
    })

    it('returns null when db unavailable', async () => {
      vi.mocked(getDb).mockReturnValueOnce(null as never)
      await expect(
        createUser({ email: 'x@y.com', password: 'longpassword1' }),
      ).resolves.toBeNull()
    })
  })

  describe('authenticateUser', () => {
    it('returns user on valid credentials', async () => {
      const user = await authenticateUser({
        email: 'test@example.com',
        password: 'password',
      })
      expect(user?.id).toBe('user-123')
    })

    it('returns null on bad password', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never)
      const user = await authenticateUser({
        email: 'test@example.com',
        password: 'wrong',
      })
      expect(user).toBeNull()
    })
  })

  describe('getUserById', () => {
    it('returns user', async () => {
      const user = await getUserById('user-123')
      expect(user?.email).toBe('test@example.com')
    })
  })

  describe('updateUserPlan / linkUserToOrganization', () => {
    it('updates plan', async () => {
      await updateUserPlan('user-123', 'growth', 'cus_x')
      expect(getDb).toHaveBeenCalled()
    })

    it('links org', async () => {
      await linkUserToOrganization('user-123', 'org-1', 'eu')
      expect(getDb).toHaveBeenCalled()
    })
  })
})
