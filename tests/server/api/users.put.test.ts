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

const hashPasswordMock = vi.fn()
const verifyPasswordMock = vi.fn()
vi.mock('~/lib/password', () => ({
  hashPassword: hashPasswordMock,
  verifyPassword: verifyPasswordMock
}))

type PrismaMock = {
  user: {
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
}

let prismaMock: PrismaMock
vi.mock('~/lib/prisma', () => {
  prismaMock = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
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
    req: {},
    res: { statusCode: 200 }
  },
  ...overrides
})

let originalDefineEventHandler: any

const importUsersHandler = async () => {
  vi.resetModules()

  const module = await import('~/server/api/users.put.ts')
  const handler = module.default as (event: any) => Promise<any>

  return {
    handler,
    prisma: prismaMock,
    logger: loggerMock
  }
}

beforeAll(() => {
  originalDefineEventHandler = (globalThis as any).defineEventHandler
  ;(globalThis as any).defineEventHandler = (handler: any) => handler
})

afterAll(() => {
  ;(globalThis as any).defineEventHandler = originalDefineEventHandler
})

beforeEach(() => {
  vi.clearAllMocks()
  createErrorMock.mockClear()
  readBodyMock.mockReset()
  requireAuthMock.mockReset()
  hashPasswordMock.mockReset()
  verifyPasswordMock.mockReset()
})

