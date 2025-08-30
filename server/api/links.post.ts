import prisma from '~/lib/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { title, url, description, isActive = true, order, userId } = body

    // Validierung
    if (!title || !url || !userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Titel, URL und User-ID sind erforderlich'
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
        userId: parseInt(userId)
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
