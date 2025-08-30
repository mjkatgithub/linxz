import prisma from '~/lib/prisma'
import { verifyPassword } from '~/lib/password'
import { generateToken } from '~/lib/jwt'

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
      throw createError({
        statusCode: 401,
        statusMessage: 'Ungültige Anmeldedaten'
      })
    }

    // Prüfe Passwort
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
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

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      token
    }
  } catch (error) {
    console.error('Login error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Anmelden'
    })
  }
})
