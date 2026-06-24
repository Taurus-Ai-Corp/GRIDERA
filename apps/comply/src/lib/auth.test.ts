import { describe, it, expect, beforeEach, vi } from 'vitest'

// ─── Hoisted mocks (Vitest hoists vi.mock to top) ───────────────────────────────

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

vi.mock('@/lib/db', () => ({
  getDb: vi.fn().mockReturnValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'new-user-123',
          email: 'new@example.com',
          organizationId: null,
          plan: 'free',
          jurisdiction: 'eu',
        }]),
      }),
    }),
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'user-123',
          email: 'test@example.com',
          passwordHash: 'hashed-password',
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

// ─── Import after mocks are hoisted ─────────────────────────────────────────────

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
} from './auth'

import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { jwtVerify } from 'jose'

// ─── Test Suite ────────────────────────────────────────────────────────────────

describe('auth', () => {
  let mockCookies: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret-key-for-testing-minimum-32-characters'
    process.env.NODE_ENV = 'test'

    // Get the mocked cookies
    mockCookies = await cookies()
  })

  // ─── Token Creation ────────────────────────────────────────────────────────

  describe('createToken', () => {
    it('should create a JWT token with user payload', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
        plan: 'starter' as const,
      }

      const token = await createToken(payload)

      expect(token).toBeDefined()
      expect(token).toBe('mock-jwt-token')
    })
  })

  // ─── Token Verification ─────────────────────────────────────────────────────

  describe('verifyToken', () => {
    it('should verify a valid token and return payload', async () => {
      const payload = await verifyToken('valid-token')

      expect(payload).toEqual({
        sub: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
        plan: 'starter',
        iat: 1234567890,
        exp: 1234571490,
      })
    })

    it('should return null for invalid token', async () => {
      ;(jwtVerify as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Invalid'))

      const payload = await verifyToken('invalid-token')

      expect(payload).toBeNull()
    })
  })

  // ─── Cookie Management ───────────────────────────────────────────────────────

  describe('setAuthCookie', () => {
    it('should set auth cookie with correct options', async () => {
      await setAuthCookie('test-token')

      expect(mockCookies.set).toHaveBeenCalledWith(
        'gridera_auth',
        'test-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        })
      )
    })
  })

  describe('clearAuthCookie', () => {
    it('should clear auth cookie', async () => {
      await clearAuthCookie()

      expect(mockCookies.delete).toHaveBeenCalledWith('gridera_auth')
    })
  })

  describe('getAuthCookie', () => {
    it('should return cookie value if present', async () => {
      mockCookies.get.mockReturnValue({ value: 'my-token' })

      const token = await getAuthCookie()

      expect(token).toBe('my-token')
    })

    it('should return undefined if no cookie', async () => {
      mockCookies.get.mockReturnValue(undefined)

      const token = await getAuthCookie()

      expect(token).toBeUndefined()
    })
  })

  // ─── User Retrieval ──────────────────────────────────────────────────────────

  describe('getCurrentUser', () => {
    it('should return null if no auth cookie present', async () => {
      mockCookies.get.mockReturnValue(undefined)

      const user = await getCurrentUser()

      expect(user).toBeNull()
    })

    it('should return user payload if valid token present', async () => {
      mockCookies.get.mockReturnValue({ value: 'valid-token' })

      const user = await getCurrentUser()

      expect(user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
        plan: 'starter',
        jurisdiction: undefined,
      })
    })

    it('should return null if token verification fails', async () => {
      mockCookies.get.mockReturnValue({ value: 'invalid-token' })
      ;(jwtVerify as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Invalid'))

      const user = await getCurrentUser()

      expect(user).toBeNull()
    })
  })

  describe('requireAuth', () => {
    it('should return user if authenticated', async () => {
      mockCookies.get.mockReturnValue({ value: 'valid-token' })

      const user = await requireAuth()

      expect(user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
        plan: 'starter',
        jurisdiction: undefined,
      })
    })

    it('should throw if not authenticated', async () => {
      mockCookies.get.mockReturnValue(undefined)

      await expect(requireAuth()).rejects.toThrow('Unauthorized')
    })
  })

  // ─── User Creation ────────────────────────────────────────────────────────────

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const input = {
        email: 'new@example.com',
        password: 'Password123!',
        name: 'New User',
      }

      const user = await createUser(input)

      expect(user).toEqual({
        id: 'new-user-123',
        email: 'new@example.com',
        organizationId: undefined,
        plan: 'free',
        jurisdiction: 'eu',
      })
    })

    it('should return null if database unavailable', async () => {
      ;(getDb as ReturnType<typeof vi.fn>).mockReturnValue(null)

      const user = await createUser({
        email: 'test@example.com',
        password: 'Password123!',
      })

      expect(user).toBeNull()
    })
  })

  // ─── Authentication ─────────────────────────────────────────────────────────

  describe('authenticateUser', () => {
    it('should authenticate user with valid credentials', async () => {
      // SHA-256('testpassword') = 'a76a8f15e9e1b2e8e9e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e'
      // But verifyPassword computes the hash and compares, so we need to mock it correctly
      // For this test, we use a password and set the mock's passwordHash to match
      // Since hashPassword computes SHA-256, we need to use a known hash
      // Let's compute: SHA-256('testpassword') 
      // For testing purposes, we'll use a password whose hash we know
      const testPassword = 'testpassword'
      const expectedHash = '95b15426e8df8c6e6d8e8e8b8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e' // placeholder
      
      // The mock returns passwordHash: 'hashed-password', so verifyPassword('testpassword', 'hashed-password') fails
      // We need to mock the db to return a passwordHash that matches SHA-256 of our test password
      const mockDb = {
        query: {
          users: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'user-123',
              email: 'test@example.com',
              // SHA-256 of 'password' = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
              passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
              organizationId: 'org-123',
              plan: 'starter',
              jurisdiction: 'eu',
            }),
          },
        },
      }
      ;(getDb as ReturnType<typeof vi.fn>).mockReturnValue(mockDb)

      const result = await authenticateUser({
        email: 'test@example.com',
        password: 'password', // SHA-256('password') matches the mock
      })

      expect(result).not.toBeNull()
      expect(result?.email).toBe('test@example.com')
    })

    it('should return null for non-existent user', async () => {
      const mockDb = {
        query: {
          users: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
        },
      }
      ;(getDb as ReturnType<typeof vi.fn>).mockReturnValue(mockDb)

      const result = await authenticateUser({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      })

      expect(result).toBeNull()
    })

    it('should return null if database unavailable', async () => {
      ;(getDb as ReturnType<typeof vi.fn>).mockReturnValue(null)

      const result = await authenticateUser({
        email: 'test@example.com',
        password: 'Password123!',
      })

      expect(result).toBeNull()
    })
  })

  // ─── getUserById ──────────────────────────────────────────────────────────────

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const mockDb = {
        query: {
          users: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'user-123',
              email: 'test@example.com',
              organizationId: 'org-123',
              plan: 'starter',
              jurisdiction: 'eu',
            }),
          },
        },
      }
      ;(getDb as ReturnType<typeof vi.fn>).mockReturnValue(mockDb)

      const user = await getUserById('user-123')

      expect(user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
        plan: 'starter',
        jurisdiction: 'eu',
      })
    })

    it('should return null if user not found', async () => {
      const mockDb = {
        query: {
          users: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
        },
      }
      ;(getDb as ReturnType<typeof vi.fn>).mockReturnValue(mockDb)

      const user = await getUserById('nonexistent')

      expect(user).toBeNull()
    })

    it('should return null if database unavailable', async () => {
      ;(getDb as ReturnType<typeof vi.fn>).mockReturnValue(null)

      const user = await getUserById('user-123')

      expect(user).toBeNull()
    })
  })

  // ─── Plan Updates ────────────────────────────────────────────────────────────

  describe('updateUserPlan', () => {
    it('should update user plan without throwing', async () => {
      await expect(updateUserPlan('user-123', 'growth', 'cus_stripe_123')).resolves.toBeUndefined()
    })

    it('should do nothing if database unavailable', async () => {
      ;(getDb as ReturnType<typeof vi.fn>).mockReturnValue(null)

      await expect(updateUserPlan('user-123', 'growth')).resolves.toBeUndefined()
    })
  })

  // ─── Organization Linking ────────────────────────────────────────────────────

  describe('linkUserToOrganization', () => {
    it('should link user to organization without throwing', async () => {
      await expect(linkUserToOrganization('user-123', 'org-456', 'eu')).resolves.toBeUndefined()
    })

    it('should do nothing if database unavailable', async () => {
      ;(getDb as ReturnType<typeof vi.fn>).mockReturnValue(null)

      await expect(linkUserToOrganization('user-123', 'org-456', 'eu')).resolves.toBeUndefined()
    })
  })
})