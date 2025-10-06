import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

type VitestMock = ReturnType<typeof vi.fn>

declare global {
  var defineNuxtPlugin: VitestMock
}

const toastPluginMock = { name: 'VueToastificationMock' }

vi.mock('vue-toastification', () => ({
  default: toastPluginMock
}))

vi.mock('vue-toastification/dist/index.css', () => ({}))

const defineNuxtPluginMock = globalThis.defineNuxtPlugin

const loadPlugin = async () => {
  const module = await import('~/plugins/toastr.client')
  return module.default
}

describe('plugins/toastr.client', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers Toast with expected options via defineNuxtPlugin', async () => {
    const plugin = await loadPlugin()

    expect(defineNuxtPluginMock).toHaveBeenCalledTimes(1)
    expect(typeof plugin).toBe('function')

    const useMock = vi.fn()
    const nuxtApp = { vueApp: { use: useMock } }

    plugin(nuxtApp as any)

    expect(useMock).toHaveBeenCalledTimes(1)
    const [factory, options] = useMock.mock.calls[0]
    expect(factory).toBe(toastPluginMock)
    expect(options).toEqual({
      position: 'top-right',
      timeout: 5000,
      closeOnClick: true,
      pauseOnFocusLoss: true,
      pauseOnHover: true,
      draggable: true,
      draggablePercent: 0.6,
      showCloseButtonOnHover: false,
      hideProgressBar: false,
      closeButton: 'button',
      icon: true,
      rtl: false
    })
  })

  it('swallows installation errors and logs them', async () => {
    const plugin = await loadPlugin()

    const installError = new Error('failed to install Toast')
    const useMock = vi.fn(() => {
      throw installError
    })
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => plugin({ vueApp: { use: useMock } } as any)).not.toThrow()

    expect(useMock).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith('[toastr.client plugin] Toast installation failed', installError)
  })
})

