import prisma from '~/lib/prisma'
import { requireAuth } from '~/lib/auth'
import { createLogger } from '~/lib/logger'

const log = createLogger('api')

export default defineEventHandler(async (event) => {
  try {
    // Authentifizierung erforderlich
    const user = requireAuth(event)
    
    // Hole alle Links des Users (auch inaktive)
    const links = await prisma.link.findMany({
      where: { userId: user.userId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        url: true,
        description: true,
        icon: true,
        order: true,
        isActive: true,
        createdAt: true
      }
    })

    return { links }
  } catch (error) {
    log.error('Error fetching user links', { error: (error as Error).message })
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Abrufen der Links'
    })
  }
})
