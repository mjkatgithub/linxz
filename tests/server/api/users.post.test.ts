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

const hashPasswordMock = vi.fn()
vi.mock('~/lib/password', () => ({
  hashPassword: hashPasswordMock
}))

const generateTokenMock = vi.fn()
vi.mock('~/lib/jwt', () => ({
  generateToken: generateTokenMock
}))

type PrismaMock = {
  user: {
    findFirst: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
}

const prismaMock: PrismaMock = {
  user: {
    findFirst: vi.fn(),
    create: vi.fn()
  }
}

vi.mock('~/lib/prisma', () => ({
  __esModule: true,
  default: prismaMock
}))

type LoggerMock = {
  info: ReturnType<typeof vi.fn>
  error: ReturnType<typeof vi.fn>
  warning: ReturnType<typeof vi.fn>
  debug: ReturnType<typeof vi.fn>
}

const loggerMock: LoggerMock = {
  info: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  debug: vi.fn()
}

const createLoggerMock = vi.fn(() => loggerMock)

vi.mock('~/lib/logger', () => ({
  createLogger: createLoggerMock,
  default: loggerMock
}))

const createEvent = (overrides: Record<string, unknown> = {}) => ({
  context: {},
  node: {
    req: {},
    res: { statusCode: 200 }
  },
  ...overrides
})

let originalDefineEventHandler: any
let originalCreateError: any
let originalReadBody: any

const importUsersHandler = async () => {
  vi.resetModules()

  const prismaModule = await import('~/lib/prisma')
  const passwordModule = await import('~/lib/password')
  const jwtModule = await import('~/lib/jwt')
  const loggerModule = await import('~/lib/logger')
  const module = await import('~~/server/api/users.post.ts')

  const prisma = prismaModule.default as unknown as PrismaMock
  const hashPassword = passwordModule.hashPassword as typeof hashPasswordMock
  const generateToken = jwtModule.generateToken as typeof generateTokenMock
  const loggerFactory = loggerModule.createLogger as unknown as { mock: { results: Array<{ value: LoggerMock }> } }
  const loggerResult = loggerFactory.mock.results[loggerFactory.mock.results.length - 1]
  const logger = (loggerResult?.value ?? loggerModule.default) as LoggerMock
  const handler = module.default as (event: any) => Promise<any>

  return { handler, prisma, hashPassword, generateToken, logger }
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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/users', () => {
  it('creates a new user and returns a token', async () => {
    const { handler, prisma, hashPassword, generateToken, logger } = await importUsersHandler()
    const event = createEvent()
    const input = {
      email: 'demo@example.com',
      username: 'demo-user',
      password: 'plain-secret',
      name: 'Demo User'
    }
    const hashedPassword = 'hashed-secret'
    const createdUser = {
      id: 21,
      email: input.email,
      username: input.username,
      password: hashedPassword,
      name: input.name,
      avatar: null
    }

    readBodyMock.mockResolvedValue(input)
    prisma.user.findFirst.mockResolvedValue(null)
    hashPassword.mockResolvedValue(hashedPassword)
    prisma.user.create.mockResolvedValue(createdUser as any)
    generateToken.mockReturnValue('jwt-token')

    const result = await handler(event)

    expect(readBodyMock).toHaveBeenCalledWith(event)
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: input.email },
          { username: input.username }
        ]
      }
    })
    expect(hashPassword).toHaveBeenCalledWith(input.password)
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: input.email,
        username: input.username,
        password: hashedPassword,
        name: input.name,
        avatar: null
      }
    })
    expect(generateToken).toHaveBeenCalledWith({
      userId: createdUser.id,
      username: createdUser.username,
      email: createdUser.email
    })
    expect(result).toEqual({
      id: createdUser.id,
      email: createdUser.email,
      username: createdUser.username,
      name: createdUser.name,
      token: 'jwt-token'
    })
    expect(logger.info).toHaveBeenCalledWith('User registration successful', {
      userId: createdUser.id,
      username: createdUser.username,
      email: createdUser.email
    })
    expect(logger.error).not.toHaveBeenCalled()
    expect(createErrorMock).not.toHaveBeenCalled()
  })

  it('returns validation error when required fields are missing', async () => {
    const { handler, prisma, hashPassword, generateToken, logger } = await importUsersHandler()
    const event = createEvent()

    readBodyMock.mockResolvedValue({ name: 'Only name provided' })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Email, Username und Passwort sind erforderlich'
    })

    expect(prisma.user.findFirst).not.toHaveBeenCalled()
    expect(prisma.user.create).not.toHaveBeenCalled()
    expect(hashPassword).not.toHaveBeenCalled()
    expect(generateToken).not.toHaveBeenCalled()

    expect(createErrorMock).toHaveBeenCalledTimes(1)
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: 'Email, Username und Passwort sind erforderlich'
    })
    expect(logger.error).toHaveBeenCalledWith('Database error', expect.objectContaining({
      operation: 'user_create',
      error: 'Email, Username und Passwort sind erforderlich'
    }))
    expect(logger.info).not.toHaveBeenCalled()
  })

  it('returns conflict error when user already exists', async () => {
    const { handler, prisma, hashPassword, generateToken, logger } = await importUsersHandler()
    const event = createEvent()
    const input = {
      email: 'duplicate@example.com',
      username: 'duplicate-user',
      password: 'already-there',
      name: 'Existing User'
    }

    readBodyMock.mockResolvedValue(input)
    prisma.user.findFirst.mockResolvedValue({ id: 55 } as any)

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: 'User mit dieser Email oder diesem Username existiert bereits'
    })

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: input.email },
          { username: input.username }
        ]
      }
    })
    expect(prisma.user.create).not.toHaveBeenCalled()
    expect(hashPassword).not.toHaveBeenCalled()
    expect(generateToken).not.toHaveBeenCalled()

    expect(createErrorMock).toHaveBeenCalledTimes(1)
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 409,
      statusMessage: 'User mit dieser Email oder diesem Username existiert bereits'
    })
    expect(logger.error).toHaveBeenCalledWith('Database error', expect.objectContaining({
      operation: 'user_create',
      error: 'User mit dieser Email oder diesem Username existiert bereits'
    }))
    expect(logger.info).not.toHaveBeenCalled()
  })

  it('wraps unexpected prisma errors in 500', async () => {
    const { handler, prisma, hashPassword, generateToken, logger } = await importUsersHandler()
    const event = createEvent()
    const input = {
      email: 'broken@example.com',
      username: 'broken-user',
      password: 'broken-secret',
      name: 'Broken User'
    }

    readBodyMock.mockResolvedValue(input)
    prisma.user.findFirst.mockResolvedValue(null)
    hashPassword.mockResolvedValue('hashed-broken')
    prisma.user.create.mockRejectedValue(new Error('Database failure'))

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Fehler beim Erstellen des Users'
    })

    expect(prisma.user.findFirst).toHaveBeenCalled()
    expect(hashPassword).toHaveBeenCalledWith(input.password)
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: input.email,
        username: input.username,
        password: 'hashed-broken',
        name: input.name,
        avatar: null
      }
    })
    expect(generateToken).not.toHaveBeenCalled()
    expect(createErrorMock).toHaveBeenCalledTimes(1)
    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 500,
      statusMessage: 'Fehler beim Erstellen des Users'
    })
    expect(logger.error).toHaveBeenCalledWith('Database error', expect.objectContaining({
      operation: 'user_create',
      error: 'Database failure'
    }))
    expect(logger.info).not.toHaveBeenCalled()
  })
})

