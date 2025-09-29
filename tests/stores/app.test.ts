import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Mock } from 'vitest'

const isClientMock = vi.fn(() => true)

vi.mock('~/stores/utils', () => ({
  isClient: isClientMock
}))

type LocalStorageMock = {
  getItem: Mock<[string], string | null>
  setItem: Mock<[string, string], void>
  removeItem: Mock<[string], void>
  clear: Mock<[], void>
}

const createMatchMediaResult = (matches: boolean) => ({
  matches,
  media: '',
  onchange: null as ((event: MediaQueryListEvent) => void) | null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
})

const originalMatchMedia = window.matchMedia
const matchMediaMock = vi.fn()

const applyLocalStorageMock = () => {
  const storage = new Map<string, string>()
  const localStorageMock = window.localStorage as unknown as LocalStorageMock

  localStorageMock.getItem.mockImplementation((key) => (storage.has(key) ? storage.get(key)! : null))
  localStorageMock.setItem.mockImplementation((key, value) => {
    storage.set(key, value)
  })
  localStorageMock.removeItem.mockImplementation((key) => {
    storage.delete(key)
  })
  localStorageMock.clear.mockImplementation(() => {
    storage.clear()
  })

  return { storage, localStorageMock }
}

const createAppStore = async (client = true) => {
  isClientMock.mockReturnValue(client)
  vi.resetModules()
  const { useAppStore } = await import('~/stores/app')
  setActivePinia(createPinia())
  return useAppStore()
}

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: matchMediaMock
  })
})

afterAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: originalMatchMedia
  })
})

