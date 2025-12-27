import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Pinia } from 'pinia'
import { vi } from 'vitest'
import { useUserStore } from '~/stores/user'
import { useAppStore } from '~/stores/app'

// Test utilities for consistent test setup
export class TestHelper {
  private pinia: Pinia
  private userStore: any
  private appStore: any

  constructor() {
    this.pinia = createPinia()
    setActivePinia(this.pinia)
    this.userStore = useUserStore()
    this.appStore = useAppStore()
  }

  // Create a mounted component with proper setup
  mountComponent(component: any, options: any = {}): VueWrapper<any> {
    const defaultOptions = {
      global: {
        plugins: [this.pinia],
        stubs: {
          'nuxt-link': true,
          'nuxt-page': true,
          'nuxt-layout': true
        },
        mocks: {
          $router: {
            push: vi.fn(),
            replace: vi.fn(),
            go: vi.fn(),
            back: vi.fn(),
            forward: vi.fn()
          },
          $route: {
            params: {},
            query: {},
            path: '/',
            name: 'index'
          }
        }
      }
    }

    const mergedOptions = Object.assign({}, defaultOptions, options)
    return mount(component, mergedOptions)
  }

  // Setup authenticated user
  setupAuthenticatedUser(userData: any = {}) {
    const defaultUser = Object.assign({
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
      avatar: null,
      bio: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }, userData)

    this.userStore.setUser(defaultUser)
    this.userStore.setAuthenticated(true)
    return defaultUser
  }

  // Setup unauthenticated state
  setupUnauthenticatedUser() {
    this.userStore.logout()
  }

  // Mock API responses
  mockApiResponse(endpoint: string, response: any, status: number = 200) {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response))
    })

    global.fetch = mockFetch
    return mockFetch
  }

  // Mock API error
  mockApiError(endpoint: string, error: string, status: number = 500) {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: () => Promise.resolve({ error }),
      text: () => Promise.resolve(JSON.stringify({ error }))
    })

    global.fetch = mockFetch
    return mockFetch
  }

  // Wait for async operations
  async waitFor(ms: number = 0) {
    await new Promise(resolve => setTimeout(resolve, ms))
  }

  // Get stores
  getUserStore() {
    return this.userStore
  }

  getAppStore() {
    return this.appStore
  }

  getPinia() {
    return this.pinia
  }
}

// Global test helper instance
let testHelper: TestHelper

export const setupTest = () => {
  testHelper = new TestHelper()
  return testHelper
}

export const getTestHelper = () => {
  if (!testHelper) {
    testHelper = new TestHelper()
  }
  return testHelper
}

// Mock data factories
export const createMockUser = (overrides: any = {}) => Object.assign({
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  password: 'hashed_password',
  name: 'Test User',
  avatar: null,
  bio: null,
  createdAt: new Date(),
  updatedAt: new Date()
}, overrides)

export const createMockLink = (overrides: any = {}) => Object.assign({
  id: 1,
  title: 'Test Link',
  url: 'https://example.com',
  description: 'Test description',
  icon: 'mdi-link',
  order: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: 1
}, overrides)

// Alternative createMockLink function with parameters for backward compatibility
export const createMockLinkWithParams = (userId: number, title: string, url: string, description?: string, icon?: string, isActive?: boolean, order?: number) => ({
  id: Date.now(),
  title,
  url,
  description: description || null,
  icon: icon || null,
  order: order || 0,
  isActive: isActive !== undefined ? isActive : true,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId
})

// Chai should-style extensions
export const should = {
  exist: (value: any) => {
    if (value === null || value === undefined) {
      throw new Error(`Expected value to exist, but got ${value}`)
    }
  },

  beTrue: (value: any) => {
    if (value !== true) {
      throw new Error(`Expected value to be true, but got ${value}`)
    }
  },

  beFalse: (value: any) => {
    if (value !== false) {
      throw new Error(`Expected value to be false, but got ${value}`)
    }
  },

  equal: (actual: any, expected: any) => {
    if (actual !== expected) {
      throw new Error(`Expected ${actual} to equal ${expected}`)
    }
  },

  contain: (actual: any, expected: any) => {
    if (!actual.includes(expected)) {
      throw new Error(`Expected ${actual} to contain ${expected}`)
    }
  },

  beGreaterThan: (actual: number, expected: number) => {
    if (actual <= expected) {
      throw new Error(`Expected ${actual} to be greater than ${expected}`)
    }
  },

  beLessThan: (actual: number, expected: number) => {
    if (actual >= expected) {
      throw new Error(`Expected ${actual} to be less than ${expected}`)
    }
  }
}

// Global should object for BDD style
declare global {
  interface Object {
    should: typeof should
  }
}

Object.prototype.should = should


