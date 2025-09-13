import { describe, it, expect } from 'vitest'
import type {
  User,
  Link,
  AppSettings,
  UIState,
  Notification,
  ApiResponse,
  LoginRequest,
  SignupRequest,
  CreateLinkRequest,
  UpdateLinkRequest,
  UpdateProfileRequest
} from '~/stores/types'

describe('Store Types', () => {
  describe('User interface', () => {
    it('should have correct structure', () => {
      const user: User = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        bio: 'Test bio',
        avatar: 'avatar.jpg',
        createdAt: new Date(),
        isAuthenticated: true
      }

      expect(user.id).toBe('123')
      expect(user.username).toBe('testuser')
      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('Test User')
      expect(user.bio).toBe('Test bio')
      expect(user.avatar).toBe('avatar.jpg')
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.isAuthenticated).toBe(true)
    })

    it('should work with optional fields', () => {
      const user: User = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        isAuthenticated: false
      }

      expect(user.id).toBe('123')
      expect(user.username).toBe('testuser')
      expect(user.email).toBe('test@example.com')
      expect(user.name).toBeUndefined()
      expect(user.bio).toBeUndefined()
      expect(user.avatar).toBeUndefined()
      expect(user.isAuthenticated).toBe(false)
    })
  })

  describe('Link interface', () => {
    it('should have correct structure', () => {
      const link: Link = {
        id: '456',
        title: 'Test Link',
        url: 'https://example.com',
        description: 'Test description',
        isActive: true,
        order: 1,
        createdAt: new Date()
      }

      expect(link.id).toBe('456')
      expect(link.title).toBe('Test Link')
      expect(link.url).toBe('https://example.com')
      expect(link.description).toBe('Test description')
      expect(link.isActive).toBe(true)
      expect(link.order).toBe(1)
      expect(link.createdAt).toBeInstanceOf(Date)
    })

    it('should work without description', () => {
      const link: Link = {
        id: '456',
        title: 'Test Link',
        url: 'https://example.com',
        isActive: false,
        order: 2,
        createdAt: new Date()
      }

      expect(link.description).toBeUndefined()
      expect(link.isActive).toBe(false)
    })
  })

  describe('AppSettings interface', () => {
    it('should have correct theme values', () => {
      const settings: AppSettings = {
        theme: 'light',
        language: 'de',
        notifications: true
      }

      expect(settings.theme).toBe('light')
      expect(settings.language).toBe('de')
      expect(settings.notifications).toBe(true)
    })

    it('should support all theme values', () => {
      const lightSettings: AppSettings = { theme: 'light', language: 'en', notifications: false }
      const darkSettings: AppSettings = { theme: 'dark', language: 'en', notifications: false }
      const autoSettings: AppSettings = { theme: 'auto', language: 'en', notifications: false }

      expect(lightSettings.theme).toBe('light')
      expect(darkSettings.theme).toBe('dark')
      expect(autoSettings.theme).toBe('auto')
    })
  })

  describe('UIState interface', () => {
    it('should have correct structure', () => {
      const uiState: UIState = {
        sidebarOpen: true,
        currentPage: 'dashboard',
        breadcrumbs: ['Home', 'Dashboard', 'Settings']
      }

      expect(uiState.sidebarOpen).toBe(true)
      expect(uiState.currentPage).toBe('dashboard')
      expect(uiState.breadcrumbs).toEqual(['Home', 'Dashboard', 'Settings'])
    })
  })

  describe('Notification interface', () => {
    it('should have correct structure', () => {
      const notification: Notification = {
        id: '789',
        type: 'success',
        message: 'Test message',
        timeout: 5000
      }

      expect(notification.id).toBe('789')
      expect(notification.type).toBe('success')
      expect(notification.message).toBe('Test message')
      expect(notification.timeout).toBe(5000)
    })

    it('should support all notification types', () => {
      const success: Notification = { id: '1', type: 'success', message: 'Success' }
      const error: Notification = { id: '2', type: 'error', message: 'Error' }
      const warning: Notification = { id: '3', type: 'warning', message: 'Warning' }
      const info: Notification = { id: '4', type: 'info', message: 'Info' }

      expect(success.type).toBe('success')
      expect(error.type).toBe('error')
      expect(warning.type).toBe('warning')
      expect(info.type).toBe('info')
    })

    it('should work without timeout', () => {
      const notification: Notification = {
        id: '789',
        type: 'info',
        message: 'Test message'
      }

      expect(notification.timeout).toBeUndefined()
    })
  })

  describe('ApiResponse interface', () => {
    it('should handle successful response', () => {
      const response: ApiResponse<User> = {
        success: true,
        data: {
          id: '123',
          username: 'test',
          email: 'test@example.com',
          createdAt: new Date(),
          isAuthenticated: true
        }
      }

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.username).toBe('test')
    })

    it('should handle error response', () => {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Something went wrong',
        message: 'Error occurred'
      }

      expect(response.success).toBe(false)
      expect(response.error).toBe('Something went wrong')
      expect(response.message).toBe('Error occurred')
      expect(response.data).toBeUndefined()
    })
  })

  describe('Request interfaces', () => {
    it('should validate LoginRequest', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      }

      expect(loginRequest.email).toBe('test@example.com')
      expect(loginRequest.password).toBe('password123')
    })

    it('should validate SignupRequest', () => {
      const signupRequest: SignupRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      }

      expect(signupRequest.username).toBe('testuser')
      expect(signupRequest.email).toBe('test@example.com')
      expect(signupRequest.password).toBe('password123')
      expect(signupRequest.confirmPassword).toBe('password123')
    })

    it('should validate CreateLinkRequest', () => {
      const createLinkRequest: CreateLinkRequest = {
        title: 'Test Link',
        url: 'https://example.com',
        description: 'Test description',
        isActive: true,
        order: 1
      }

      expect(createLinkRequest.title).toBe('Test Link')
      expect(createLinkRequest.url).toBe('https://example.com')
      expect(createLinkRequest.description).toBe('Test description')
      expect(createLinkRequest.isActive).toBe(true)
      expect(createLinkRequest.order).toBe(1)
    })

    it('should validate UpdateLinkRequest with partial data', () => {
      const updateLinkRequest: UpdateLinkRequest = {
        title: 'Updated Link',
        isActive: false
      }

      expect(updateLinkRequest.title).toBe('Updated Link')
      expect(updateLinkRequest.isActive).toBe(false)
      expect(updateLinkRequest.url).toBeUndefined()
      expect(updateLinkRequest.description).toBeUndefined()
      expect(updateLinkRequest.order).toBeUndefined()
    })

    it('should validate UpdateProfileRequest', () => {
      const updateProfileRequest: UpdateProfileRequest = {
        username: 'newusername',
        name: 'New Name',
        bio: 'New bio',
        avatar: 'new-avatar.jpg',
        currentPassword: 'oldpass',
        newPassword: 'newpass'
      }

      expect(updateProfileRequest.username).toBe('newusername')
      expect(updateProfileRequest.name).toBe('New Name')
      expect(updateProfileRequest.bio).toBe('New bio')
      expect(updateProfileRequest.avatar).toBe('new-avatar.jpg')
      expect(updateProfileRequest.currentPassword).toBe('oldpass')
      expect(updateProfileRequest.newPassword).toBe('newpass')
    })
  })
})
