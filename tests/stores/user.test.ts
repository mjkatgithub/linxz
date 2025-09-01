import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '~/stores/user'

// Mock vue-toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  })
}))

// Mock $fetch
global.$fetch = vi.fn() as any

describe('User Store', () => {
  let pinia: any
  let userStore: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    
    // Reset localStorage
    localStorage.clear()
    
    // Reset mocks
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(userStore.currentUser).to.be.null
      expect(userStore.userLinks).to.be.an('array').that.is.empty
      expect(userStore.isLoading).to.be.false
      expect(userStore.error).to.be.null
    })

    it('should have correct initial getters', () => {
      expect(userStore.isLoggedIn).to.be.false
      expect(userStore.username).to.equal('')
      expect(userStore.activeLinks).to.be.an('array').that.is.empty
      expect(userStore.linkCount).to.equal(0)
    })
  })

  describe('Authentication', () => {
    it('should authenticate user successfully', async () => {
      const mockResponse = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        token: 'mock-jwt-token'
      }

      const mockLinksResponse = {
        links: [
          {
            id: 1,
            title: 'GitHub',
            url: 'https://github.com',
            description: 'My GitHub profile',
            isActive: true,
            order: 1,
            createdAt: '2024-01-01T00:00:00Z'
          }
        ]
      }

      // Mock API calls
      ;(global.$fetch as any)
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockLinksResponse)

      await userStore.login('test@example.com', 'password123')

      expect(userStore.isLoggedIn).to.be.true
      expect(userStore.currentUser).to.deep.include({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        isAuthenticated: true
      })
      expect(localStorage.getItem('auth-token')).to.equal('mock-jwt-token')
      expect(userStore.userLinks).to.have.length(1)
    })

    it('should handle login failure', async () => {
      const mockError = new Error('Invalid credentials')
      ;(global.$fetch as any).mockRejectedValueOnce(mockError)

      try {
        await userStore.login('test@example.com', 'wrongpassword')
      } catch (error) {
        expect(error).to.equal(mockError)
      }

      expect(userStore.isLoggedIn).to.be.false
      expect(userStore.currentUser).to.be.null
      expect(userStore.error).to.equal('Login fehlgeschlagen')
      expect(localStorage.getItem('auth-token')).to.be.null
    })

    it('should register user successfully', async () => {
      const mockResponse = {
        id: 2,
        email: 'newuser@example.com',
        username: 'newuser',
        name: 'New User',
        token: 'new-jwt-token'
      }

      ;(global.$fetch as any).mockResolvedValueOnce(mockResponse)

      const signupData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        name: 'New User'
      }

      await userStore.signup(signupData)

      expect(userStore.isLoggedIn).to.be.true
      expect(userStore.currentUser).to.deep.include({
        id: '2',
        username: 'newuser',
        email: 'newuser@example.com',
        isAuthenticated: true
      })
      expect(localStorage.getItem('auth-token')).to.equal('new-jwt-token')
    })

    it('should handle signup failure', async () => {
      const mockError = new Error('Email already exists')
      ;(global.$fetch as any).mockRejectedValueOnce(mockError)

      const signupData = {
        email: 'existing@example.com',
        username: 'existing',
        password: 'password123'
      }

      try {
        await userStore.signup(signupData)
      } catch (error) {
        expect(error).to.equal(mockError)
      }

      expect(userStore.isLoggedIn).to.be.false
      expect(userStore.currentUser).to.be.null
      expect(userStore.error).to.equal('Registrierung fehlgeschlagen')
    })

    it('should logout user correctly', () => {
      // Set initial state
      userStore.currentUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        isAuthenticated: true
      }
      userStore.userLinks = [{ id: '1', title: 'Test', url: 'https://test.com' }]
      localStorage.setItem('auth-token', 'test-token')

      userStore.logout()

      expect(userStore.currentUser).to.be.null
      expect(userStore.userLinks).to.be.an('array').that.is.empty
      expect(userStore.error).to.be.null
      expect(localStorage.getItem('auth-token')).to.be.null
    })
  })

  describe('Link Management', () => {
    beforeEach(() => {
      // Set authenticated user
      userStore.currentUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        isAuthenticated: true
      }
      localStorage.setItem('auth-token', 'test-token')
    })

    it('should load user links', async () => {
      const mockLinksResponse = {
        links: [
          {
            id: 1,
            title: 'GitHub',
            url: 'https://github.com',
            description: 'My GitHub profile',
            isActive: true,
            order: 1,
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            title: 'LinkedIn',
            url: 'https://linkedin.com',
            description: 'My LinkedIn profile',
            isActive: false,
            order: 2,
            createdAt: '2024-01-02T00:00:00Z'
          }
        ]
      }

      ;(global.$fetch as any).mockResolvedValueOnce(mockLinksResponse)

      await userStore.loadUserLinks()

      expect(userStore.userLinks).to.have.length(2)
      expect(userStore.activeLinks).to.have.length(1)
      expect(userStore.linkCount).to.equal(1)
      expect(userStore.activeLinks[0].title).to.equal('GitHub')
    })

    it('should add new link', async () => {
      const mockResponse = {
        id: 3,
        title: 'New Link',
        url: 'https://newlink.com',
        description: 'A new link',
        isActive: true,
        order: 1,
        createdAt: '2024-01-03T00:00:00Z'
      }

      ;(global.$fetch as any).mockResolvedValueOnce(mockResponse)

      const linkData = {
        title: 'New Link',
        url: 'https://newlink.com',
        description: 'A new link'
      }

      await userStore.addLink(linkData)

      expect(userStore.userLinks).to.have.length(1)
      expect(userStore.userLinks[0]).to.deep.include({
        id: '3',
        title: 'New Link',
        url: 'https://newlink.com',
        description: 'A new link',
        isActive: true
      })
    })

    it('should update existing link', async () => {
      // Set initial link
      userStore.userLinks = [{
        id: '1',
        title: 'Old Title',
        url: 'https://oldurl.com',
        description: 'Old description',
        isActive: true,
        order: 1,
        createdAt: new Date()
      }]

      const mockResponse = {
        id: 1,
        title: 'Updated Title',
        url: 'https://updatedurl.com',
        description: 'Updated description',
        isActive: true,
        order: 1,
        createdAt: '2024-01-01T00:00:00Z'
      }

      ;(global.$fetch as any).mockResolvedValueOnce(mockResponse)

      const updates = {
        title: 'Updated Title',
        url: 'https://updatedurl.com',
        description: 'Updated description'
      }

      await userStore.updateLink('1', updates)

      expect(userStore.userLinks[0]).to.deep.include({
        title: 'Updated Title',
        url: 'https://updatedurl.com',
        description: 'Updated description'
      })
    })

    it('should delete link', async () => {
      userStore.userLinks = [
        { id: '1', title: 'Link 1', url: 'https://link1.com', isActive: true, order: 1, createdAt: new Date() },
        { id: '2', title: 'Link 2', url: 'https://link2.com', isActive: true, order: 2, createdAt: new Date() }
      ]

      await userStore.deleteLink('1')

      expect(userStore.userLinks).to.have.length(1)
      expect(userStore.userLinks[0].id).to.equal('2')
    })

    it('should reorder links', async () => {
      userStore.userLinks = [
        { id: '1', title: 'Link 1', url: 'https://link1.com', isActive: true, order: 1, createdAt: new Date() },
        { id: '2', title: 'Link 2', url: 'https://link2.com', isActive: true, order: 2, createdAt: new Date() },
        { id: '3', title: 'Link 3', url: 'https://link3.com', isActive: true, order: 3, createdAt: new Date() }
      ]

      await userStore.reorderLinks(['3', '1', '2'])

      expect(userStore.userLinks[0].order).to.equal(1) // Link 3
      expect(userStore.userLinks[1].order).to.equal(2) // Link 1
      expect(userStore.userLinks[2].order).to.equal(3) // Link 2
    })
  })

  describe('Profile Management', () => {
    beforeEach(() => {
      userStore.currentUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        isAuthenticated: true
      }
      localStorage.setItem('auth-token', 'test-token')
    })

    it('should update user profile', async () => {
      const mockResponse = {
        id: 1,
        username: 'updateduser',
        email: 'test@example.com',
        name: 'Updated Name',
        bio: 'Updated bio'
      }

      ;(global.$fetch as any).mockResolvedValueOnce(mockResponse)

      const profileData = {
        username: 'updateduser',
        name: 'Updated Name',
        bio: 'Updated bio'
      }

      await userStore.updateProfile(profileData)

      expect(userStore.currentUser?.username).to.equal('updateduser')
    })

    it('should load user profile', async () => {
      const mockResponse = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        bio: 'Test bio',
        avatar: 'avatar.jpg',
        createdAt: '2024-01-01T00:00:00Z'
      }

      ;(global.$fetch as any).mockResolvedValueOnce(mockResponse)

      const result = await userStore.loadProfile()

      expect(result).to.deep.equal(mockResponse)
    })
  })

  describe('Auto-Login', () => {
    it('should check authentication on app start', async () => {
      localStorage.setItem('auth-token', 'valid-token')

      const mockUserResponse = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        bio: 'Test bio',
        avatar: 'avatar.jpg',
        createdAt: '2024-01-01T00:00:00Z'
      }

      const mockLinksResponse = {
        links: []
      }

      ;(global.$fetch as any)
        .mockResolvedValueOnce(mockUserResponse)
        .mockResolvedValueOnce(mockLinksResponse)

      const result = await userStore.checkAuth()

      expect(result).to.be.true
      expect(userStore.isLoggedIn).to.be.true
      expect(userStore.currentUser).to.deep.include({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        isAuthenticated: true
      })
    })

    it('should handle invalid token', async () => {
      localStorage.setItem('auth-token', 'invalid-token')

      ;(global.$fetch as any).mockRejectedValueOnce(new Error('Invalid token'))

      const result = await userStore.checkAuth()

      expect(result).to.be.false
      expect(userStore.isLoggedIn).to.be.false
      expect(localStorage.getItem('auth-token')).to.be.null
    })

    it('should handle missing token', async () => {
      const result = await userStore.checkAuth()

      expect(result).to.be.false
      expect(userStore.isLoggedIn).to.be.false
    })
  })

  describe('Getters', () => {
    it('should return correct username', () => {
      userStore.currentUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        isAuthenticated: true
      }

      expect(userStore.username).to.equal('testuser')
    })

    it('should return empty username when not logged in', () => {
      expect(userStore.username).to.equal('')
    })

    it('should filter active links correctly', () => {
      userStore.userLinks = [
        { id: '1', title: 'Active Link', url: 'https://active.com', isActive: true, order: 1, createdAt: new Date() },
        { id: '2', title: 'Inactive Link', url: 'https://inactive.com', isActive: false, order: 2, createdAt: new Date() },
        { id: '3', title: 'Another Active', url: 'https://another.com', isActive: true, order: 3, createdAt: new Date() }
      ]

      expect(userStore.activeLinks).to.have.length(2)
      expect(userStore.activeLinks[0].title).to.equal('Active Link')
      expect(userStore.activeLinks[1].title).to.equal('Another Active')
    })

    it('should count active links correctly', () => {
      userStore.userLinks = [
        { id: '1', title: 'Link 1', url: 'https://link1.com', isActive: true, order: 1, createdAt: new Date() },
        { id: '2', title: 'Link 2', url: 'https://link2.com', isActive: false, order: 2, createdAt: new Date() },
        { id: '3', title: 'Link 3', url: 'https://link3.com', isActive: true, order: 3, createdAt: new Date() }
      ]

      expect(userStore.linkCount).to.equal(2)
    })
  })
})
