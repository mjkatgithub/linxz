import { createError } from 'h3'
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
    const maybeError = error as { statusCode?: number }
    const statusCode = typeof maybeError?.statusCode === 'number' ? maybeError.statusCode : undefined
    const message = error instanceof Error ? error.message : String(error)

    if (statusCode && statusCode >= 400 && statusCode < 500) {
      log.warning('Client error while fetching user links', {
        statusCode,
        error: message
      })
      throw error
    }

    log.error('Error fetching user links', { error: message })

    if (statusCode && statusCode >= 500) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Abrufen der Links'
    })
  }
})
