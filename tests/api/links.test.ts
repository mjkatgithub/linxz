import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApiTestHelper } from '~/tests/utils/api-test-utils'

describe('Links API', () => {
  let api: ApiTestHelper

  beforeEach(() => {
    api = new ApiTestHelper()
    api.resetMocks()
  })

  describe('POST /api/links', () => {
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

      api.setAuthToken('valid-jwt-token')

      await api.testPost('/links', {
        title: 'GitHub',
        url: 'https://github.com',
        description: 'My GitHub profile',
        isActive: true,
        order: 1
      }, 200, mockResponse)

      api.verifyFetchCall(0, 'http://localhost:3000/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-jwt-token'
        },
        body: JSON.stringify({
          title: 'GitHub',
          url: 'https://github.com',
          description: 'My GitHub profile',
          isActive: true,
          order: 1
        })
      })
    })

    it('should create link with minimal data', async () => {
      const mockResponse = {
        id: 2,
        title: 'Simple Link',
        url: 'https://example.com',
        description: null,
        isActive: true,
        order: 0,
        createdAt: '2024-01-01T00:00:00Z'
      }

      api.setAuthToken('valid-jwt-token')

      await api.testPost('/links', {
        title: 'Simple Link',
        url: 'https://example.com'
      }, 200, mockResponse)

      api.verifyFetchCall(0, 'http://localhost:3000/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-jwt-token'
        }
      })
    })

    it('should reject link creation without title', async () => {
      api.setAuthToken('valid-jwt-token')

      await api.testError('/links', 'POST', 400, 'Titel und URL sind erforderlich')

      api.verifyFetchCall(0, 'http://localhost:3000/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-jwt-token'
        }
      })
    })

    it('should reject link creation without url', async () => {
      api.setAuthToken('valid-jwt-token')

      await api.testError('/links', 'POST', 400, 'Titel und URL sind erforderlich')

      api.verifyFetchCall(0, 'http://localhost:3000/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-jwt-token'
        }
      })
    })

    it('should reject link creation without authentication', async () => {
      await api.testError('/links', 'POST', 401, 'Nicht authentifiziert')

      api.verifyFetchCall(0, 'http://localhost:3000/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('should handle server errors', async () => {
      api.setAuthToken('valid-jwt-token')

      await api.testError('/links', 'POST', 500, 'Fehler beim Erstellen des Links')

      api.verifyFetchCall(0, 'http://localhost:3000/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-jwt-token'
        }
      })
    })

    it('should validate URL format', async () => {
      api.setAuthToken('valid-jwt-token')

      await api.testError('/links', 'POST', 400, 'Ungültige URL')

      api.verifyFetchCall(0, 'http://localhost:3000/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-jwt-token'
        }
      })
    })
  })

  describe('GET /api/links', () => {
    it('should get user links with valid username', async () => {
      const mockResponse = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        avatar: 'avatar.jpg',
        bio: 'Test bio',
        links: [
          {
            id: 1,
            title: 'GitHub',
            url: 'https://github.com',
            description: 'My GitHub profile',
            icon: null,
            order: 1
          },
          {
            id: 2,
            title: 'LinkedIn',
            url: 'https://linkedin.com',
            description: 'My LinkedIn profile',
            icon: null,
            order: 2
          }
        ]
      }

      await api.testGet('/links?username=testuser', 200, mockResponse)

      api.verifyFetchCall(0, 'http://localhost:3000/api/links?username=testuser', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('should return empty links for user with no links', async () => {
      const mockResponse = {
        id: 2,
        username: 'emptyuser',
        name: 'Empty User',
        avatar: null,
        bio: null,
        links: []
      }

      await api.testGet('/links?username=emptyuser', 200, mockResponse)

      api.verifyFetchCall(0, 'http://localhost:3000/api/links?username=emptyuser', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('should reject request without username', async () => {
      await api.testError('/links', 'GET', 400, 'Username ist erforderlich')

      api.verifyFetchCall(0, 'http://localhost:3000/api/links', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('should return 404 for non-existent user', async () => {
      await api.testError('/links?username=nonexistent', 'GET', 404, 'User nicht gefunden')

      api.verifyFetchCall(0, 'http://localhost:3000/api/links?username=nonexistent', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('should handle server errors', async () => {
      await api.testError('/links?username=testuser', 'GET', 500, 'Server error')

      api.verifyFetchCall(0, 'http://localhost:3000/api/links?username=testuser', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('should only return active links', async () => {
      const mockResponse = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        avatar: null,
        bio: null,
        links: [
          {
            id: 1,
            title: 'Active Link',
            url: 'https://active.com',
            description: 'This link is active',
            icon: null,
            order: 1
          }
        ]
      }

      await api.testGet('/links?username=testuser', 200, mockResponse)

      // Verifiziere dass nur aktive Links zurückgegeben werden
      expect(mockResponse.links).to.have.length(1)
      expect(mockResponse.links[0].title).to.equal('Active Link')
    })

    it('should return links in correct order', async () => {
      const mockResponse = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        avatar: null,
        bio: null,
        links: [
          {
            id: 1,
            title: 'First Link',
            url: 'https://first.com',
            description: 'First in order',
            icon: null,
            order: 1
          },
          {
            id: 2,
            title: 'Second Link',
            url: 'https://second.com',
            description: 'Second in order',
            icon: null,
            order: 2
          }
        ]
      }

      await api.testGet('/links?username=testuser', 200, mockResponse)

      // Verifiziere dass Links in korrekter Reihenfolge sind
      expect(mockResponse.links[0].order).to.equal(1)
      expect(mockResponse.links[1].order).to.equal(2)
    })
  })

  describe('PUT /api/links/[id]', () => {
    it('should update existing link', async () => {
      const mockResponse = {
        id: 1,
        title: 'Updated GitHub',
        url: 'https://github.com/updated',
        description: 'Updated description',
        isActive: true,
        order: 1,
        createdAt: '2024-01-01T00:00:00Z'
      }

      api.setAuthToken('valid-jwt-token')

      await api.testPut('/links/1', {
        title: 'Updated GitHub',
        url: 'https://github.com/updated',
        description: 'Updated description'
      }, 200, mockResponse)

      api.verifyFetchCall(0, 'http://localhost:3000/api/links/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-jwt-token'
        },
        body: JSON.stringify({
          title: 'Updated GitHub',
          url: 'https://github.com/updated',
          description: 'Updated description'
        })
      })
    })

    it('should reject update without authentication', async () => {
      await api.testError('/links/1', 'PUT', 401, 'Nicht authentifiziert')

      api.verifyFetchCall(0, 'http://localhost:3000/api/links/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('should reject update of non-existent link', async () => {
      api.setAuthToken('valid-jwt-token')

      await api.testError('/links/999', 'PUT', 404, 'Link nicht gefunden')

      api.verifyFetchCall(0, 'http://localhost:3000/api/links/999', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-jwt-token'
        }
      })
    })

    it('should reject update of other user\'s link', async () => {
      api.setAuthToken('valid-jwt-token')

      await api.testError('/links/1', 'PUT', 403, 'Keine Berechtigung')

      api.verifyFetchCall(0, 'http://localhost:3000/api/links/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-jwt-token'
        }
      })
    })
  })

  describe('GET /api/users/links', () => {
    it('should get authenticated user\'s links', async () => {
      const mockResponse = {
        links: [
          {
            id: 1,
            title: 'My GitHub',
            url: 'https://github.com/me',
            description: 'My personal GitHub',
            isActive: true,
            order: 1,
            createdAt: '2024-01-01T00:00:00Z'
          }
        ]
      }

      api.setAuthToken('valid-jwt-token')

      await api.testGet('/users/links', 200, mockResponse)

      api.verifyFetchCall(0, 'http://localhost:3000/api/users/links', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-jwt-token'
        }
      })
    })

    it('should reject request without authentication', async () => {
      await api.testError('/users/links', 'GET', 401, 'Nicht authentifiziert')

      api.verifyFetchCall(0, 'http://localhost:3000/api/users/links', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockFetch = api.mockFetch()
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      api.setAuthToken('valid-jwt-token')

      try {
        await api.testPost('/links', {
          title: 'Test Link',
          url: 'https://test.com'
        }, 200)
      } catch (error) {
        expect(error).to.be.instanceOf(Error)
        expect((error as Error).message).to.equal('Network error')
      }
    })

    it('should handle malformed JSON responses', async () => {
      const mockFetch = api.mockFetch()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
        text: () => Promise.resolve('Invalid JSON response')
      })

      api.setAuthToken('valid-jwt-token')

      try {
        await api.testPost('/links', {
          title: 'Test Link',
          url: 'https://test.com'
        }, 200)
      } catch (error) {
        expect(error).to.be.instanceOf(Error)
      }
    })
  })
})
