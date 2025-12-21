import prisma from '~/lib/prisma'
import { createLogger } from '~/lib/logger'

const log = createLogger('api')

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { username } = query

    if (!username) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username ist erforderlich'
      })
    }

    // Finde User und seine aktiven Links
    const user = await prisma.user.findUnique({
      where: { username: username as string },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        email: true,
        useGravatar: true,
        links: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            url: true,
            description: true,
            icon: true,
            order: true
          }
        }
      }
    })

    if (!user) {
      // Logge User nicht gefunden (nicht als Error)
      log.notice('User not found', {
        username: username as string
      })
      throw createError({
        statusCode: 404,
        statusMessage: 'User nicht gefunden'
      })
    }

    return user
  } catch (error) {
    // Nur echte Fehler loggen (nicht 404)
    if ((error as { statusCode?: number }).statusCode !== 404) {
      log.error('API error', {
        endpoint: '/api/links',
        method: 'GET',
        error: (error as Error).message,
        stack: (error as Error).stack
      })
    }
    throw error
  }
}) 