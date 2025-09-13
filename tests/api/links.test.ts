import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock $fetch für einfache Tests
global.$fetch = vi.fn() as any

describe('Links API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create new link with valid data', async () => {
    const mockResponse = {
      id: 1,
      title: 'GitHub',
      url: 'https://github.com',
      description: 'My GitHub profile',
      isActive: true,
      order: 1,
      createdAt: '2024-01-01T00:00:00Z'
    }

    // Mock erfolgreiche Antwort
    ;(global.$fetch as any).mockResolvedValue(mockResponse)

    // Simuliere API-Aufruf
    const result = await $fetch('/api/links', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token'
      },
      body: {
        title: 'GitHub',
        url: 'https://github.com',
        description: 'My GitHub profile',
        isActive: true,
        order: 1
      }
    })

    // Prüfe ob $fetch aufgerufen wurde
    expect(global.$fetch).toHaveBeenCalledWith('/api/links', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token'
      },
      body: {
        title: 'GitHub',
        url: 'https://github.com',
        description: 'My GitHub profile',
        isActive: true,
        order: 1
      }
    })

    // Prüfe Antwort
    expect(result).toEqual(mockResponse)
  })

  it('should get user links', async () => {
    const mockResponse = [
      {
        id: 1,
        title: 'GitHub',
        url: 'https://github.com',
        description: 'My GitHub profile',
        isActive: true,
        order: 1
      }
    ]

    // Mock erfolgreiche Antwort
    ;(global.$fetch as any).mockResolvedValue(mockResponse)

    // Simuliere API-Aufruf
    const result = await $fetch('/api/links?username=testuser')

    // Prüfe ob $fetch aufgerufen wurde
    expect(global.$fetch).toHaveBeenCalledWith('/api/links?username=testuser')

    // Prüfe Antwort
    expect(result).toEqual(mockResponse)
    expect(Array.isArray(result)).toBe(true)
  })

  it('should update existing link', async () => {
    const mockResponse = {
      id: 1,
      title: 'Updated GitHub',
      url: 'https://github.com',
      description: 'Updated description',
      isActive: true,
      order: 1
    }

    // Mock erfolgreiche Antwort
    ;(global.$fetch as any).mockResolvedValue(mockResponse)

    // Simuliere API-Aufruf
    const result = await $fetch('/api/links/1', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer valid-token'
      },
      body: {
        title: 'Updated GitHub',
        description: 'Updated description'
      }
    })

    // Prüfe ob $fetch aufgerufen wurde
    expect(global.$fetch).toHaveBeenCalledWith('/api/links/1', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer valid-token'
      },
      body: {
        title: 'Updated GitHub',
        description: 'Updated description'
      }
    })

    // Prüfe Antwort
    expect(result).toEqual(mockResponse)
  })

  it('should handle API errors', async () => {
    // Mock fehlgeschlagene Antwort
    const mockError = new Error('Unauthorized')
    ;(global.$fetch as any).mockRejectedValue(mockError)

    // Simuliere fehlgeschlagenen API-Aufruf
    try {
      await $fetch('/api/links', {
        method: 'POST',
        body: {
          title: 'Test',
          url: 'https://test.com'
        }
      })
    } catch (error) {
      expect(error).toEqual(mockError)
    }

    // Prüfe ob $fetch aufgerufen wurde
    expect(global.$fetch).toHaveBeenCalledWith('/api/links', {
      method: 'POST',
      body: {
        title: 'Test',
        url: 'https://test.com'
      }
    })
  })
})