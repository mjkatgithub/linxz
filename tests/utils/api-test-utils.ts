import { vi } from 'vitest'
import { expect } from 'chai'

// API Test utilities for testing server endpoints
export class ApiTestHelper {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(baseUrl: string = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    }
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  // Remove authentication token
  removeAuthToken() {
    delete this.defaultHeaders['Authorization']
  }

  // Mock fetch for API calls
  mockFetch() {
    const mockFetch = vi.fn()
    global.fetch = mockFetch
    return mockFetch
  }

  // Test GET request
  async testGet(endpoint: string, expectedStatus: number = 200, expectedData?: any) {
    const mockFetch = this.mockFetch()
    
    mockFetch.mockResolvedValueOnce({
      ok: expectedStatus >= 200 && expectedStatus < 300,
      status: expectedStatus,
      json: () => Promise.resolve(expectedData || {}),
      text: () => Promise.resolve(JSON.stringify(expectedData || {}))
    })

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.defaultHeaders
    })

    expect(response.status).to.equal(expectedStatus)
    
    if (expectedData) {
      const data = await response.json()
      expect(data).to.deep.equal(expectedData)
    }

    return response
  }

  // Test POST request
  async testPost(endpoint: string, body: any, expectedStatus: number = 200, expectedData?: any) {
    const mockFetch = this.mockFetch()
    
    mockFetch.mockResolvedValueOnce({
      ok: expectedStatus >= 200 && expectedStatus < 300,
      status: expectedStatus,
      json: () => Promise.resolve(expectedData || {}),
      text: () => Promise.resolve(JSON.stringify(expectedData || {}))
    })

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(body)
    })

    expect(response.status).to.equal(expectedStatus)
    
    if (expectedData) {
      const data = await response.json()
      expect(data).to.deep.equal(expectedData)
    }

    return response
  }

  // Test PUT request
  async testPut(endpoint: string, body: any, expectedStatus: number = 200, expectedData?: any) {
    const mockFetch = this.mockFetch()
    
    mockFetch.mockResolvedValueOnce({
      ok: expectedStatus >= 200 && expectedStatus < 300,
      status: expectedStatus,
      json: () => Promise.resolve(expectedData || {}),
      text: () => Promise.resolve(JSON.stringify(expectedData || {}))
    })

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.defaultHeaders,
      body: JSON.stringify(body)
    })

    expect(response.status).to.equal(expectedStatus)
    
    if (expectedData) {
      const data = await response.json()
      expect(data).to.deep.equal(expectedData)
    }

    return response
  }

  // Test DELETE request
  async testDelete(endpoint: string, expectedStatus: number = 200, expectedData?: any) {
    const mockFetch = this.mockFetch()
    
    mockFetch.mockResolvedValueOnce({
      ok: expectedStatus >= 200 && expectedStatus < 300,
      status: expectedStatus,
      json: () => Promise.resolve(expectedData || {}),
      text: () => Promise.resolve(JSON.stringify(expectedData || {}))
    })

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.defaultHeaders
    })

    expect(response.status).to.equal(expectedStatus)
    
    if (expectedData) {
      const data = await response.json()
      expect(data).to.deep.equal(expectedData)
    }

    return response
  }

  // Test error response
  async testError(endpoint: string, method: string = 'GET', expectedStatus: number = 400, errorMessage?: string) {
    const mockFetch = this.mockFetch()
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: expectedStatus,
      json: () => Promise.resolve({ error: errorMessage || 'Error occurred' }),
      text: () => Promise.resolve(JSON.stringify({ error: errorMessage || 'Error occurred' }))
    })

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: this.defaultHeaders
    })

    expect(response.status).to.equal(expectedStatus)
    
    const data = await response.json()
    expect(data).to.have.property('error')
    
    if (errorMessage) {
      expect(data.error).to.equal(errorMessage)
    }

    return response
  }

  // Verify fetch was called with correct parameters
  verifyFetchCall(callIndex: number = 0, expectedUrl: string, expectedOptions?: any) {
    const mockFetch = global.fetch as any
    expect(mockFetch).to.have.been.called
    
    const call = mockFetch.getCall(callIndex)
    expect(call.args[0]).to.equal(expectedUrl)
    
    if (expectedOptions) {
      expect(call.args[1]).to.deep.include(expectedOptions)
    }
  }

  // Reset all mocks
  resetMocks() {
    vi.clearAllMocks()
  }
}

// Global API test helper instance
let apiTestHelper: ApiTestHelper

export const setupApiTest = () => {
  apiTestHelper = new ApiTestHelper()
  return apiTestHelper
}

export const getApiTestHelper = () => {
  if (!apiTestHelper) {
    apiTestHelper = new ApiTestHelper()
  }
  return apiTestHelper
}


