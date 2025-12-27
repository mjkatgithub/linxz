/// <reference types="vitest" />
/// <reference types="chai" />

import type { Pinia } from 'pinia'

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, any>, Record<string, any>, any>
  export default component
}

// Erweiterte Vue-Komponenten-Typen für Tests
declare module 'vue' {
  interface ComponentCustomProperties {
    $nextTick: typeof import('vue').nextTick
    // Allow tests to inject partial router/route without TS noise
    $router?: any
    $route?: any
  }
}

// Globale Test-Utilities
declare global {
  namespace Vi {
    interface MockedFunction<T extends (...args: any[]) => any> {
      mockResolvedValue: (value: ReturnType<T>) => MockedFunction<T>
      mockRejectedValue: (value: any) => MockedFunction<T>
    }
  }
}

declare global {
  var expect: typeof import('chai').expect
  var vi: typeof import('vitest').vi
  var describe: typeof import('vitest').describe
  var it: typeof import('vitest').it
  var beforeEach: typeof import('vitest').beforeEach
  var afterEach: typeof import('vitest').afterEach
  var beforeAll: typeof import('vitest').beforeAll
  var afterAll: typeof import('vitest').afterAll

  // Cucumber context interface
  interface CucumberContext {
    pinia?: Pinia
    userStore?: any
    appStore?: any
    currentPage?: string
    formData?: Record<string, unknown>
    lastError?: string
    lastSuccess?: string
    createdUser?: any
    createdLink?: any
    currentUser?: any
    lastAction?: string
    // Playwright types for E2E
    browser?: import('playwright').Browser
    page?: import('playwright').Page
    context?: import('playwright').BrowserContext
  }
}

// Provide minimal typings to support rare casts like `vi.Mock` in tests
// (some editors flag lowercase `vi` vs `Vi` namespace; this makes both work)
declare namespace vi {
  type Mock = any
}

export {}
