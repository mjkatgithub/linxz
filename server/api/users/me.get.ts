import prisma from '~/lib/prisma'
import { requireAuth } from '~/lib/auth'
import { createLogger } from '~/lib/logger'

const log = createLogger('api')

export default defineEventHandler(async (event) => {
  try {
    // Authentifizierung erforderlich
    const user = requireAuth(event)
    
    // Hole User-Daten
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!userData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User nicht gefunden'
      })
    }

    return userData
  } catch (error) {
    log.error('Error fetching user profile', { error: (error as Error).message })

    const statusCode = (error as { statusCode?: number }).statusCode
    if (typeof statusCode === 'number') {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Abrufen des User-Profils'
    })
  }
})
