import prisma from '~/lib/prisma'
import { requireAuth } from '~/lib/auth'
import { createLogger } from '~/lib/logger'
import { readBody, createError } from 'h3'
import { hashPassword, verifyPassword } from '~/lib/password'

const log = createLogger('api')

export default defineEventHandler(async (event) => {
  try {
    // Authentifizierung erforderlich
    const user = requireAuth(event)
    
    const body = await readBody(event)
    const { username, name, bio, avatar, currentPassword, newPassword } = body

    // Prüfe ob Username bereits existiert (falls geändert)
    if (username && username !== user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username }
      })
      
      if (existingUser) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Username bereits vergeben'
        })
      }
    }

    // Prüfe aktuelles Passwort (falls Passwort geändert werden soll)
    let hashedNewPassword = undefined
    if (newPassword) {
      if (!currentPassword) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Aktuelles Passwort ist erforderlich'
        })
      }
      
      // Hole aktuelles Passwort aus DB
      const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { password: true }
      })
      
      if (!currentUser) {
        throw createError({
          statusCode: 404,
          statusMessage: 'User nicht gefunden'
        })
      }
      
      // Prüfe aktuelles Passwort
      const isValidPassword = await verifyPassword(currentPassword, currentUser.password)
      
      if (!isValidPassword) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Aktuelles Passwort ist falsch'
        })
      }
      
      // Hash neues Passwort
      hashedNewPassword = await hashPassword(newPassword)
    }

    // Update User
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: {
        ...(username && { username }),
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatar && { avatar }),
        ...(hashedNewPassword && { password: hashedNewPassword })
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true
      }
    })

    return updatedUser
  } catch (error) {
    log.error('Error updating user', { error: (error as Error).message })

    const statusCode = (error as { statusCode?: number }).statusCode
    if (typeof statusCode === 'number') {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Aktualisieren des Users'
    })
  }
})
