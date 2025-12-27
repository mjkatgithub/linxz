import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'

const createErrorMock = vi.fn((params: any = {}) => {
  const error = new Error(params.statusMessage ?? 'Error')
  return Object.assign(error, params)
})

const requireAuthMock = vi.fn()
vi.mock('~/lib/auth', () => ({
  requireAuth: requireAuthMock
}))

type PrismaMock = {
  user: {
    findUnique: ReturnType<typeof vi.fn>
  }
}

let prismaMock: PrismaMock
vi.mock('~/lib/prisma', () => {
  prismaMock = {
    user: {
      findUnique: vi.fn()
    }
  }

  return {
    __esModule: true,
    default: prismaMock
  }
})

type LoggerMock = {
  info: ReturnType<typeof vi.fn>
  error: ReturnType<typeof vi.fn>
  warning: ReturnType<typeof vi.fn>
  debug: ReturnType<typeof vi.fn>
}

let loggerMock: LoggerMock
const createLoggerMock = vi.fn(() => loggerMock)
vi.mock('~/lib/logger', () => {
  loggerMock = {
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    debug: vi.fn()
  }

  return {
    createLogger: createLoggerMock,
    default: loggerMock
  }
})

const createEvent = (overrides: Record<string, unknown> = {}) => ({
  context: {},
  node: {
    req: {
      headers: {}
    },
    res: { statusCode: 200 }
  },
  ...overrides
})

let originalDefineEventHandler: any
let originalCreateError: any

const importUsersMeHandler = async () => {
  vi.resetModules()

  const module = await import('~~/server/api/users/me.get.ts')
  const handler = module.default as (event: any) => Promise<any>

  return {
    handler,
    prisma: prismaMock,
    logger: loggerMock
  }
}

beforeAll(() => {
  originalDefineEventHandler = (globalThis as any).defineEventHandler
  originalCreateError = (globalThis as any).createError

  ;(globalThis as any).defineEventHandler = (handler: any) => handler
  ;(globalThis as any).createError = createErrorMock
})

afterAll(() => {
  ;(globalThis as any).defineEventHandler = originalDefineEventHandler
  ;(globalThis as any).createError = originalCreateError
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/users/me', () => {
  it('returns current user profile for authenticated events', async () => {
    requireAuthMock.mockReturnValue({
      userId: 'user-123'
    })

    const now = new Date('2025-10-05T12:00:00.000Z')
    const updated = new Date('2025-10-05T12:30:00.000Z')

    const userRecord = {
      id: 'user-123',
      username: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User',
      bio: 'About me',
      avatar: 'https://example.com/avatar.png',
      createdAt: now,
      updatedAt: updated
    }

    const { handler, prisma, logger } = await importUsersMeHandler()
    const event = createEvent()

    prisma.user.findUnique.mockResolvedValueOnce(userRecord)

    const result = await handler(event)

    expect(requireAuthMock).toHaveBeenCalledWith(event)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        useGravatar: true,
        createdAt: true,
        updatedAt: true
      }
    })
    expect(result).toEqual(userRecord)
    expect(result).not.toHaveProperty('password')
    expect(logger.error).not.toHaveBeenCalled()
    expect(createErrorMock).not.toHaveBeenCalled()
  })

  it('throws 404 when the user cannot be found', async () => {
    requireAuthMock.mockReturnValue({
      userId: 'missing-user'
    })

    const { handler, prisma, logger } = await importUsersMeHandler()
    const event = createEvent()

    prisma.user.findUnique.mockResolvedValueOnce(null)

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'User nicht gefunden'
    })

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'missing-user' },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        useGravatar: true,
        createdAt: true,
        updatedAt: true
      }
    })
    expect(logger.error).toHaveBeenCalledWith('Error fetching user profile', {
      error: 'User nicht gefunden'
    })
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 404,
      statusMessage: 'User nicht gefunden'
    })
  })

  it('rejects with 401 when authentication header is missing', async () => {
    requireAuthMock.mockImplementation(() => {
      const error = createErrorMock({
        statusCode: 401,
        statusMessage: 'Authorization token required'
      })
      throw error
    })

    const { handler, prisma, logger } = await importUsersMeHandler()
    const event = createEvent()

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Authorization token required'
    })

    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith('Error fetching user profile', {
      error: 'Authorization token required'
    })
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 401,
      statusMessage: 'Authorization token required'
    })
  })

  it('wraps unexpected prisma failures in a 500 error', async () => {
    requireAuthMock.mockReturnValue({
      userId: 'user-500'
    })

    const { handler, prisma, logger } = await importUsersMeHandler()
    const event = createEvent()

    prisma.user.findUnique.mockRejectedValueOnce(new Error('Database down'))

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Fehler beim Abrufen des User-Profils'
    })

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-500' },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        useGravatar: true,
        createdAt: true,
        updatedAt: true
      }
    })
    expect(logger.error).toHaveBeenCalledWith('Error fetching user profile', {
      error: 'Database down'
    })
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 500,
      statusMessage: 'Fehler beim Abrufen des User-Profils'
    })
  })
})

