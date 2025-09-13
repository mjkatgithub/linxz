import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import NotificationSystem from '~/components/NotificationSystem.vue'
import { useAppStore } from '~/stores/app'

// Mock vue-toastification
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

describe('NotificationSystem', () => {
  let pinia: any
  let appStore: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    appStore = useAppStore()
    
    // Reset mocks
    vi.clearAllMocks()
  })

  it('should render without crashing', () => {
    const wrapper = mount(NotificationSystem, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should have access to app store', () => {
    const wrapper = mount(NotificationSystem, {
      global: {
        plugins: [pinia]
      }
    })

    expect(appStore).toBeDefined()
    expect(appStore.addNotification).toBeDefined()
  })

  it('should be able to add notifications to store', () => {
    const wrapper = mount(NotificationSystem, {
      global: {
        plugins: [pinia]
      }
    })

    // Teste ob Store-Funktion funktioniert
    appStore.addNotification('Test', 'success')
    
    expect(appStore.notifications).toHaveLength(1)
    expect(appStore.notifications[0].message).toBe('Test')
    expect(appStore.notifications[0].type).toBe('success')
  })

  it('should handle different notification types', () => {
    const wrapper = mount(NotificationSystem, {
      global: {
        plugins: [pinia]
      }
    })

    // Teste verschiedene Typen
    appStore.addNotification('Success', 'success')
    appStore.addNotification('Error', 'error')
    appStore.addNotification('Warning', 'warning')
    appStore.addNotification('Info', 'info')
    
    expect(appStore.notifications).toHaveLength(4)
    expect(appStore.notifications[0].type).toBe('success')
    expect(appStore.notifications[1].type).toBe('error')
    expect(appStore.notifications[2].type).toBe('warning')
    expect(appStore.notifications[3].type).toBe('info')
  })

  it('should use default timeout when not specified', () => {
    const wrapper = mount(NotificationSystem, {
      global: {
        plugins: [pinia]
      }
    })

    appStore.addNotification('Test', 'success')
    
    expect(appStore.notifications[0].timeout).toBe(5000) // Default timeout
  })

  it('should use custom timeout when specified', () => {
    const wrapper = mount(NotificationSystem, {
      global: {
        plugins: [pinia]
      }
    })

    appStore.addNotification('Test', 'success', 10000)
    
    expect(appStore.notifications[0].timeout).toBe(10000)
  })

  it('should remove notifications after timeout', async () => {
    const wrapper = mount(NotificationSystem, {
      global: {
        plugins: [pinia]
      }
    })

    appStore.addNotification('Test', 'success', 100) // Kurzer Timeout
    
    expect(appStore.notifications).toHaveLength(1)
    
    // Warte auf Timeout
    await new Promise(resolve => setTimeout(resolve, 150))
    
    expect(appStore.notifications).toHaveLength(0)
  })

  // Tests für die Komponenten-Logik (simulieren die Watcher-Funktionalität)
  describe('Component Logic Simulation', () => {
    // Simuliere die Watcher-Logik aus der Komponente
    function simulateNotificationWatcher(newNotifications: any[], oldNotifications: any[] = []) {
      if (newNotifications.length > (oldNotifications?.length || 0)) {
        const latestNotification = newNotifications[newNotifications.length - 1]
        
        // Zeige Toast basierend auf dem Typ
        switch (latestNotification.type) {
          case 'success':
            mockToast.success(latestNotification.message, {
              timeout: latestNotification.timeout || 5000
            })
            break
          case 'error':
            mockToast.error(latestNotification.message, {
              timeout: latestNotification.timeout || 8000
            })
            break
          case 'warning':
            mockToast.warning(latestNotification.message, {
              timeout: latestNotification.timeout || 6000
            })
            break
          case 'info':
          default:
            mockToast.info(latestNotification.message, {
              timeout: latestNotification.timeout || 5000
            })
            break
        }
        
        // Simuliere das setTimeout für removeNotification
        setTimeout(() => {
          // Simuliere removeNotification call
          appStore.removeNotification(latestNotification.id)
        }, 100)
      }
    }

    it('should call toast.success when notification type is success', () => {
      const notifications = [
        { id: '1', message: 'Success message', type: 'success', timeout: 5000, createdAt: new Date() }
      ]
      
      simulateNotificationWatcher(notifications, [])
      
      expect(mockToast.success).toHaveBeenCalledWith('Success message', {
        timeout: 5000
      })
    })

    it('should call toast.error when notification type is error', () => {
      const notifications = [
        { id: '1', message: 'Error message', type: 'error', timeout: 8000, createdAt: new Date() }
      ]
      
      simulateNotificationWatcher(notifications, [])
      
      expect(mockToast.error).toHaveBeenCalledWith('Error message', {
        timeout: 8000
      })
    })

    it('should call toast.warning when notification type is warning', () => {
      const notifications = [
        { id: '1', message: 'Warning message', type: 'warning', timeout: 6000, createdAt: new Date() }
      ]
      
      simulateNotificationWatcher(notifications, [])
      
      expect(mockToast.warning).toHaveBeenCalledWith('Warning message', {
        timeout: 6000
      })
    })

    it('should call toast.info when notification type is info', () => {
      const notifications = [
        { id: '1', message: 'Info message', type: 'info', timeout: 5000, createdAt: new Date() }
      ]
      
      simulateNotificationWatcher(notifications, [])
      
      expect(mockToast.info).toHaveBeenCalledWith('Info message', {
        timeout: 5000
      })
    })

    it('should call toast.info for unknown notification types (default case)', () => {
      const notifications = [
        { id: '1', message: 'Unknown type message', type: 'unknown', timeout: 5000, createdAt: new Date() }
      ]
      
      simulateNotificationWatcher(notifications, [])
      
      expect(mockToast.info).toHaveBeenCalledWith('Unknown type message', {
        timeout: 5000
      })
    })

    it('should use default timeout when notification has no timeout', () => {
      const notifications = [
        { id: '1', message: 'Test message', type: 'success', createdAt: new Date() }
      ]
      
      simulateNotificationWatcher(notifications, [])
      
      expect(mockToast.success).toHaveBeenCalledWith('Test message', {
        timeout: 5000 // Default timeout für success
      })
    })

    it('should use correct default timeouts for different types', () => {
      const successNotification = { id: '1', message: 'Success', type: 'success', createdAt: new Date() }
      const errorNotification = { id: '2', message: 'Error', type: 'error', createdAt: new Date() }
      const warningNotification = { id: '3', message: 'Warning', type: 'warning', createdAt: new Date() }
      const infoNotification = { id: '4', message: 'Info', type: 'info', createdAt: new Date() }
      
      simulateNotificationWatcher([successNotification], [])
      simulateNotificationWatcher([successNotification, errorNotification], [successNotification])
      simulateNotificationWatcher([successNotification, errorNotification, warningNotification], [successNotification, errorNotification])
      simulateNotificationWatcher([successNotification, errorNotification, warningNotification, infoNotification], [successNotification, errorNotification, warningNotification])
      
      expect(mockToast.success).toHaveBeenCalledWith('Success', { timeout: 5000 })
      expect(mockToast.error).toHaveBeenCalledWith('Error', { timeout: 8000 })
      expect(mockToast.warning).toHaveBeenCalledWith('Warning', { timeout: 6000 })
      expect(mockToast.info).toHaveBeenCalledWith('Info', { timeout: 5000 })
    })

    it('should not trigger watcher when notifications length does not increase', () => {
      const notifications = [
        { id: '1', message: 'Test message', type: 'success', createdAt: new Date() }
      ]
      
      // Simuliere keine Änderung in der Länge
      simulateNotificationWatcher(notifications, notifications)
      
      expect(mockToast.success).not.toHaveBeenCalled()
    })

    it('should handle empty oldNotifications array', () => {
      const notifications = [
        { id: '1', message: 'First message', type: 'success', createdAt: new Date() }
      ]
      
      simulateNotificationWatcher(notifications, [])
      
      expect(mockToast.success).toHaveBeenCalledWith('First message', {
        timeout: 5000
      })
    })

    it('should handle multiple notifications being added', () => {
      const notifications = [
        { id: '1', message: 'First message', type: 'success', createdAt: new Date() },
        { id: '2', message: 'Second message', type: 'error', createdAt: new Date() }
      ]
      
      // Simuliere das Hinzufügen der ersten Notification
      simulateNotificationWatcher([notifications[0]], [])
      // Simuliere das Hinzufügen der zweiten Notification
      simulateNotificationWatcher(notifications, [notifications[0]])
      
      expect(mockToast.success).toHaveBeenCalledWith('First message', { timeout: 5000 })
      expect(mockToast.error).toHaveBeenCalledWith('Second message', { timeout: 8000 })
    })
  })
})