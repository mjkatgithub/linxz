import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'

const readBodyMock = vi.fn()
const getHeaderMock = vi.fn()
const createErrorMock = vi.fn((params: any = {}) => {
  const error = new Error(params.statusMessage || 'Error')
  return Object.assign(error, params)
})

vi.mock('h3', () => ({
  readBody: readBodyMock,
  getHeader: getHeaderMock,
  createError: createErrorMock
}))

const createEvent = (overrides: Record<string, unknown> = {}) => ({
  context: {},
  node: { req: {} },
  ...overrides
})

let originalDefineEventHandler: any
let originalCreateError: any
let originalReadBody: any
let originalGetHeader: any

type MockFn = ReturnType<typeof vi.fn>

const importLoginHandler = async () => {
  vi.resetModules()

  const prismaModule = await import('~/lib/prisma')
  const jwtModule = await import('~/lib/jwt')
  const passwordModule = await import('~/lib/password')
  const loggerModule = await import('~/lib/logger')

  const prisma = prismaModule.default as unknown as {
    user: { findUnique: MockFn }
  }

  const generateTokenMock = jwtModule.generateToken as unknown as MockFn
  const verifyPasswordMock = (passwordModule as any).verifyPassword as MockFn
  const loggerMock = loggerModule.default as Record<string, MockFn>

  const module = await import('~/server/api/auth/login.post')
  const handler = module.default as (event: any) => Promise<any>

  return { handler, prisma, generateTokenMock, verifyPasswordMock, loggerMock }
}

beforeAll(() => {
  originalDefineEventHandler = (globalThis as any).defineEventHandler
  originalCreateError = (globalThis as any).createError
  originalReadBody = (globalThis as any).readBody
  originalGetHeader = (globalThis as any).getHeader
  ;(globalThis as any).defineEventHandler = (handler: any) => handler
  ;(globalThis as any).createError = createErrorMock
  ;(globalThis as any).readBody = readBodyMock
  ;(globalThis as any).getHeader = getHeaderMock
})

afterAll(() => {
  ;(globalThis as any).defineEventHandler = originalDefineEventHandler
  ;(globalThis as any).createError = originalCreateError
  ;(globalThis as any).readBody = originalReadBody
  ;(globalThis as any).getHeader = originalGetHeader
})

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('authenticates successfully with valid credentials', async () => {
    const { handler, prisma, generateTokenMock, verifyPasswordMock, loggerMock } = await importLoginHandler()

    const mockUser = {
      id: 1,
      email: 'user@example.com',
      username: 'testuser',
      name: 'Test User',
      password: 'hashed-password'
    }

    readBodyMock.mockResolvedValue({
      email: 'user@example.com',
      password: 'plain-password'
    })
    prisma.user.findUnique.mockResolvedValue(mockUser)
    verifyPasswordMock.mockResolvedValue(true)
    generateTokenMock.mockReturnValue('signed-token')

    const event = createEvent()
    const result = await handler(event)

    expect(readBodyMock).toHaveBeenCalledWith(event)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'user@example.com' } })
    expect(verifyPasswordMock).toHaveBeenCalledWith('plain-password', 'hashed-password')
    expect(generateTokenMock).toHaveBeenCalledWith({
      userId: 1,
      username: 'testuser',
      email: 'user@example.com'
    })

    expect(result).toEqual({
      id: 1,
      email: 'user@example.com',
      username: 'testuser',
      name: 'Test User',
      token: 'signed-token'
    })

    expect(loggerMock.info).toHaveBeenCalledWith('User login successful', {
      userId: 1,
      username: 'testuser',
      email: 'user@example.com'
    })
    expect(loggerMock.error).not.toHaveBeenCalled()
    expect(createErrorMock).not.toHaveBeenCalled()
  })

  it('returns 400 when credentials are missing', async () => {
    const { handler, prisma, loggerMock } = await importLoginHandler()

    readBodyMock.mockResolvedValue({})

    const event = createEvent()
    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Email und Passwort sind erforderlich'
    })

    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(loggerMock.error).toHaveBeenCalledWith('API error', expect.objectContaining({
      endpoint: '/api/auth/login',
      method: 'POST',
      error: 'Email und Passwort sind erforderlich'
    }))
    expect(createErrorMock).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      statusMessage: 'Email und Passwort sind erforderlich'
    }))
  })

  it('returns 401 when password is invalid', async () => {
    const { handler, prisma, verifyPasswordMock, loggerMock } = await importLoginHandler()

    const mockUser = {
      id: 2,
      email: 'user@example.com',
      username: 'testuser',
      name: 'Test User',
      password: 'hashed-password'
    }

    readBodyMock.mockResolvedValue({
      email: 'user@example.com',
      password: 'wrong-password'
    })
    prisma.user.findUnique.mockResolvedValue(mockUser)
    verifyPasswordMock.mockResolvedValue(false)
    getHeaderMock.mockReturnValue('Vitest UA')

    const event = createEvent()
    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 401
    })

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'user@example.com' } })
    expect(verifyPasswordMock).toHaveBeenCalledWith('wrong-password', 'hashed-password')
    expect(loggerMock.warning).toHaveBeenCalledWith('Login attempt with invalid password', {
      userId: 2,
      username: 'testuser',
      email: 'user@example.com',
      userAgent: 'Vitest UA'
    })
    expect(loggerMock.error).toHaveBeenCalledWith('API error', expect.objectContaining({
      error: expect.stringContaining('Anmeldedaten')
    }))
    expect(createErrorMock).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      statusMessage: expect.stringContaining('Anmeldedaten')
    }))
  })

  it('returns 401 when user does not exist', async () => {
    const { handler, prisma, verifyPasswordMock, generateTokenMock, loggerMock } = await importLoginHandler()

    readBodyMock.mockResolvedValue({
      email: 'ghost@example.com',
      password: 'irrelevant'
    })
    prisma.user.findUnique.mockResolvedValue(null)
    getHeaderMock.mockReturnValue('Vitest UA')

    const event = createEvent()
    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 401
    })

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'ghost@example.com' } })
    expect(verifyPasswordMock).not.toHaveBeenCalled()
    expect(generateTokenMock).not.toHaveBeenCalled()
    expect(loggerMock.warning).toHaveBeenCalledWith('Login attempt with non-existent user', {
      email: 'ghost@example.com',
      userAgent: 'Vitest UA'
    })
    expect(loggerMock.error).toHaveBeenCalledWith('API error', expect.objectContaining({
      error: expect.stringContaining('Anmeldedaten')
    }))
    expect(createErrorMock).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      statusMessage: expect.stringContaining('Anmeldedaten')
    }))
  })

  it('returns 500 when unexpected error occurs', async () => {
    const { handler, prisma, loggerMock } = await importLoginHandler()

    readBodyMock.mockRejectedValue(new Error('Unexpected failure'))

    const event = createEvent()
    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Fehler beim Anmelden'
    })

    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(loggerMock.error).toHaveBeenCalledWith('API error', expect.objectContaining({
      error: 'Unexpected failure'
    }))
    expect(createErrorMock).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 500,
      statusMessage: 'Fehler beim Anmelden'
    }))
  })
})
