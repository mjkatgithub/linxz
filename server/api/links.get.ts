import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
      throw createError({
        statusCode: 404,
        statusMessage: 'User nicht gefunden'
      })
    }

    return user
  } catch (error) {
    console.error('Error fetching user links:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Abrufen der Links'
    })
  }
}) 