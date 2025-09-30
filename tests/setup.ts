import { expect } from 'chai'
import { config } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { vi } from 'vitest'

// Chai should-style assertions
import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinonChai from 'sinon-chai'

chai.use(chaiAsPromised)
chai.use(sinonChai)

// Mock Nuxt environment
vi.mock('#app', () => ({
  navigateTo: vi.fn(),
  useRuntimeConfig: vi.fn(() => ({
    public: {
      apiBase: 'http://localhost:3000/api'
    }
  })),
  useNuxtApp: vi.fn(() => ({
    $router: {
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn()
    }
  })),
  useRoute: vi.fn(() => ({
    params: {},
    query: {},
    path: '/',
    name: 'index'
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  }))
}))


const defineNuxtPluginMock = vi.fn((plugin: any) => plugin)
;(globalThis as any).defineNuxtPlugin = defineNuxtPluginMock
const useHeadMock = vi.fn()
;(globalThis as any).useHead = useHeadMock

// Mock Prisma
vi.mock('~/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    link: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}))

// Mock JWT
vi.mock('~/lib/jwt', () => ({
  generateToken: vi.fn(),
  verifyToken: vi.fn()
}))

// Mock Password
vi.mock('~/lib/password', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn()
}))

// Mock Logger
vi.mock('~/lib/logger', () => {
  const logger = {
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    debug: vi.fn()
  }

  return {
    createLogger: vi.fn(() => logger),
    default: logger
  }
})

// Global Vue Test Utils config
config.global.plugins = [createPinia()]

// Mock fetch for API tests
global.fetch = vi.fn()

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