describe('PUT /api/users', () => {
  it('updates profile without password change', async () => {
    requireAuthMock.mockReturnValue({
      userId: 'user-123',
      username: 'old-user'
    })

    readBodyMock.mockResolvedValue({
      username: 'new-user',
      name: 'New Name',
      bio: 'Updated bio',
      avatar: 'https://example.com/avatar.png'
    })

    const { handler, prisma } = await importUsersHandler()
    const event = createEvent()

    const updatedUser = {
      id: 'user-123',
      username: 'new-user',
      email: 'demo@example.com',
      name: 'New Name',
      bio: 'Updated bio',
      avatar: 'https://example.com/avatar.png',
      createdAt: new Date('2024-01-01T00:00:00Z')
    }

    prisma.user.findUnique.mockResolvedValueOnce(null)
    prisma.user.update.mockResolvedValueOnce(updatedUser)

    const result = await handler(event)

    expect(result).toEqual(updatedUser)
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: 'new-user' }
    })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: {
        username: 'new-user',
        name: 'New Name',
        bio: 'Updated bio',
        avatar: 'https://example.com/avatar.png'
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true
      }
    })
    expect(hashPasswordMock).not.toHaveBeenCalled()
    expect(verifyPasswordMock).not.toHaveBeenCalled()
  })

  it('updates password when current password is valid', async () => {
    requireAuthMock.mockReturnValue({
      userId: 'user-456',
      username: 'demo-user'
    })

    readBodyMock.mockResolvedValue({
      currentPassword: 'old-secret',
      newPassword: 'new-secret'
    })

    const { handler, prisma } = await importUsersHandler()
    const event = createEvent()

    prisma.user.findUnique.mockResolvedValueOnce({
      password: 'hashed-old-secret'
    })
    verifyPasswordMock.mockResolvedValueOnce(true)
    hashPasswordMock.mockResolvedValueOnce('hashed-new-secret')

    const updatedUser = {
      id: 'user-456',
      username: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User',
      bio: 'About me',
      avatar: 'https://example.com/avatar.png',
      createdAt: new Date('2024-02-02T00:00:00Z')
    }
    prisma.user.update.mockResolvedValueOnce(updatedUser)

    const result = await handler(event)

    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-456' },
      select: { password: true }
    })
    expect(verifyPasswordMock).toHaveBeenCalledWith('old-secret', 'hashed-old-secret')
    expect(hashPasswordMock).toHaveBeenCalledWith('new-secret')
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-456' },
      data: {
        password: 'hashed-new-secret'
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true
      }
    })
    expect(result).toEqual(updatedUser)
  })

  it('rejects username change when the desired username is taken', async () => {
    requireAuthMock.mockReturnValue({
      userId: 'user-900',
      username: 'current-user'
    })

    readBodyMock.mockResolvedValue({
      username: 'existing-user'
    })

    const { handler, prisma } = await importUsersHandler()
    const event = createEvent()

    prisma.user.findUnique.mockResolvedValueOnce({ id: 'other-user' })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: 'Username bereits vergeben'
    })

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: 'existing-user' }
    })
    expect(prisma.user.update).not.toHaveBeenCalled()
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 409,
      statusMessage: 'Username bereits vergeben'
    })
  })

  it('throws when current password is incorrect', async () => {
    requireAuthMock.mockReturnValue({
      userId: 'user-789',
      username: 'demo-user'
    })

    readBodyMock.mockResolvedValue({
      currentPassword: 'wrong-secret',
      newPassword: 'new-secret'
    })

    const { handler, prisma } = await importUsersHandler()
    const event = createEvent()

    prisma.user.findUnique.mockResolvedValueOnce({
      password: 'hashed-correct'
    })
    verifyPasswordMock.mockResolvedValueOnce(false)

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Aktuelles Passwort ist falsch'
    })

    expect(prisma.user.update).not.toHaveBeenCalled()
    expect(hashPasswordMock).not.toHaveBeenCalled()
    expect(createErrorMock).toHaveBeenCalledTimes(1)
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 401,
      statusMessage: 'Aktuelles Passwort ist falsch'
    })
  })

  it('returns 404 when user lookup during password change fails', async () => {
    requireAuthMock.mockReturnValue({
      userId: 'user-901',
      username: 'demo-user'
    })

    readBodyMock.mockResolvedValue({
      currentPassword: 'current-secret',
      newPassword: 'new-secret'
    })

    const { handler, prisma } = await importUsersHandler()
    const event = createEvent()

    prisma.user.findUnique.mockResolvedValueOnce(null)

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'User nicht gefunden'
    })

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-901' },
      select: { password: true }
    })
    expect(prisma.user.update).not.toHaveBeenCalled()
    expect(verifyPasswordMock).not.toHaveBeenCalled()
    expect(hashPasswordMock).not.toHaveBeenCalled()
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 404,
      statusMessage: 'User nicht gefunden'
    })
  })

  it('throws when new password is provided without the current password', async () => {
    requireAuthMock.mockReturnValue({
      userId: 'user-321',
      username: 'demo-user'
    })

    readBodyMock.mockResolvedValue({
      newPassword: 'new-secret'
    })

    const { handler, prisma } = await importUsersHandler()
    const event = createEvent()

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Aktuelles Passwort ist erforderlich'
    })

    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(prisma.user.update).not.toHaveBeenCalled()
    expect(verifyPasswordMock).not.toHaveBeenCalled()
    expect(hashPasswordMock).not.toHaveBeenCalled()
    expect(createErrorMock).toHaveBeenCalledTimes(1)
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: 'Aktuelles Passwort ist erforderlich'
    })
  })

  it('wraps prisma update errors in 500', async () => {
    requireAuthMock.mockReturnValue({
      userId: 'user-654',
      username: 'demo-user'
    })

    readBodyMock.mockResolvedValue({
      name: 'Broken User'
    })

    const { handler, prisma } = await importUsersHandler()
    const event = createEvent()

    prisma.user.update.mockRejectedValueOnce(new Error('Database failure'))

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Fehler beim Aktualisieren des Users'
    })

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-654' },
      data: {
        name: 'Broken User'
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true
      }
    })
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 500,
      statusMessage: 'Fehler beim Aktualisieren des Users'
    })
  })

  it('requires authentication', async () => {
    requireAuthMock.mockImplementation(() => {
      const error = createErrorMock({
        statusCode: 401,
        statusMessage: 'Nicht authentifiziert'
      })
      throw error
    })

    const { handler, prisma } = await importUsersHandler()
    const event = createEvent()

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Nicht authentifiziert'
    })

    expect(createErrorMock).toHaveBeenCalledTimes(1)
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 401,
      statusMessage: 'Nicht authentifiziert'
    })
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})
