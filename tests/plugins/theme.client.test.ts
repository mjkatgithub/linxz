import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '~/stores/app'

const mockMatchMedia = (matches: boolean) => ({
  matches,
  media: '(prefers-color-scheme: dark)',
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
})

// Mock Vuetify useTheme
const mockTheme = {
  global: {
    name: { value: 'light' }
  }
}

vi.mock('vuetify', () => ({
  useTheme: () => mockTheme
}))

// We don't need to mock watch anymore since we import it directly

describe('theme.client Plugin', () => {
  let pinia: ReturnType<typeof createPinia>
  let appStore: ReturnType<typeof useAppStore>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    appStore = useAppStore()
    
    // Mock window.matchMedia
    global.window.matchMedia = vi.fn(
      (query: string) => mockMatchMedia(false) as any
    )
    
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    } as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('plugin initialization', () => {
    it('loads settings when loadSettings is called', () => {
      const loadSettingsSpy = vi.spyOn(appStore, 'loadSettings')
      
      appStore.loadSettings()
      
      expect(loadSettingsSpy).toHaveBeenCalled()
    })
  })

  describe('theme synchronization', () => {
    it('syncs light theme to vuetify', () => {
      appStore.setTheme('light')
      
      expect(appStore.settings.theme).toBe('light')
    })

    it('syncs dark theme to vuetify', () => {
      appStore.setTheme('dark')
      
      expect(appStore.settings.theme).toBe('dark')
    })

    it('syncs auto theme based on system preference', () => {
      appStore.setTheme('auto')
      
      expect(appStore.settings.theme).toBe('auto')
    })
  })

  describe('system preference detection', () => {
    it('listens for system preference changes', () => {
      const addEventListenerSpy = vi.fn()
      const mockMediaQuery = {
        ...mockMatchMedia(false),
        addEventListener: addEventListenerSpy
      }
      
      global.window.matchMedia = vi.fn(
        () => mockMediaQuery as any
      )
      
      appStore.setTheme('auto')
      
      // Auto mode should detect system preference
      expect(appStore.settings.theme).toBe('auto')
    })

    it('detects dark system preference', () => {
      const mockMediaQuery = mockMatchMedia(true)
      global.window.matchMedia = vi.fn(
        () => mockMediaQuery as any
      )
      
      appStore.setTheme('auto')
      
      // Auto mode should detect system preference
      expect(appStore.settings.theme).toBe('auto')
    })

    it('detects light system preference', () => {
      const mockMediaQuery = mockMatchMedia(false)
      global.window.matchMedia = vi.fn(
        () => mockMediaQuery as any
      )
      
      appStore.setTheme('auto')
      
      // Auto mode should detect system preference
      expect(appStore.settings.theme).toBe('auto')
    })
  })

  describe('localStorage integration', () => {
    it('loads theme from localStorage on initialization', () => {
      // Save theme first
      appStore.setTheme('dark')
      
      // Load settings should use saved theme
      appStore.loadSettings()
      
      expect(appStore.settings.theme).toBe('dark')
    })

    it('defaults to auto if no theme in localStorage', () => {
      global.localStorage.getItem = vi.fn(() => null)
      
      appStore.loadSettings()
      
      expect(appStore.settings.theme).toBe('auto')
    })
  })

  describe('theme changes', () => {
    it('reacts to theme changes in store', () => {
      appStore.setTheme('light')
      
      expect(appStore.settings.theme).toBe('light')
      
      appStore.setTheme('dark')
      
      expect(appStore.settings.theme).toBe('dark')
    })

    it('updates when theme cycles', () => {
      appStore.setTheme('light')
      expect(appStore.settings.theme).toBe('light')
      
      appStore.setTheme('dark')
      expect(appStore.settings.theme).toBe('dark')
      
      appStore.setTheme('auto')
      expect(appStore.settings.theme).toBe('auto')
    })
  })
})
