import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'

const getRouterParamMock = vi.fn()
const createErrorMock = vi.fn((params: any = {}) => {
  const error = new Error(params.statusMessage ?? 'Error')
  return Object.assign(error, params)
})

vi.mock('h3', () => ({
  getRouterParam: getRouterParamMock,
  createError: createErrorMock
}))

const requireAuthMock = vi.fn()
vi.mock('~/lib/auth', () => ({
  requireAuth: requireAuthMock
}))

const createEvent = (overrides: Record<string, unknown> = {}) => ({
  context: {},
  node: {
    req: {},
    res: { statusCode: 200 }
  },
  ...overrides
})

type PrismaMock = {
  link: {
    findFirst: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
}

type LoggerMock = {
  error: ReturnType<typeof vi.fn>
  info: ReturnType<typeof vi.fn>
  warning: ReturnType<typeof vi.fn>
  debug: ReturnType<typeof vi.fn>
}

let originalDefineEventHandler: any
let originalCreateError: any
let originalGetRouterParam: any

const importDeleteHandler = async () => {
  vi.resetModules()

  const prismaModule = await import('~/lib/prisma')
  const loggerModule = await import('~/lib/logger')
  await import('~/lib/auth')
  const module = await import('~/server/api/links/[id].delete.ts')

  const prisma = prismaModule.default as unknown as PrismaMock
  const logger = loggerModule.default as unknown as LoggerMock
  const handler = module.default as (event: any) => Promise<any>

  return { handler, prisma, logger }
}

beforeAll(() => {
  originalDefineEventHandler = (globalThis as any).defineEventHandler
  originalCreateError = (globalThis as any).createError
  originalGetRouterParam = (globalThis as any).getRouterParam

  ;(globalThis as any).defineEventHandler = (handler: any) => handler
  ;(globalThis as any).createError = createErrorMock
  ;(globalThis as any).getRouterParam = getRouterParamMock
})

afterAll(() => {
  ;(globalThis as any).defineEventHandler = originalDefineEventHandler
  ;(globalThis as any).createError = originalCreateError
  ;(globalThis as any).getRouterParam = originalGetRouterParam
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DELETE /api/links/:id', () => {
  it('deletes link and returns sanitized payload', async () => {
    const { handler, prisma, logger } = await importDeleteHandler()
    const event = createEvent()
    const removedLink = {
      id: 12,
      title: 'Old link',
      url: 'https://remove.example',
      description: 'to delete',
      isActive: true,
      order: 3,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      userId: 5
    }

    requireAuthMock.mockReturnValue({ userId: 5 })
    getRouterParamMock.mockReturnValue('12')
    prisma.link.findFirst.mockResolvedValue({ id: 12, userId: 5 } as any)
    prisma.link.delete.mockResolvedValue(removedLink as any)

    const result = await handler(event)

    expect(requireAuthMock).toHaveBeenCalledWith(event)
    expect(getRouterParamMock).toHaveBeenCalledWith(event, 'id')
    expect(prisma.link.findFirst).toHaveBeenCalledWith({
      where: {
        id: 12,
        userId: 5
      }
    })
    expect(prisma.link.delete).toHaveBeenCalledWith({ where: { id: 12 } })
    expect(result).toEqual({
      id: 12,
      title: 'Old link',
      url: 'https://remove.example',
      description: 'to delete',
      isActive: true,
      order: 3,
      createdAt: removedLink.createdAt
    })
    expect(logger.error).not.toHaveBeenCalled()
    expect(createErrorMock).not.toHaveBeenCalled()
  })

  it('returns 400 when id param is missing', async () => {
    const { handler, prisma, logger } = await importDeleteHandler()
    const event = createEvent()

    requireAuthMock.mockReturnValue({ userId: 1 })
    getRouterParamMock.mockReturnValue(undefined)

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Missing route param id'
    })

    expect(prisma.link.findFirst).not.toHaveBeenCalled()
    expect(prisma.link.delete).not.toHaveBeenCalled()
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: 'Missing route param id'
    })
    expect(logger.error).toHaveBeenCalledWith('Error deleting link', {
      error: 'Missing route param id'
    })
  })

  it('rejects unauthenticated requests', async () => {
    const { handler, prisma, logger } = await importDeleteHandler()
    const event = createEvent()

    requireAuthMock.mockImplementation(() => {
      throw createErrorMock({
        statusCode: 401,
        statusMessage: 'Authorization token required'
      })
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Authorization token required'
    })

    expect(prisma.link.findFirst).not.toHaveBeenCalled()
    expect(prisma.link.delete).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith('Error deleting link', {
      error: 'Authorization token required'
    })
  })

  it('returns 404 when link does not belong to the user', async () => {
    const { handler, prisma, logger } = await importDeleteHandler()

    requireAuthMock.mockReturnValue({ userId: 99 })
    getRouterParamMock.mockReturnValue('77')
    prisma.link.findFirst.mockResolvedValue(null)

    await expect(handler(createEvent())).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Link nicht gefunden'
    })

    expect(prisma.link.delete).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith('Error deleting link', {
      error: 'Link nicht gefunden'
    })
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 404,
      statusMessage: 'Link nicht gefunden'
    })
  })

  it('wraps unexpected prisma errors', async () => {
    const { handler, prisma, logger } = await importDeleteHandler()

    requireAuthMock.mockReturnValue({ userId: 2 })
    getRouterParamMock.mockReturnValue('9')
    prisma.link.findFirst.mockResolvedValue({ id: 9, userId: 2 } as any)
    prisma.link.delete.mockRejectedValue(new Error('Database failure'))

    await expect(handler(createEvent())).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Fehler beim Löschen des Links'
    })

    expect(logger.error).toHaveBeenCalledWith('Error deleting link', {
      error: 'Database failure'
    })
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 500,
      statusMessage: 'Fehler beim Löschen des Links'
    })
  })
})

