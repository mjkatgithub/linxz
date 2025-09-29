import prisma from '~/lib/prisma'
import { verifyPassword } from '~/lib/password'
import { generateToken } from '~/lib/jwt'
import { createLogger } from '~/lib/logger'

const log = createLogger('auth')

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password } = body

    // Validierung
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email und Passwort sind erforderlich'
      })
    }

    // Finde User
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      log.warning('Login attempt with non-existent user', {
        email,
        userAgent: getHeader(event, 'user-agent')
      })
      throw createError({
        statusCode: 401,
        statusMessage: 'Ungültige Anmeldedaten'
      })
    }

    // Prüfe Passwort
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      log.warning('Login attempt with invalid password', {
        userId: user.id,
        username: user.username,
        email,
        userAgent: getHeader(event, 'user-agent')
      })
      throw createError({
        statusCode: 401,
        statusMessage: 'Ungültige Anmeldedaten'
      })
    }

    // Generiere JWT Token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    })

    // Logge erfolgreichen Login
    log.info('User login successful', {
      userId: user.id,
      username: user.username,
      email: user.email
    })

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      token
    }
  } catch (error) {
    log.error('API error', {
      endpoint: '/api/auth/login',
      method: 'POST',
      error: (error as Error).message,
      stack: (error as Error).stack
    })

    const typedError = error as { statusCode?: number }
    if (typeof typedError?.statusCode === 'number') {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Anmelden'
    })
  }
})
