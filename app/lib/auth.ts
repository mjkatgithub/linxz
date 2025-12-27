import { verifyToken, extractTokenFromHeader } from './jwt'
import type { JWTPayload } from './jwt'
import { getHeader, createError } from 'h3'
import type { H3Event } from 'h3'

export function requireAuth(event: H3Event): JWTPayload {
  const authHeader = getHeader(event, 'authorization')
  const token = extractTokenFromHeader(authHeader)
  
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authorization token required'
    })
  }
  
  const payload = verifyToken(token)
  if (!payload) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired token'
    })
  }
  
  // Speichere User-Info im Event-Context
  event.context.user = payload
  
  return payload
}

export function optionalAuth(event: H3Event): JWTPayload | null {
  try {
    return requireAuth(event)
  } catch {
    return null
  }
}
