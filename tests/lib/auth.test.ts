import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Nuxt functions
const mockGetHeader = vi.fn()
const mockCreateError = vi.fn((error: any) => {
  const err = new Error(error?.statusMessage ?? 'Auth error')
  return Object.assign(err, error)
})

// Mock JWT functions
const mockExtractTokenFromHeader = vi.fn()
const mockVerifyToken = vi.fn()

// Mock h3 module
vi.mock('h3', () => ({
  getHeader: mockGetHeader,
  createError: mockCreateError
}))

// Mock H3Event type
const createMockEvent = (context: any = {}) => ({
  __is_event__: true,
  node: {},
  _handled: false,
  _onBeforeResponseCalled: false,
  _onAfterResponseCalled: false,
  _onErrorCalled: false,
  _onResponseCalled: false,
  method: 'GET',
  path: '/',
  headers: {},
  url: 'http://localhost/',
  query: {},
  body: null,
  context
} as any)

// Mock JWT module
vi.mock('~/lib/jwt', () => ({
  extractTokenFromHeader: mockExtractTokenFromHeader,
  verifyToken: mockVerifyToken
}))

describe('Auth Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requireAuth', () => {
    it('should return user payload for valid token', async () => {
      const mockPayload = {
        userId: 123,
        username: 'testuser',
        email: 'test@example.com'
      }

      const mockEvent = createMockEvent()

      mockGetHeader.mockReturnValue('Bearer valid.token')
      mockExtractTokenFromHeader.mockReturnValue('valid.token')
      mockVerifyToken.mockReturnValue(mockPayload)

      // Import the function
      const { requireAuth } = await import('~/lib/auth')
      const result = requireAuth(mockEvent)

      expect(mockGetHeader).toHaveBeenCalledWith(mockEvent, 'authorization')
      expect(mockExtractTokenFromHeader).toHaveBeenCalledWith('Bearer valid.token')
      expect(mockVerifyToken).toHaveBeenCalledWith('valid.token')
      expect(result).toEqual(mockPayload)
      expect((mockEvent.context as any).user).toEqual(mockPayload)
    })

    it('should throw error when no authorization header', async () => {
      const mockEvent = createMockEvent()

      mockGetHeader.mockReturnValue(undefined)
      mockExtractTokenFromHeader.mockReturnValue(null)

      const { requireAuth } = await import('~/lib/auth')

      expect(() => requireAuth(mockEvent)).toThrow()
      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 401,
        statusMessage: 'Authorization token required'
      })
    })

    it('should throw error when token is invalid', async () => {
      const mockEvent = createMockEvent()

      mockGetHeader.mockReturnValue('Bearer invalid.token')
      mockExtractTokenFromHeader.mockReturnValue('invalid.token')
      mockVerifyToken.mockReturnValue(null)

      const { requireAuth } = await import('~/lib/auth')

      expect(() => requireAuth(mockEvent)).toThrow()
      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 401,
        statusMessage: 'Invalid or expired token'
      })
    })

    it('should throw error when token is expired', async () => {
      const mockEvent = createMockEvent()

      mockGetHeader.mockReturnValue('Bearer expired.token')
      mockExtractTokenFromHeader.mockReturnValue('expired.token')
      mockVerifyToken.mockReturnValue(null)

      const { requireAuth } = await import('~/lib/auth')

      expect(() => requireAuth(mockEvent)).toThrow()
      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 401,
        statusMessage: 'Invalid or expired token'
      })
    })

    it('should handle different authorization header formats', async () => {
      const mockPayload = {
        userId: 456,
        username: 'anotheruser',
        email: 'another@example.com'
      }

      const mockEvent = createMockEvent()

      mockGetHeader.mockReturnValue('Bearer different.token')
      mockExtractTokenFromHeader.mockReturnValue('different.token')
      mockVerifyToken.mockReturnValue(mockPayload)

      const { requireAuth } = await import('~/lib/auth')
      const result = requireAuth(mockEvent)

      expect(result).toEqual(mockPayload)
      expect((mockEvent.context as any).user).toEqual(mockPayload)
    })

    it('should handle empty authorization header', async () => {
      const mockEvent = createMockEvent()

      mockGetHeader.mockReturnValue('')
      mockExtractTokenFromHeader.mockReturnValue(null)

      const { requireAuth } = await import('~/lib/auth')

      expect(() => requireAuth(mockEvent)).toThrow()
      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 401,
        statusMessage: 'Authorization token required'
      })
    })

    it('should handle malformed authorization header', async () => {
      const mockEvent = createMockEvent()

      mockGetHeader.mockReturnValue('Basic dXNlcjpwYXNz')
      mockExtractTokenFromHeader.mockReturnValue(null)

      const { requireAuth } = await import('~/lib/auth')

      expect(() => requireAuth(mockEvent)).toThrow()
      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 401,
        statusMessage: 'Authorization token required'
      })
    })
  })

  describe('optionalAuth', () => {
    it('should return user payload for valid token', async () => {
      const mockPayload = {
        userId: 789,
        username: 'optionaluser',
        email: 'optional@example.com'
      }

      const mockEvent = createMockEvent()

      mockGetHeader.mockReturnValue('Bearer valid.token')
      mockExtractTokenFromHeader.mockReturnValue('valid.token')
      mockVerifyToken.mockReturnValue(mockPayload)

      const { optionalAuth } = await import('~/lib/auth')
      const result = optionalAuth(mockEvent)

      expect(result).toEqual(mockPayload)
      expect((mockEvent.context as any).user).toEqual(mockPayload)
    })

    it('should return null when no authorization header', async () => {
      const mockEvent = createMockEvent()

      mockGetHeader.mockReturnValue(undefined)
      mockExtractTokenFromHeader.mockReturnValue(null)

      const { optionalAuth } = await import('~/lib/auth')
      const result = optionalAuth(mockEvent)

      expect(result).toBeNull()
    })

    it('should return null when token is invalid', async () => {
      const mockEvent = createMockEvent()

      mockGetHeader.mockReturnValue('Bearer invalid.token')
      mockExtractTokenFromHeader.mockReturnValue('invalid.token')
      mockVerifyToken.mockReturnValue(null)

      const { optionalAuth } = await import('~/lib/auth')
      const result = optionalAuth(mockEvent)

      expect(result).toBeNull()
    })

    it('should return null when token is expired', async () => {
      const mockEvent = createMockEvent()

      mockGetHeader.mockReturnValue('Bearer expired.token')
      mockExtractTokenFromHeader.mockReturnValue('expired.token')
      mockVerifyToken.mockReturnValue(null)

      const { optionalAuth } = await import('~/lib/auth')
      const result = optionalAuth(mockEvent)

      expect(result).toBeNull()
    })

    it('should return null for empty authorization header', async () => {
      const mockEvent = createMockEvent()

      mockGetHeader.mockReturnValue('')
      mockExtractTokenFromHeader.mockReturnValue(null)

      const { optionalAuth } = await import('~/lib/auth')
      const result = optionalAuth(mockEvent)

      expect(result).toBeNull()
    })

    it('should return null for malformed authorization header', async () => {
      const mockEvent = createMockEvent()

      mockGetHeader.mockReturnValue('Basic dXNlcjpwYXNz')
      mockExtractTokenFromHeader.mockReturnValue(null)

      const { optionalAuth } = await import('~/lib/auth')
      const result = optionalAuth(mockEvent)

      expect(result).toBeNull()
    })

    it('should handle different user payloads', async () => {
      const mockPayload = {
        userId: 999,
        username: 'special@user',
        email: 'special@example.com'
      }

      const mockEvent = createMockEvent()

      mockGetHeader.mockReturnValue('Bearer special.token')
      mockExtractTokenFromHeader.mockReturnValue('special.token')
      mockVerifyToken.mockReturnValue(mockPayload)

      const { optionalAuth } = await import('~/lib/auth')
      const result = optionalAuth(mockEvent)

      expect(result).toEqual(mockPayload)
      expect((mockEvent.context as any).user).toEqual(mockPayload)
    })
  })

  describe('integration scenarios', () => {
    it('should handle requireAuth and optionalAuth with same token', async () => {
      const mockPayload = {
        userId: 111,
        username: 'integrationuser',
        email: 'integration@example.com'
      }

      const mockEvent = createMockEvent()

      mockGetHeader.mockReturnValue('Bearer integration.token')
      mockExtractTokenFromHeader.mockReturnValue('integration.token')
      mockVerifyToken.mockReturnValue(mockPayload)

      const { requireAuth, optionalAuth } = await import('~/lib/auth')
      
      const requireResult = requireAuth(mockEvent)
      const optionalResult = optionalAuth(mockEvent)

      expect(requireResult).toEqual(mockPayload)
      expect(optionalResult).toEqual(mockPayload)
      expect((mockEvent.context as any).user).toEqual(mockPayload)
    })

    it('should handle event with existing context', async () => {
      const mockPayload = {
        userId: 222,
        username: 'existinguser',
        email: 'existing@example.com'
      }

      const mockEvent = createMockEvent({
        existingData: 'some data'
      })

      mockGetHeader.mockReturnValue('Bearer existing.token')
      mockExtractTokenFromHeader.mockReturnValue('existing.token')
      mockVerifyToken.mockReturnValue(mockPayload)

      const { requireAuth } = await import('~/lib/auth')
      const result = requireAuth(mockEvent)

      expect(result).toEqual(mockPayload)
      expect((mockEvent.context as any).user).toEqual(mockPayload)
      expect(mockEvent.context.existingData).toBe('some data')
    })
  })
})
