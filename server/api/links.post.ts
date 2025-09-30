import prisma from '~/lib/prisma'
import { requireAuth } from '~/lib/auth'
import { createLogger } from '~/lib/logger'

const log = createLogger('api')

export default defineEventHandler(async (event) => {
  try {
    // Authentifizierung erforderlich
    const user = requireAuth(event)
    
    const body = await readBody(event)
    const { title, url, description, isActive = true, order } = body

    // Validierung
    if (!title || !url) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Titel und URL sind erforderlich'
      })
    }

    // Erstelle neuen Link
    const link = await prisma.link.create({
      data: {
        title,
        url,
        description,
        isActive,
        order: typeof order === 'number' ? order : 0,
        userId: user.userId
      }
    })

    if (event.node?.res) {
      event.node.res.statusCode = 201
    }

    return {
      id: link.id,
      title: link.title,
      url: link.url,
      description: link.description,
      isActive: link.isActive,
      order: link.order,
      createdAt: link.createdAt
    }
  } catch (error) {
    const message = (error as Error).message

    log.error('Error creating link', { error: message })

    const typedError = error as { statusCode?: number }
    if (typeof typedError?.statusCode === 'number') {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Erstellen des Links'
    })
  }
})

