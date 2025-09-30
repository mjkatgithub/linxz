import prisma from '~/lib/prisma'
import { requireAuth } from '~/lib/auth'
import { createLogger } from '~/lib/logger'
import { getRouterParam, createError } from 'h3'

const log = createLogger('api')

export default defineEventHandler(async (event) => {
  try {
    const user = requireAuth(event)

    const idParam = getRouterParam(event, 'id')
    if (!idParam) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing route param id'
      })
    }

    const linkId = Number.parseInt(idParam, 10)
    if (Number.isNaN(linkId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing route param id'
      })
    }

    const existingLink = await prisma.link.findFirst({
      where: {
        id: linkId,
        userId: user.userId
      }
    })

    if (!existingLink) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Link nicht gefunden'
      })
    }

    const deletedLink = await prisma.link.delete({
      where: { id: linkId }
    })

    return {
      id: deletedLink.id,
      title: deletedLink.title,
      url: deletedLink.url,
      description: deletedLink.description,
      isActive: deletedLink.isActive,
      order: deletedLink.order,
      createdAt: deletedLink.createdAt
    }
  } catch (error) {
    log.error('Error deleting link', { error: (error as Error).message })

    const typedError = error as { statusCode?: number }
    if (typeof typedError?.statusCode === 'number') {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Löschen des Links'
    })
  }
})
