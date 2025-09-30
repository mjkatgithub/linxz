import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'

const getQueryMock = vi.fn()
const createErrorMock = vi.fn((params: any = {}) => {
  const error = new Error(params.statusMessage ?? 'Error')
  return Object.assign(error, params)
})

vi.mock('h3', () => ({
  getQuery: getQueryMock,
  createError: createErrorMock
}))

const createEvent = (overrides: Record<string, unknown> = {}) => ({
  context: {},
  node: { req: {} },
  ...overrides
})

let originalDefineEventHandler: any
let originalCreateError: any
let originalGetQuery: any

type PrismaMock = {
  user: {
    findUnique: ReturnType<typeof vi.fn>
  }
}

type LoggerMock = {
  info: ReturnType<typeof vi.fn>
  error: ReturnType<typeof vi.fn>
  warning: ReturnType<typeof vi.fn>
  debug: ReturnType<typeof vi.fn>
  notice?: ReturnType<typeof vi.fn>
}

const importLinksHandler = async () => {
  vi.resetModules()

  const prismaModule = await import('~/lib/prisma')
  const loggerModule: any = await import('~/lib/logger')

  const module = await import('~/server/api/links.get')
  const handler = module.default as (event: any) => Promise<any>

  const prisma = prismaModule.default as unknown as PrismaMock
  const loggerFactory = loggerModule.createLogger as unknown as { mock: { results: Array<{ value: LoggerMock }> } }
  const logger = (loggerFactory.mock.results[0]?.value ?? loggerModule.default) as LoggerMock

  logger.notice = vi.fn()

  return { handler, prisma, logger }
}

beforeAll(() => {
  originalDefineEventHandler = (globalThis as any).defineEventHandler
  originalCreateError = (globalThis as any).createError
  originalGetQuery = (globalThis as any).getQuery

  ;(globalThis as any).defineEventHandler = (handler: any) => handler
  ;(globalThis as any).createError = createErrorMock
  ;(globalThis as any).getQuery = getQueryMock
})

afterAll(() => {
  ;(globalThis as any).defineEventHandler = originalDefineEventHandler
  ;(globalThis as any).createError = originalCreateError
  ;(globalThis as any).getQuery = originalGetQuery
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/links', () => {
  it('returns user with active links', async () => {
    const { handler, prisma, logger } = await importLinksHandler()

    const mockUser = {
      id: 1,
      username: 'jane',
      name: 'Jane Doe',
      avatar: 'avatar.png',
      bio: 'Bio text',
      links: [
        { id: 1, title: 'First', url: 'https://first.test', description: 'desc', icon: 'icon-1', order: 0 },
        { id: 2, title: 'Second', url: 'https://second.test', description: 'desc 2', icon: 'icon-2', order: 1 }
      ]
    }

    getQueryMock.mockReturnValue({ username: 'jane' })
    prisma.user.findUnique.mockResolvedValue(mockUser as any)

    const event = createEvent()
    const result = await handler(event)

    expect(getQueryMock).toHaveBeenCalledWith(event)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: 'jane' },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        links: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            url: true,
            description: true,
            icon: true,
            order: true
          }
        }
      }
    })
    expect(result).toEqual(mockUser)
    expect(logger.notice).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('returns user with empty link list', async () => {
    const { handler, prisma, logger } = await importLinksHandler()

    const mockUser = {
      id: 2,
      username: 'empty',
      name: 'No Links',
      avatar: null,
      bio: null,
      links: [] as any[]
    }

    getQueryMock.mockReturnValue({ username: 'empty' })
    prisma.user.findUnique.mockResolvedValue(mockUser as any)

    const result = await handler(createEvent())

    expect(result).toEqual(mockUser)
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1)
    expect(logger.notice).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('logs notice and returns 404 when user is missing', async () => {
    const { handler, prisma, logger } = await importLinksHandler()

    getQueryMock.mockReturnValue({ username: 'ghost' })
    prisma.user.findUnique.mockResolvedValue(null)

    await expect(handler(createEvent())).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'User nicht gefunden'
    })

    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1)
    expect(logger.notice).toHaveBeenCalledWith('User not found', {
      username: 'ghost'
    })
    expect(logger.error).not.toHaveBeenCalled()
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 404,
      statusMessage: 'User nicht gefunden'
    })
  })

  it('returns 400 when username is missing', async () => {
    const { handler, prisma, logger } = await importLinksHandler()

    getQueryMock.mockReturnValue({})
    const event = createEvent()

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Username ist erforderlich'
    })

    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: 'Username ist erforderlich'
    })
    expect(logger.error).toHaveBeenCalledWith('API error', expect.objectContaining({
      endpoint: '/api/links',
      method: 'GET',
      error: 'Username ist erforderlich'
    }))
  })

  it('propagates prisma errors and logs them', async () => {
    const { handler, prisma, logger } = await importLinksHandler()

    const prismaError = Object.assign(new Error('Database failure'), {
      statusCode: 500,
      statusMessage: 'Interner Serverfehler'
    })

    getQueryMock.mockReturnValue({ username: 'broken' })
    prisma.user.findUnique.mockRejectedValue(prismaError)

    await expect(handler(createEvent())).rejects.toBe(prismaError)

    expect(logger.error).toHaveBeenCalledWith('API error', expect.objectContaining({
      endpoint: '/api/links',
      method: 'GET',
      error: 'Database failure'
    }))
    expect(createErrorMock).not.toHaveBeenCalled()
  })
})
