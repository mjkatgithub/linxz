import { describe, it, expect, vi, beforeEach } from 'vitest'

type VitestMock = ReturnType<typeof vi.fn>

declare global {
  // Provided via tests/setup.ts
  var defineNuxtPlugin: VitestMock
  var useHead: VitestMock
}

const vuetifyModuleMocks = vi.hoisted(() => {
  const instance = { name: 'vuetify-instance' }

  return {
    instance,
    createVuetify: vi.fn(() => instance),
    components: { VApp: { name: 'VApp' } },
    directives: { Ripple: { name: 'Ripple' } }
  }
})

vi.mock('vuetify', () => ({
  createVuetify: vuetifyModuleMocks.createVuetify
}))

vi.mock('vuetify/components', () => vuetifyModuleMocks.components)
vi.mock('vuetify/directives', () => vuetifyModuleMocks.directives)
vi.mock('vuetify/styles', () => ({}))
vi.mock('@mdi/font/css/materialdesignicons.css', () => ({}))

// Mock App Store
const appStoreMock = {
  loadSettings: vi.fn(),
  settings: { theme: 'auto' }
}

vi.mock('~/stores/app', () => ({
  useAppStore: () => appStoreMock
}))

// Mock Vue watch
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    watch: vi.fn()
  }
})

const loadPlugin = async () => {
  const module = await import('~/plugins/vuetify')
  return module.default
}

const defineNuxtPluginMock = globalThis.defineNuxtPlugin
const useHeadMock = globalThis.useHead

describe('plugins/vuetify', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('creates and installs Vuetify with expected configuration', async () => {
    const plugin = await loadPlugin()
    const nuxtApp = { vueApp: { use: vi.fn() } }

    const result = await plugin(nuxtApp as any)

    expect(result).toBeUndefined()
    expect(defineNuxtPluginMock).toHaveBeenCalledTimes(1)
    expect(vuetifyModuleMocks.createVuetify).toHaveBeenCalledTimes(1)
    expect(vuetifyModuleMocks.createVuetify).toHaveBeenCalledWith({
      components: vuetifyModuleMocks.components,
      directives: vuetifyModuleMocks.directives,
      theme: {
        defaultTheme: expect.any(String),
        themes: {
          light: {},
          dark: {}
        }
      },
      icons: {
        defaultSet: 'mdi'
      }
    })

    expect(nuxtApp.vueApp.use).toHaveBeenCalledTimes(1)
    expect(nuxtApp.vueApp.use).toHaveBeenCalledWith(vuetifyModuleMocks.instance)

    expect(useHeadMock).toHaveBeenCalledTimes(1)
    expect(useHeadMock.mock.calls[0][0]).toMatchObject({
      link: expect.arrayContaining([
        expect.objectContaining({
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/icon?family=Material+Icons'
        })
      ]),
      meta: expect.arrayContaining([
        expect.objectContaining({
          name: 'theme-color',
          content: 'rgb(33, 33, 33)',
          media: '(prefers-color-scheme: dark)'
        }),
        expect.objectContaining({
          name: 'theme-color',
          content: 'rgb(250, 250, 250)',
          media: '(prefers-color-scheme: light)'
        })
      ])
    })
  })

  it('logs and stops when createVuetify fails', async () => {
    const plugin = await loadPlugin()
    const failure = new Error('create failed')
    vuetifyModuleMocks.createVuetify.mockImplementationOnce(() => {
      throw failure
    })

    const nuxtApp = { vueApp: { use: vi.fn() } }
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await plugin(nuxtApp as any)

    expect(result).toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalledWith('[vuetify plugin] Failed to create Vuetify instance', failure)
    expect(nuxtApp.vueApp.use).not.toHaveBeenCalled()
    expect(useHeadMock).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('logs but continues when useHead fails', async () => {
    const plugin = await loadPlugin()
    const failure = new Error('head failed')
    useHeadMock.mockImplementationOnce(() => {
      throw failure
    })

    const nuxtApp = { vueApp: { use: vi.fn() } }
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await plugin(nuxtApp as any)

    expect(result).toBeUndefined()
    expect(nuxtApp.vueApp.use).toHaveBeenCalledTimes(1)
    expect(nuxtApp.vueApp.use).toHaveBeenCalledWith(vuetifyModuleMocks.instance)
    expect(useHeadMock).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith('[vuetify plugin] Failed to register head metadata', failure)

    consoleErrorSpy.mockRestore()
  })
})
