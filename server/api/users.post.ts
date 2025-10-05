import prisma from '~/lib/prisma'
import { hashPassword } from '~/lib/password'
import { generateToken } from '~/lib/jwt'
import { createLogger } from '~/lib/logger'

const log = createLogger('user')

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, username, password, name } = body

    // Validierung
    if (!email || !username || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, Username und Passwort sind erforderlich'
      })
    }

    // PrOfe ob User bereits existiert
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })

    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'User mit dieser Email oder diesem Username existiert bereits'
      })
    }

    // Hash das Passwort
    const hashedPassword = await hashPassword(password)

    // Kein Default Avatar - verwende null
    const defaultAvatar = null

    // Erstelle neuen User
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
        avatar: defaultAvatar
      }
    })

    // Generiere JWT Token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    })

    // Logge erfolgreiche Registrierung
    log.info('User registration successful', {
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
    log.error('Database error', {
      operation: 'user_create',
      error: (error as Error).message,
      stack: (error as Error).stack
    })

    const statusCode = (error as { statusCode?: number })?.statusCode
    if (typeof statusCode === 'number') {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Erstellen des Users'
    })
  }
}) 