describe('App Store', () => {
  let localStorageMock: LocalStorageMock
  let storage: Map<string, string>

  beforeEach(() => {
    vi.clearAllMocks()
    isClientMock.mockReturnValue(true)
    ;({ storage, localStorageMock } = applyLocalStorageMock())
    matchMediaMock.mockImplementation(() => createMatchMediaResult(false))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('provides the expected initial state', async () => {
    const appStore = await createAppStore()

    expect(appStore.settings).toEqual({
      theme: 'auto',
      language: 'de',
      notifications: true
    })
    expect(appStore.ui).toEqual({
      sidebarOpen: false,
      currentPage: '',
      breadcrumbs: []
    })
    expect(appStore.isLoading).toBe(false)
    expect(appStore.notifications).toEqual([])
  })

  it('loads settings from localStorage on the client', async () => {
    const appStore = await createAppStore(true)
    storage.set('app-theme', 'dark')
    storage.set('app-language', 'en')
    storage.set('app-notifications', 'false')

    appStore.loadSettings()

    expect(appStore.settings).toEqual({
      theme: 'dark',
      language: 'en',
      notifications: false
    })
  })

  it('falls back to defaults when stored theme is invalid', async () => {
    const appStore = await createAppStore(true)
    storage.set('app-theme', 'invalid')
    storage.set('app-language', 'es')
    storage.set('app-notifications', 'true')

    appStore.loadSettings()

    expect(appStore.settings).toEqual({
      theme: 'auto',
      language: 'es',
      notifications: true
    })
  })

  it('keeps defaults when no settings are stored', async () => {
    const appStore = await createAppStore(true)

    appStore.loadSettings()

    expect(appStore.settings).toEqual({
      theme: 'auto',
      language: 'de',
      notifications: true
    })
  })

  it('logs an error when loading settings fails', async () => {
    const appStore = await createAppStore(true)
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error('boom')
    })
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    appStore.loadSettings()

    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('skips loading settings on the server', async () => {
    const appStore = await createAppStore(false)
    localStorageMock.getItem.mockClear()

    appStore.loadSettings()

    expect(localStorageMock.getItem).not.toHaveBeenCalled()
  })

  it('evaluates isDarkTheme correctly for explicit themes', async () => {
    const appStore = await createAppStore()

    appStore.settings.theme = 'dark'
    expect(appStore.isDarkTheme).toBe(true)

    appStore.settings.theme = 'light'
    expect(appStore.isDarkTheme).toBe(false)
  })

  it('uses matchMedia when theme is auto and system prefers dark', async () => {
    const appStore = await createAppStore(true)
    matchMediaMock.mockImplementation(() => createMatchMediaResult(true))

    appStore.settings.theme = 'auto'
    expect(appStore.isDarkTheme).toBe(true)
  })

  it('defaults to dark theme on the server when theme is auto', async () => {
    const appStore = await createAppStore(false)

    appStore.settings.theme = 'auto'
    expect(appStore.isDarkTheme).toBe(true)
    expect(matchMediaMock).not.toHaveBeenCalled()
  })

  it('returns other getters correctly', async () => {
    const appStore = await createAppStore()

    appStore.settings.language = 'en'
    appStore.settings.notifications = false

    expect(appStore.currentLanguage).toBe('en')
    expect(appStore.notificationsEnabled).toBe(false)
  })

  it('persists theme changes when running on the client', async () => {
    const appStore = await createAppStore(true)

    appStore.setTheme('dark')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('app-theme', 'dark')
    expect(appStore.settings.theme).toBe('dark')
  })

  it('does not persist theme changes on the server', async () => {
    const appStore = await createAppStore(false)

    appStore.setTheme('light')
    expect(appStore.settings.theme).toBe('light')
    expect(localStorageMock.setItem).not.toHaveBeenCalled()
  })

  it('updates language and persists it', async () => {
    const appStore = await createAppStore(true)

    appStore.setLanguage('en')
    expect(appStore.settings.language).toBe('en')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('app-language', 'en')
  })

  it('toggles notification preference and persists it', async () => {
    const appStore = await createAppStore(true)

    appStore.toggleNotifications()
    expect(appStore.settings.notifications).toBe(false)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('app-notifications', 'false')
  })

  it('manages sidebar state correctly', async () => {
    const appStore = await createAppStore()

    appStore.toggleSidebar()
    expect(appStore.ui.sidebarOpen).toBe(true)

    appStore.closeSidebar()
    expect(appStore.ui.sidebarOpen).toBe(false)
  })

  it('updates current page and breadcrumbs', async () => {
    const appStore = await createAppStore()

    appStore.setCurrentPage('dashboard')
    expect(appStore.ui.currentPage).toBe('dashboard')

    appStore.setBreadcrumbs(['Home', 'Dashboard'])
    expect(appStore.ui.breadcrumbs).toEqual(['Home', 'Dashboard'])
  })

  it('adds notifications and removes them after the timeout', async () => {
    const appStore = await createAppStore()
    vi.useFakeTimers()
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(1000)

    appStore.addNotification('Test message')
    expect(appStore.notifications).toHaveLength(1)
    expect(appStore.notifications[0]).toMatchObject({
      id: '1000',
      message: 'Test message',
      type: 'info',
      timeout: 5000
    })

    await vi.advanceTimersByTimeAsync(5000)
    expect(appStore.notifications).toHaveLength(0)

    dateSpy.mockRestore()
  })

  it('adds persistent notifications when timeout is zero', async () => {
    const appStore = await createAppStore()
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

    appStore.addNotification('Keep me', 'success', 0)
    expect(appStore.notifications).toHaveLength(1)
    expect(appStore.notifications[0].type).toBe('success')
    expect(setTimeoutSpy).not.toHaveBeenCalled()
    setTimeoutSpy.mockRestore()
  })

  it('removes notifications manually and clears them all', async () => {
    const appStore = await createAppStore()
    const nowSpy = vi.spyOn(Date, 'now')
    nowSpy.mockReturnValueOnce(1).mockReturnValueOnce(2)
    appStore.addNotification('First', 'info', 0)
    appStore.addNotification('Second', 'info', 0)

    const idToRemove = appStore.notifications[0].id
    appStore.removeNotification(idToRemove)
    expect(appStore.notifications).toHaveLength(1)

    appStore.clearNotifications()
    expect(appStore.notifications).toHaveLength(0)

    nowSpy.mockRestore()
  })

  it('updates loading state', async () => {
    const appStore = await createAppStore()

    appStore.setLoading(true)
    expect(appStore.isLoading).toBe(true)

    appStore.setLoading(false)
    expect(appStore.isLoading).toBe(false)
  })

  it('resets settings and clears stored values', async () => {
    const appStore = await createAppStore(true)
    appStore.settings.theme = 'dark'
    appStore.settings.language = 'fr'
    appStore.settings.notifications = false

    appStore.resetSettings()

    expect(appStore.settings).toEqual({
      theme: 'auto',
      language: 'de',
      notifications: true
    })
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('app-theme')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('app-language')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('app-notifications')
  })
})
