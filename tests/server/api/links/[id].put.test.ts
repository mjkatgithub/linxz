import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest"

const getRouterParamMock = vi.fn()
const readBodyMock = vi.fn()
const createErrorMock = vi.fn((params: any = {}) => {
  const error = new Error(params.statusMessage ?? 'Error')
  return Object.assign(error, params)
})

vi.mock('h3', () => ({
  getRouterParam: getRouterParamMock,
  readBody: readBodyMock,
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
    update: ReturnType<typeof vi.fn>
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
let originalReadBody: any

const importPutHandler = async () => {
  vi.resetModules()

  const prismaModule = await import('~/lib/prisma')
  const loggerModule: any = await import('~/lib/logger')
  await import('~/lib/auth')
  const module = await import('~/server/api/links/[id].put.ts')

  const prisma = prismaModule.default as unknown as PrismaMock
  const loggerFactory = loggerModule.createLogger as unknown as { mock: { results: Array<{ value: LoggerMock }> } }
  const logger = (loggerFactory.mock.results[0]?.value ?? loggerModule.default) as LoggerMock

  const handler = module.default as (event: any) => Promise<any>

  return { handler, prisma, logger }
}

beforeAll(() => {
  originalDefineEventHandler = (globalThis as any).defineEventHandler
  originalCreateError = (globalThis as any).createError
  originalGetRouterParam = (globalThis as any).getRouterParam
  originalReadBody = (globalThis as any).readBody

  ;(globalThis as any).defineEventHandler = (handler: any) => handler
  ;(globalThis as any).createError = createErrorMock
  ;(globalThis as any).getRouterParam = getRouterParamMock
  ;(globalThis as any).readBody = readBodyMock
})

afterAll(() => {
  ;(globalThis as any).defineEventHandler = originalDefineEventHandler
  ;(globalThis as any).createError = originalCreateError
  ;(globalThis as any).getRouterParam = originalGetRouterParam
  ;(globalThis as any).readBody = originalReadBody
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PUT /api/links/:id', () => {
  it('updates link and returns sanitized payload', async () => {
    const { handler, prisma, logger } = await importPutHandler()
    const event = createEvent()
    const updatedAt = new Date('2024-02-02T10:20:30.000Z')

    requireAuthMock.mockReturnValue({ userId: 3 })
    getRouterParamMock.mockReturnValue('42')
    readBodyMock.mockResolvedValue({
      title: 'Updated Title',
      url: 'https://updated.example',
      description: 'Updated description',
      isActive: true,
      order: 8
    })
    prisma.link.findFirst.mockResolvedValue({ id: 42, userId: 3 } as any)
    prisma.link.update.mockResolvedValue({
      id: 42,
      title: 'Updated Title',
      url: 'https://updated.example',
      description: 'Updated description',
      isActive: true,
      order: 8,
      createdAt: updatedAt,
      userId: 3
    })

    const parseIntSpy = vi.spyOn(globalThis, 'parseInt')

    const result = await handler(event)

    expect(requireAuthMock).toHaveBeenCalledWith(event)
    expect(getRouterParamMock).toHaveBeenCalledWith(event, 'id')
    expect(readBodyMock).toHaveBeenCalledWith(event)
    expect(parseIntSpy).toHaveBeenCalledWith('42', 10)
    expect(prisma.link.findFirst).toHaveBeenCalledWith({
      where: {
        id: 42,
        userId: 3
      }
    })
    expect(prisma.link.update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: {
        title: 'Updated Title',
        url: 'https://updated.example',
        description: 'Updated description',
        isActive: true,
        order: 8
      }
    })
    expect(result).toEqual({
      id: 42,
      title: 'Updated Title',
      url: 'https://updated.example',
      description: 'Updated description',
      isActive: true,
      order: 8,
      createdAt: updatedAt
    })
    expect(logger.error).not.toHaveBeenCalled()
    parseIntSpy.mockRestore()
  })

  it('returns 400 when id param is missing', async () => {
    const { handler, prisma, logger } = await importPutHandler()
    const event = createEvent()

    requireAuthMock.mockReturnValue({ userId: 7 })
    getRouterParamMock.mockReturnValue(undefined)
    const parseIntSpy = vi.spyOn(globalThis, 'parseInt')

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Missing route param id'
    })

    expect(parseIntSpy).not.toHaveBeenCalled()
    expect(readBodyMock).not.toHaveBeenCalled()
    expect(prisma.link.findFirst).not.toHaveBeenCalled()
    expect(prisma.link.update).not.toHaveBeenCalled()
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: 'Missing route param id'
    })
    expect(logger.error).toHaveBeenCalledWith('Error updating link', {
      error: 'Missing route param id'
    })

    parseIntSpy.mockRestore()
  })

  it('returns 404 when link does not belong to the user', async () => {
    const { handler, prisma, logger } = await importPutHandler()

    requireAuthMock.mockReturnValue({ userId: 5 })
    getRouterParamMock.mockReturnValue('9')
    readBodyMock.mockResolvedValue({
      title: 'Irrelevant',
      url: 'https://example.test'
    })
    prisma.link.findFirst.mockResolvedValue(null)
    const parseIntSpy = vi.spyOn(globalThis, 'parseInt')

    await expect(handler(createEvent())).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Link nicht gefunden'
    })

    expect(parseIntSpy).toHaveBeenCalledWith('9', 10)
    expect(prisma.link.update).not.toHaveBeenCalled()
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 404,
      statusMessage: 'Link nicht gefunden'
    })
    expect(logger.error).toHaveBeenCalledWith('Error updating link', {
      error: 'Link nicht gefunden'
    })

    parseIntSpy.mockRestore()
  })

  it('wraps unexpected prisma errors', async () => {
    const { handler, prisma, logger } = await importPutHandler()

    requireAuthMock.mockReturnValue({ userId: 11 })
    getRouterParamMock.mockReturnValue('15')
    readBodyMock.mockResolvedValue({
      title: 'Broken',
      url: 'https://broken.example'
    })
    prisma.link.findFirst.mockResolvedValue({ id: 15, userId: 11 } as any)
    prisma.link.update.mockRejectedValue(new Error('Database failure'))
    const parseIntSpy = vi.spyOn(globalThis, 'parseInt')

    await expect(handler(createEvent())).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Fehler beim Aktualisieren des Links'
    })

    expect(parseIntSpy).toHaveBeenCalledWith('15', 10)
    expect(prisma.link.update).toHaveBeenCalledWith({
      where: { id: 15 },
      data: expect.objectContaining({
        title: 'Broken',
        url: 'https://broken.example'
      })
    })
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 500,
      statusMessage: 'Fehler beim Aktualisieren des Links'
    })
    expect(logger.error).toHaveBeenCalledWith('Error updating link', {
      error: 'Database failure'
    })

    parseIntSpy.mockRestore()
  })

  it('rejects unauthenticated requests', async () => {
    const { handler, prisma, logger } = await importPutHandler()
    const event = createEvent()

    requireAuthMock.mockImplementation(() => {
      throw createErrorMock({
        statusCode: 401,
        statusMessage: 'Authorization token required'
      })
    })
    const parseIntSpy = vi.spyOn(globalThis, 'parseInt')

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Authorization token required'
    })

    expect(getRouterParamMock).not.toHaveBeenCalled()
    expect(readBodyMock).not.toHaveBeenCalled()
    expect(prisma.link.findFirst).not.toHaveBeenCalled()
    expect(prisma.link.update).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith('Error updating link', {
      error: 'Authorization token required'
    })
    expect(createErrorMock).toHaveBeenNthCalledWith(1, {
      statusCode: 401,
      statusMessage: 'Authorization token required'
    })
    expect(parseIntSpy).not.toHaveBeenCalled()

    parseIntSpy.mockRestore()
  })
})
