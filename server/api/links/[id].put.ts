import prisma from '~/lib/prisma'
import { requireAuth } from '~/lib/auth'

export default defineEventHandler(async (event) => {
  try {
    // Authentifizierung erforderlich
    const user = requireAuth(event)
    
    const linkId = parseInt(getRouterParam(event, 'id'))
    const body = await readBody(event)
    const { title, url, description, isActive, order } = body

    // Prüfe ob Link existiert und dem User gehört
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

    // Update Link
    const updatedLink = await prisma.link.update({
      where: { id: linkId },
      data: {
        ...(title && { title }),
        ...(url && { url }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order })
      }
    })

    return {
      id: updatedLink.id,
      title: updatedLink.title,
      url: updatedLink.url,
      description: updatedLink.description,
      isActive: updatedLink.isActive,
      order: updatedLink.order,
      createdAt: updatedLink.createdAt
    }
  } catch (error) {
    console.error('Error updating link:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Aktualisieren des Links'
    })
  }
})
