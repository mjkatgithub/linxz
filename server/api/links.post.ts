import prisma from '~/lib/prisma'
import { requireAuth } from '~/lib/auth'

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
        order: order || 0,
        userId: user.userId
      }
    })

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
    console.error('Error creating link:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Erstellen des Links'
    })
  }
})
