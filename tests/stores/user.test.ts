import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Mock } from 'vitest'
import { useUserStore } from '~/stores/user'

const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock
  })
}))

const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

afterAll(() => {
  consoleErrorSpy.mockRestore()
  consoleWarnSpy.mockRestore()
  consoleInfoSpy.mockRestore()
})

type StorageMock = {
  getItem: Mock<(key: string) => string | null>
  setItem: Mock<(key: string, value: string) => void>
  removeItem: Mock<(key: string) => void>
  clear: Mock<() => void>
}

const applyLocalStorageMock = () => {
  const storage = new Map<string, string>()
  const localStorageMock = window.localStorage as unknown as StorageMock

  localStorageMock.getItem.mockImplementation((key: string) => (storage.has(key) ? storage.get(key)! : null))
  localStorageMock.setItem.mockImplementation((key: string, value: string) => {
    storage.set(key, value)
  })
  localStorageMock.removeItem.mockImplementation((key: string) => {
    storage.delete(key)
  })
  localStorageMock.clear.mockImplementation(() => {
    storage.clear()
  })

  return { storage, localStorageMock }
}

global.$fetch = vi.fn() as any

const createUserStore = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  return useUserStore()
}

describe('User Store', () => {
  let userStore: ReturnType<typeof useUserStore>
  let localStorageMock: StorageMock
  let storage: Map<string, string>
  let fetchMock: any

  beforeEach(() => {
    ;({ storage, localStorageMock } = applyLocalStorageMock())
    fetchMock = vi.fn()
    ;(global.$fetch as any) = fetchMock
    userStore = createUserStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with expected defaults', () => {
    expect(userStore.currentUser).toBeNull()
    expect(userStore.userLinks).toEqual([])
    expect(userStore.isLoading).toBe(false)
    expect(userStore.error).toBeNull()
    expect(userStore.isLoggedIn).toBe(false)
    expect(userStore.username).toBe('')
    expect(userStore.activeLinks).toEqual([])
    expect(userStore.linkCount).toBe(0)
  })

  it('derives getters from populated state', () => {
    userStore.currentUser = {
      id: '1',
      username: 'tester',
      email: 'tester@example.com',
      createdAt: new Date(),
      isAuthenticated: true
    }
    userStore.userLinks = [
      { id: '1', title: 'One', url: 'https://one', isActive: true, order: 2, createdAt: new Date() },
      { id: '2', title: 'Two', url: 'https://two', isActive: false, order: 1, createdAt: new Date() }
    ]

    expect(userStore.isLoggedIn).toBe(true)
    expect(userStore.username).toBe('tester')
    expect(userStore.activeLinks[0].id).toBe('1')
    expect(userStore.linkCount).toBe(1)
  })

  describe('authentication', () => {
    it('logs in successfully', async () => {
      const response = {
        id: 10,
        username: 'tester',
        email: 'tester@example.com',
        token: 'token'
      }
      fetchMock.mockResolvedValueOnce(response)
      const loadLinksSpy = vi.spyOn(userStore, 'loadUserLinks').mockResolvedValue()

      await userStore.login('tester@example.com', 'secret')

      expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        body: { email: 'tester@example.com', password: 'secret' }
      })
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth-token', 'token')
      expect(userStore.currentUser?.username).toBe('tester')
      expect(userStore.isLoggedIn).toBe(true)
      expect(loadLinksSpy).toHaveBeenCalled()
      expect(toastSuccessMock).toHaveBeenCalled()
    })

    it('handles login failure', async () => {
      fetchMock.mockRejectedValueOnce(new Error('invalid'))

      await expect(userStore.login('tester@example.com', 'bad')).rejects.toThrow('invalid')
      expect(userStore.error).toBe('Login fehlgeschlagen')
      expect(toastErrorMock).toHaveBeenCalledWith('Login fehlgeschlagen')
    })

    it('signs up successfully', async () => {
      const response = {
        id: 2,
        username: 'new',
        email: 'new@example.com',
        token: 'signup-token'
      }
      fetchMock.mockResolvedValueOnce(response)

      const result = await userStore.signup({
        email: 'new@example.com',
        username: 'new',
        password: 'pw'
      })

      expect(result).toEqual(response)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth-token', 'signup-token')
      expect(userStore.currentUser?.username).toBe('new')
      expect(toastSuccessMock).toHaveBeenCalledWith('Registrierung erfolgreich!')
    })

    it('handles signup failure', async () => {
      fetchMock.mockRejectedValueOnce(new Error('exists'))

      await expect(userStore.signup({
        email: 'exists@example.com',
        username: 'exists',
        password: 'pw'
      })).rejects.toThrow('exists')

      expect(userStore.error).toBe('Registrierung fehlgeschlagen')
      expect(toastErrorMock).toHaveBeenCalledWith('Registrierung fehlgeschlagen')
    })

    it('logs out', () => {
      userStore.currentUser = {
        id: '1',
        username: 'tester',
        email: 'tester@example.com',
        createdAt: new Date(),
        isAuthenticated: true
      }
      userStore.userLinks = [{ id: '1', title: 'One', url: '#', isActive: true, order: 1, createdAt: new Date() }]
      localStorageMock.setItem('auth-token', 'token')

      userStore.logout()

      expect(userStore.currentUser).toBeNull()
      expect(userStore.userLinks).toEqual([])
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-token')
    })

    it('returns false from checkAuth when no token is present', async () => {
      const result = await userStore.checkAuth()
      expect(result).toBe(false)
    })

    it('loads profile during checkAuth', async () => {
      storage.set('auth-token', 'token')
      fetchMock.mockResolvedValueOnce({
        id: 2,
        username: 'tester',
        email: 'tester@example.com',
        createdAt: new Date().toISOString()
      })
      const loadLinksSpy = vi.spyOn(userStore, 'loadUserLinks').mockResolvedValue()

      const result = await userStore.checkAuth()

      expect(result).toBe(true)
      expect(userStore.currentUser?.id).toBe('2')
      expect(loadLinksSpy).toHaveBeenCalled()
    })

    it('clears token when checkAuth fails', async () => {
      storage.set('auth-token', 'token')
      fetchMock.mockRejectedValueOnce(new Error('expired'))

      const result = await userStore.checkAuth()

      expect(result).toBe(false)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-token')
    })
  })

  describe('loadUserLinks', () => {
    it('returns early when no user set', async () => {
      await userStore.loadUserLinks()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('loads links for authenticated user', async () => {
      userStore.currentUser = {
        id: '1',
        username: 'tester',
        email: 'tester@example.com',
        createdAt: new Date(),
        isAuthenticated: true
      }
      storage.set('auth-token', 'token')
      const now = new Date().toISOString()
      fetchMock.mockResolvedValueOnce({
        links: [
          {
            id: 1,
            title: 'One',
            url: '#',
            isActive: true,
            order: 1,
            createdAt: now
          }
        ]
      })

      await userStore.loadUserLinks()

      expect(userStore.userLinks).toHaveLength(1)
      expect(userStore.userLinks[0]).toMatchObject({ id: '1', title: 'One' })
      expect(userStore.userLinks[0].createdAt).toBeInstanceOf(Date)
    })

    it('sets error when token missing', async () => {
      userStore.currentUser = {
        id: '1',
        username: 'tester',
        email: 'tester@example.com',
        createdAt: new Date(),
        isAuthenticated: true
      }

      await userStore.loadUserLinks()

      expect(userStore.error).toBe('Fehler beim Laden der Links')
      expect(userStore.userLinks).toEqual([])
    })
  })

  describe('addLink', () => {
    it('does nothing when user absent', async () => {
      await userStore.addLink({
        title: 'A',
        url: '#',
        description: 'desc',
        isActive: true,
        order: 1
      })
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('adds link and shows toast', async () => {
      userStore.currentUser = {
        id: '1',
        username: 'tester',
        email: 'tester@example.com',
        createdAt: new Date(),
        isAuthenticated: true
      }
      storage.set('auth-token', 'token')
      const now = new Date().toISOString()
      fetchMock.mockResolvedValueOnce({
        id: 5,
        title: 'New',
        url: 'https://new',
        description: 'desc',
        isActive: true,
        order: 1,
        createdAt: now
      })

      await userStore.addLink({
        title: 'New',
        url: 'https://new',
        description: 'desc',
        isActive: true,
        order: 1
      })

      expect(userStore.userLinks[0]).toMatchObject({ id: '5', title: 'New' })
      expect(toastSuccessMock).toHaveBeenCalled()
      const addSuccessMessage = toastSuccessMock.mock.calls[0][0] as string
      expect(addSuccessMessage).toContain('Link erfolgreich')
    })

    it('throws when adding link without a token', async () => {
      userStore.currentUser = {
        id: '1',
        username: 'tester',
        email: 'tester@example.com',
        createdAt: new Date(),
        isAuthenticated: true
      }
      localStorageMock.getItem.mockReturnValueOnce(null)

      await expect(userStore.addLink({
        title: 'GitHub',
        url: 'https://github.com',
        description: 'profile',
        isActive: true,
        order: 1
      })).rejects.toThrow('Nicht authentifiziert')

      expect(userStore.error).toBe('Fehler beim Hinzufuegen des Links')
      const missingTokenMessage = toastErrorMock.mock.calls[0][0] as string
      expect(missingTokenMessage).toContain('Fehler beim Hinzuf')
    })

    it('propagates API failures', async () => {
      userStore.currentUser = {
        id: '1',
        username: 'tester',
        email: 'tester@example.com',
        createdAt: new Date(),
        isAuthenticated: true
      }
      storage.set('auth-token', 'token')
      fetchMock.mockRejectedValueOnce(new Error('failed'))

      await expect(userStore.addLink({
        title: 'New',
        url: 'https://new',
        description: 'desc',
        isActive: true,
        order: 1
      })).rejects.toThrow('failed')

      expect(userStore.error).toBe('Fehler beim Hinzufuegen des Links')
      expect(toastErrorMock).toHaveBeenCalled()
    })
  })

    it('normalises missing description when adding link', async () => {
      userStore.currentUser = {
        id: '1',
        username: 'tester',
        email: 'tester@example.com',
        createdAt: new Date(),
        isAuthenticated: true
      }
      storage.set('auth-token', 'token')
      const now = new Date().toISOString()
      fetchMock.mockResolvedValueOnce({
        id: 6,
        title: 'Two',
        url: 'https://two',
        description: null,
        isActive: true,
        order: 2,
        createdAt: now
      })

      await userStore.addLink({
        title: 'Two',
        url: 'https://two',
        description: undefined,
        isActive: true,
        order: 2
      })

      expect(userStore.userLinks[0].description).toBeUndefined()
      expect(toastSuccessMock).toHaveBeenCalled()
    })

  describe('updateLink', () => {
    it('updates existing link', async () => {
      userStore.userLinks = [
        {
          id: '42',
          title: 'Old',
          url: 'https://old',
          description: 'old',
          isActive: false,
          order: 1,
          createdAt: new Date()
        }
      ]
      storage.set('auth-token', 'token')
      fetchMock.mockResolvedValueOnce({
        title: 'New',
        url: 'https://new',
        description: null,
        isActive: true,
        order: 2
      })

      await userStore.updateLink('42', { title: 'New' })

      expect(userStore.userLinks[0]).toMatchObject({ title: 'New', url: 'https://new', description: undefined })
      expect(toastSuccessMock).toHaveBeenCalledWith('Link erfolgreich aktualisiert!')
    })

    it('ignores update when link is missing', async () => {
      userStore.userLinks = []
      storage.set('auth-token', 'token')
      fetchMock.mockResolvedValueOnce({
        title: 'Name',
        url: 'https://url',
        description: null,
        isActive: true,
        order: 1
      })

      await userStore.updateLink('missing', { title: 'Name' })

      expect(userStore.userLinks).toEqual([])
      expect(toastSuccessMock).toHaveBeenCalledWith('Link erfolgreich aktualisiert!')
    })

    it('throws when no token is available', async () => {
      await expect(userStore.updateLink('id', { title: 'New' })).rejects.toThrow('Nicht authentifiziert')
      expect(userStore.error).toBe('Fehler beim Aktualisieren des Links')
      expect(toastErrorMock).toHaveBeenCalledWith('Fehler beim Aktualisieren des Links')
    })

    it('propagates API errors', async () => {
      storage.set('auth-token', 'token')
      fetchMock.mockRejectedValueOnce(new Error('update failed'))

      await expect(userStore.updateLink('id', { title: 'New' })).rejects.toThrow('update failed')
      expect(userStore.error).toBe('Fehler beim Aktualisieren des Links')
      expect(toastErrorMock).toHaveBeenCalledWith('Fehler beim Aktualisieren des Links')
    })
  })

  describe('deleteLink', () => {
    beforeEach(() => {
      userStore.userLinks = [
        { id: '1', title: 'One', url: '#', isActive: true, order: 1, createdAt: new Date() },
        { id: '2', title: 'Two', url: '#', isActive: true, order: 2, createdAt: new Date() }
      ]
      storage.set('auth-token', 'token')
    })

    it('removes link after successful API call', async () => {
      fetchMock.mockResolvedValueOnce({ success: true })

      await userStore.deleteLink('1')

      expect(fetchMock).toHaveBeenCalledWith('/api/links/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer token' }
      })
      expect(userStore.userLinks).toHaveLength(1)
      expect(toastSuccessMock).toHaveBeenCalledWith(expect.stringContaining('erfolgreich'))
    })

    it('throws when deletion is attempted without auth token', async () => {
      storage.clear()

      await expect(userStore.deleteLink('1')).rejects.toThrow('Nicht authentifiziert')
      expect(fetchMock).not.toHaveBeenCalled()
      expect(userStore.error).toBe('Fehler beim Loeschen des Links')
      expect(toastErrorMock).toHaveBeenCalledWith(expect.stringContaining('Fehler'))
    })

    it('propagates API errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('delete failed'))

      await expect(userStore.deleteLink('1')).rejects.toThrow('delete failed')
      expect(userStore.userLinks).toHaveLength(2)
      expect(userStore.error).toBe('Fehler beim Loeschen des Links')
      expect(toastErrorMock).toHaveBeenCalledWith(expect.stringContaining('Fehler'))
    })
  })

  describe('reorderLinks', () => {
    it('updates order positions', async () => {
      vi.useFakeTimers()
      userStore.userLinks = [
        { id: 'a', title: 'A', url: '#', isActive: true, order: 3, createdAt: new Date() },
        { id: 'b', title: 'B', url: '#', isActive: true, order: 1, createdAt: new Date() },
        { id: 'c', title: 'C', url: '#', isActive: true, order: 2, createdAt: new Date() }
      ]

      const promise = userStore.reorderLinks(['b', 'c', 'a'])
      await vi.advanceTimersByTimeAsync(500)
      await promise

      expect(userStore.userLinks.map((link) => ({ id: link.id, order: link.order }))).toEqual([
        { id: 'a', order: 3 },
        { id: 'b', order: 1 },
        { id: 'c', order: 2 }
      ])
    })

    it('handles reorder failures gracefully', async () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation(() => {
        throw new Error('timer fail') as any
      })

      await userStore.reorderLinks(['1'])

      expect(userStore.error).toBe('Fehler beim Neuordnen der Links')
      setTimeoutSpy.mockRestore()
    })
  })

  describe('profile', () => {
    it('updates profile information', async () => {
      userStore.currentUser = {
        id: '1',
        username: 'old',
        email: 'user@example.com',
        createdAt: new Date(),
        isAuthenticated: true
      }
      storage.set('auth-token', 'token')
      fetchMock.mockResolvedValueOnce({ username: 'updated' })

      const result = await userStore.updateProfile({ username: 'updated' })

      expect(result).toEqual({ username: 'updated' })
      expect(userStore.currentUser?.username).toBe('updated')
      expect(toastSuccessMock).toHaveBeenCalledWith('Profil erfolgreich aktualisiert!')
    })

    it('throws when updating profile without token', async () => {
      userStore.currentUser = {
        id: '1',
        username: 'user',
        email: 'user@example.com',
        createdAt: new Date(),
        isAuthenticated: true
      }

      await expect(userStore.updateProfile({ username: 'new' })).rejects.toThrow('Nicht authentifiziert')
      expect(userStore.error).toBe('Fehler beim Aktualisieren des Profils')
      expect(toastErrorMock).toHaveBeenCalledWith('Fehler beim Aktualisieren des Profils')
    })

    it('propagates profile update failures', async () => {
      userStore.currentUser = {
        id: '1',
        username: 'old',
        email: 'user@example.com',
        createdAt: new Date(),
        isAuthenticated: true
      }
      storage.set('auth-token', 'token')
      fetchMock.mockRejectedValueOnce(new Error('update failed'))

      await expect(userStore.updateProfile({ username: 'new' })).rejects.toThrow('update failed')
      expect(userStore.error).toBe('Fehler beim Aktualisieren des Profils')
      expect(toastErrorMock).toHaveBeenCalledWith('Fehler beim Aktualisieren des Profils')
    })

    it('loads profile data', async () => {
      storage.set('auth-token', 'token')
      fetchMock.mockResolvedValueOnce({ username: 'tester' })

      const profile = await userStore.loadProfile()

      expect(profile).toEqual({ username: 'tester' })
      expect(fetchMock).toHaveBeenCalledWith('/api/users/me', {
        headers: { Authorization: 'Bearer token' }
      })
    })

    it('throws when loading profile without token', async () => {
      await expect(userStore.loadProfile()).rejects.toThrow('Nicht authentifiziert')
      expect(userStore.error).toBe('Fehler beim Laden des Profils')
    })

    it('propagates loadProfile errors', async () => {
      storage.set('auth-token', 'token')
      fetchMock.mockRejectedValueOnce(new Error('profile failed'))

      await expect(userStore.loadProfile()).rejects.toThrow('profile failed')
      expect(userStore.error).toBe('Fehler beim Laden des Profils')
    })
  })
})







