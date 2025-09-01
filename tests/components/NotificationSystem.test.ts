import { describe, it, expect, beforeEach, vi } from 'vitest'
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
})