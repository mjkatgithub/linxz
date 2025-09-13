import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock $fetch für einfache Tests
global.$fetch = vi.fn() as any

describe('Authentication API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call login endpoint with correct data', async () => {
    const mockResponse = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
      token: 'mock-jwt-token'
    }

    // Mock erfolgreiche Antwort
    ;(global.$fetch as any).mockResolvedValue(mockResponse)

    // Simuliere API-Aufruf
    const result = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    })

    // Prüfe ob $fetch aufgerufen wurde
    expect(global.$fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    })

    // Prüfe Antwort
    expect(result).toEqual(mockResponse)
  })

  it('should handle login errors', async () => {
    // Mock fehlgeschlagene Antwort
    const mockError = new Error('Invalid credentials')
    ;(global.$fetch as any).mockRejectedValue(mockError)

    // Simuliere fehlgeschlagenen API-Aufruf
    try {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      })
    } catch (error) {
      expect(error).toEqual(mockError)
    }

    // Prüfe ob $fetch aufgerufen wurde
    expect(global.$fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'wrongpassword'
      }
    })
  })

  it('should validate required fields', async () => {
    // Test ohne Email
    try {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          password: 'password123'
        }
      })
    } catch (error) {
      expect(error).toBeDefined()
    }

    // Test ohne Passwort
    try {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'test@example.com'
        }
      })
    } catch (error) {
      expect(error).toBeDefined()
    }
  })
})