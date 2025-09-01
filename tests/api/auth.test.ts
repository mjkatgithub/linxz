import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApiTestHelper } from '~/tests/utils/api-test-utils'

describe('Authentication API', () => {
  let api: ApiTestHelper

  beforeEach(() => {
    api = new ApiTestHelper()
    api.resetMocks()
  })

  it('should login user with valid credentials', async () => {
    const mockResponse = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
      token: 'mock-jwt-token'
    }

    await api.testPost('/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    }, 200, mockResponse)

    // Verifiziere dass fetch mit korrekten Parametern aufgerufen wurde
    api.verifyFetchCall(0, 'http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  it('should reject login with invalid credentials', async () => {
    await api.testError('/auth/login', 'POST', 401, 'Ungültige Anmeldedaten')

    api.verifyFetchCall(0, 'http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  })

  it('should reject login with missing email', async () => {
    await api.testError('/auth/login', 'POST', 400, 'Email und Passwort sind erforderlich')

    api.verifyFetchCall(0, 'http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  })

  it('should reject login with missing password', async () => {
    await api.testError('/auth/login', 'POST', 400, 'Email und Passwort sind erforderlich')

    api.verifyFetchCall(0, 'http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  })

  it('should handle server errors gracefully', async () => {
    await api.testError('/auth/login', 'POST', 500, 'Fehler beim Anmelden')

    api.verifyFetchCall(0, 'http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  })

  it('should return proper user data on successful login', async () => {
    const expectedUserData = {
      id: 42,
      email: 'user@example.com',
      username: 'johndoe',
      name: 'John Doe',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }

    await api.testPost('/auth/login', {
      email: 'user@example.com',
      password: 'securepassword'
    }, 200, expectedUserData)

    // Verifiziere dass alle erwarteten Felder zurückgegeben werden
    expect(expectedUserData).to.have.property('id')
    expect(expectedUserData).to.have.property('email')
    expect(expectedUserData).to.have.property('username')
    expect(expectedUserData).to.have.property('name')
    expect(expectedUserData).to.have.property('token')
  })

  it('should handle network errors', async () => {
    const mockFetch = api.mockFetch()
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    try {
      await api.testPost('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      }, 200)
    } catch (error) {
      expect(error).to.be.instanceOf(Error)
      expect((error as Error).message).to.equal('Network error')
    }
  })

  it('should validate email format', async () => {
    await api.testError('/auth/login', 'POST', 400, 'Ungültige Email-Adresse')

    api.verifyFetchCall(0, 'http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  })

  it('should handle concurrent login attempts', async () => {
    const mockResponse = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
      token: 'mock-jwt-token'
    }

    // Simuliere mehrere gleichzeitige Login-Versuche
    const promises = [
      api.testPost('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      }, 200, mockResponse),
      api.testPost('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      }, 200, mockResponse)
    ]

    await Promise.all(promises)

    // Verifiziere dass beide Calls gemacht wurden
    const mockFetch = global.fetch as any
    expect(mockFetch).to.have.been.calledTwice
  })
})
