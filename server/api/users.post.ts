import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // Prüfe ob User bereits existiert
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

    // Erstelle neuen User (Passwort sollte hier gehashed werden!)
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password, // TODO: Hash das Passwort!
        name
      }
    })

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name
    }
  } catch (error) {
    console.error('Error creating user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Erstellen des Users'
    })
  }
}) 