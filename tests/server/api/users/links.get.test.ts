import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'

const createErrorMock = vi.fn((params: any = {}) => {
  const error = new Error(params.statusMessage ?? 'Error')
  return Object.assign(error, params)
})

vi.mock('h3', () => ({
  createError: createErrorMock
}))

const requireAuthMock = vi.fn()
vi.mock('~/lib/auth', () => ({
  requireAuth: requireAuthMock
}))

type PrismaMock = {
  link: {
    findMany: ReturnType<typeof vi.fn>
  }
}

let prismaMock: PrismaMock
vi.mock('~/lib/prisma', () => {
  prismaMock = {
    link: {
      findMany: vi.fn()
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
  node: { req: {}, res: { statusCode: 200 } },
  ...overrides
})

let originalDefineEventHandler: any
let originalCreateError: any

const importHandler = async () => {
  vi.resetModules()

  const module = await import('~/server/api/users/links.get.ts')
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

describe('GET /api/users/links', () => {
  it('returns links for the authenticated user', async () => {
    requireAuthMock.mockReturnValue({ userId: 'user-123' })

    const { handler, prisma, logger } = await importHandler()

    const mockLinks = [
      {
        id: 'link-1',
        title: 'First',
        url: 'https://example.com/first',
        description: 'First link',
        icon: 'icon-1',
        order: 0,
        isActive: true,
        createdAt: new Date('2025-01-01T00:00:00Z')
      },
      {
        id: 'link-2',
        title: 'Second',
        url: 'https://example.com/second',
        description: 'Second link',
        icon: 'icon-2',
        order: 1,
        isActive: false,
        createdAt: new Date('2025-01-02T00:00:00Z')
      }
    ]

    prisma.link.findMany.mockResolvedValue(mockLinks as any)

    const event = createEvent()
    const result = await handler(event)

    expect(requireAuthMock).toHaveBeenCalledWith(event)
    expect(createLoggerMock).toHaveBeenCalledWith('api')
    expect(prisma.link.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        url: true,
        description: true,
        icon: true,
        order: true,
        isActive: true,
        createdAt: true
      }
    })
    expect(result).toEqual({ links: mockLinks })
    expect(logger.error).not.toHaveBeenCalled()
    expect(logger.warning).not.toHaveBeenCalled()
  })

  it('returns an empty list when the user has no links', async () => {
    requireAuthMock.mockReturnValue({ userId: 'user-456' })

    const { handler, prisma, logger } = await importHandler()

    prisma.link.findMany.mockResolvedValue([])

    const event = createEvent()
    const result = await handler(event)

    expect(requireAuthMock).toHaveBeenCalledWith(event)
    expect(prisma.link.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-456' },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        url: true,
        description: true,
        icon: true,
        order: true,
        isActive: true,
        createdAt: true
      }
    })
    expect(result).toEqual({ links: [] })
    expect(logger.error).not.toHaveBeenCalled()
    expect(logger.warning).not.toHaveBeenCalled()
  })

  it('logs and throws a 500 error when prisma fails', async () => {
    requireAuthMock.mockReturnValue({ userId: 'user-789' })

    const { handler, prisma, logger } = await importHandler()

    const prismaError = new Error('Database failure')
    prisma.link.findMany.mockRejectedValue(prismaError)

    const event = createEvent()

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Fehler beim Abrufen der Links'
    })

    expect(prisma.link.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-789' },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        url: true,
        description: true,
        icon: true,
        order: true,
        isActive: true,
        createdAt: true
      }
    })
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 500,
      statusMessage: 'Fehler beim Abrufen der Links'
    })
    expect(logger.error).toHaveBeenCalledWith('Error fetching user links', {
      error: 'Database failure'
    })
    expect(logger.warning).not.toHaveBeenCalled()
  })

  it('rethrows existing server errors without wrapping', async () => {
    requireAuthMock.mockReturnValue({ userId: 'user-500' })

    const { handler, prisma, logger } = await importHandler()

    const serverError = Object.assign(new Error('Service outage'), { statusCode: 502 })
    prisma.link.findMany.mockRejectedValueOnce(serverError)

    const event = createEvent()

    await expect(handler(event)).rejects.toBe(serverError)

    expect(logger.warning).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith('Error fetching user links', {
      error: 'Service outage'
    })
    expect(createErrorMock).not.toHaveBeenCalled()
  })

  it('propagates client errors with their status codes', async () => {
    const clientError = new Error('Nicht authentifiziert') as any
    clientError.statusCode = 401
    requireAuthMock.mockImplementation(() => {
      throw clientError
    })

    const { handler, logger } = await importHandler()
    const event = createEvent()

    await expect(handler(event)).rejects.toBe(clientError)

    expect(logger.warning).toHaveBeenCalledWith('Client error while fetching user links', {
      statusCode: 401,
      error: 'Nicht authentifiziert'
    })
    expect(logger.error).not.toHaveBeenCalled()
    expect(createErrorMock).not.toHaveBeenCalled()
  })
})
