import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'

const readBodyMock = vi.fn()
const createErrorMock = vi.fn((params: any = {}) => {
  const error = new Error(params.statusMessage ?? 'Error')
  return Object.assign(error, params)
})

vi.mock('h3', () => ({
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
    create: ReturnType<typeof vi.fn>
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
let originalReadBody: any

const importLinksPostHandler = async () => {
  vi.resetModules()

  const prismaModule = await import('~/lib/prisma')
  const loggerModule = await import('~/lib/logger')
  await import('~/lib/auth')
  const module = await import('~/server/api/links.post')

  const prisma = prismaModule.default as unknown as PrismaMock
  const logger = loggerModule.default as unknown as LoggerMock
  const handler = module.default as (event: any) => Promise<any>

  return { handler, prisma, logger }
}

beforeAll(() => {
  originalDefineEventHandler = (globalThis as any).defineEventHandler
  originalCreateError = (globalThis as any).createError
  originalReadBody = (globalThis as any).readBody

  ;(globalThis as any).defineEventHandler = (handler: any) => handler
  ;(globalThis as any).createError = createErrorMock
  ;(globalThis as any).readBody = readBodyMock
})

afterAll(() => {
  ;(globalThis as any).defineEventHandler = originalDefineEventHandler
  ;(globalThis as any).createError = originalCreateError
  ;(globalThis as any).readBody = originalReadBody
})

describe('POST /api/links', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a link and returns 201 with the sanitized payload', async () => {
    const { handler, prisma, logger } = await importLinksPostHandler()
    const event = createEvent()
    const createdAt = new Date('2024-01-01T12:34:56.000Z')

    requireAuthMock.mockReturnValue({ userId: 99 })
    readBodyMock.mockResolvedValue({
      title: 'My Link',
      url: 'https://example.com',
      description: 'A useful resource',
      isActive: false
    })
    prisma.link.create.mockResolvedValue({
      id: 7,
      title: 'My Link',
      url: 'https://example.com',
      description: 'A useful resource',
      isActive: false,
      order: 0,
      createdAt,
      userId: 99
    })

    const result = await handler(event)

    expect(requireAuthMock).toHaveBeenCalledWith(event)
    expect(readBodyMock).toHaveBeenCalledWith(event)
    expect(prisma.link.create).toHaveBeenCalledWith({
      data: {
        title: 'My Link',
        url: 'https://example.com',
        description: 'A useful resource',
        isActive: false,
        order: 0,
        userId: 99
      }
    })
    expect(event.node.res.statusCode).toBe(201)
    expect(result).toEqual({
      id: 7,
      title: 'My Link',
      url: 'https://example.com',
      description: 'A useful resource',
      isActive: false,
      order: 0,
      createdAt
    })
    expect(logger.error).not.toHaveBeenCalled()
    expect(createErrorMock).not.toHaveBeenCalled()
  })

  it('returns a validation error when title or url is missing', async () => {
    const { handler, prisma, logger } = await importLinksPostHandler()
    const event = createEvent()

    requireAuthMock.mockReturnValue({ userId: 7 })
    readBodyMock.mockResolvedValue({
      description: 'Missing mandatory fields'
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Titel und URL sind erforderlich'
    })

    expect(prisma.link.create).not.toHaveBeenCalled()
    expect(createErrorMock).toHaveBeenNthCalledWith(1, {
      statusCode: 400,
      statusMessage: 'Titel und URL sind erforderlich'
    })
    expect(logger.error).toHaveBeenCalledWith('Error creating link', {
      error: 'Titel und URL sind erforderlich'
    })
  })

  it('propagates prisma errors when creation fails', async () => {
    const { handler, prisma, logger } = await importLinksPostHandler()
    const event = createEvent()
    const prismaError = new Error('Database failure')

    requireAuthMock.mockReturnValue({ userId: 13 })
    readBodyMock.mockResolvedValue({
      title: 'Broken',
      url: 'https://broken.example',
      description: 'Fails on DB',
      isActive: true,
      order: 5
    })
    prisma.link.create.mockRejectedValue(prismaError)

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Fehler beim Erstellen des Links'
    })

    expect(prisma.link.create).toHaveBeenCalledWith({
      data: {
        title: 'Broken',
        url: 'https://broken.example',
        description: 'Fails on DB',
        isActive: true,
        order: 5,
        userId: 13
      }
    })
    expect(logger.error).toHaveBeenCalledWith('Error creating link', {
      error: 'Database failure'
    })
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 500,
      statusMessage: 'Fehler beim Erstellen des Links'
    })
  })

  it('rejects unauthenticated requests', async () => {
    const { handler, prisma, logger } = await importLinksPostHandler()
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

    expect(requireAuthMock).toHaveBeenCalledWith(event)
    expect(readBodyMock).not.toHaveBeenCalled()
    expect(prisma.link.create).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith('Error creating link', {
      error: 'Authorization token required'
    })
    expect(createErrorMock).toHaveBeenNthCalledWith(1, {
      statusCode: 401,
      statusMessage: 'Authorization token required'
    })
  })
})
