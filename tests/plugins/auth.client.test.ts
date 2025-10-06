import { describe, it, expect, vi, beforeEach } from 'vitest'

type VitestMock = ReturnType<typeof vi.fn>

declare global {
  // Provided via tests/setup.ts
  var defineNuxtPlugin: VitestMock
  var useHead: VitestMock
}

const storeMocks = vi.hoisted(() => {
  const checkAuth = vi.fn()
  const useUserStore = vi.fn(() => ({ checkAuth }))
  return { checkAuth, useUserStore }
})

vi.mock('~/stores/user', () => storeMocks)

const defineNuxtPluginMock = globalThis.defineNuxtPlugin
const useHeadMock = globalThis.useHead

const loadPlugin = async () => {
  const module = await import('~/plugins/auth.client')
  return module.default
}

describe('plugins/auth.client', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    storeMocks.checkAuth.mockReset()
    storeMocks.useUserStore.mockReset()
    storeMocks.useUserStore.mockImplementation(() => ({ checkAuth: storeMocks.checkAuth }))
  })

  it('registers an async plugin via defineNuxtPlugin', async () => {
    const plugin = await loadPlugin()

    expect(defineNuxtPluginMock).toHaveBeenCalledTimes(1)
    expect(typeof plugin).toBe('function')
    expect(plugin.constructor.name).toBe('AsyncFunction')
    expect(useHeadMock).not.toHaveBeenCalled()
  })

  it('checks authentication when the plugin runs', async () => {
    storeMocks.checkAuth.mockResolvedValue(true)
    const plugin = await loadPlugin()

    await plugin({} as any)

    expect(storeMocks.useUserStore).toHaveBeenCalledTimes(1)
    expect(storeMocks.checkAuth).toHaveBeenCalledTimes(1)
  })

  it('swallows errors from checkAuth to keep app startup stable', async () => {
    const failure = new Error('auth failed')
    storeMocks.checkAuth.mockRejectedValue(failure)
    const plugin = await loadPlugin()

    await expect(plugin({} as any)).resolves.toBeUndefined()

    expect(storeMocks.checkAuth).toHaveBeenCalledTimes(1)
  })
})
