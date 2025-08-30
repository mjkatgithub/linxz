import { verifyToken, extractTokenFromHeader } from './jwt'
import type { JWTPayload } from './jwt'

export interface AuthenticatedEvent extends any {
  context: {
    user: JWTPayload
  }
}

export function requireAuth(event: any): JWTPayload {
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

export function optionalAuth(event: any): JWTPayload | null {
  try {
    return requireAuth(event)
  } catch {
    return null
  }
}
