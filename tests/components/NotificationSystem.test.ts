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

    expect(wrapper.exists()).to.be.true
    expect(wrapper.find('div').exists()).to.be.true
  })

  it('should call success toast when success notification is added', async () => {
    const wrapper = mount(NotificationSystem, {
      global: {
        plugins: [pinia]
      }
    })

    // Füge Success-Notification hinzu
    appStore.addNotification('Test erfolgreich!', 'success', 5000)

    // Warte auf Vue's Reaktivität
    await wrapper.vm.$nextTick()

    // Prüfe ob success toast aufgerufen wurde
    expect(mockToast.success).to.have.been.calledWith('Test erfolgreich!', {
      timeout: 5000
    })
  })

  it('should call error toast when error notification is added', async () => {
    const wrapper = mount(NotificationSystem, {
      global: {
        plugins: [pinia]
      }
    })

    appStore.addNotification('Ein Fehler ist aufgetreten!', 'error', 8000)
    await wrapper.vm.$nextTick()

    expect(mockToast.error).to.have.been.calledWith('Ein Fehler ist aufgetreten!', {
      timeout: 8000
    })
  })

  it('should call warning toast when warning notification is added', async () => {
    const wrapper = mount(NotificationSystem, {
      global: {
        plugins: [pinia]
      }
    })

    appStore.addNotification('Warnung: Achtung!', 'warning', 6000)
    await wrapper.vm.$nextTick()

    expect(mockToast.warning).to.have.been.calledWith('Warnung: Achtung!', {
      timeout: 6000
    })
  })

  it('should call info toast when info notification is added', async () => {
    const wrapper = mount(NotificationSystem, {
      global: {
        plugins: [pinia]
      }
    })

    appStore.addNotification('Information: Alles OK!', 'info', 5000)
    await wrapper.vm.$nextTick()

    expect(mockToast.info).to.have.been.calledWith('Information: Alles OK!', {
      timeout: 5000
    })
  })

  it('should handle multiple notifications correctly', async () => {
    const wrapper = mount(NotificationSystem, {
      global: {
        plugins: [pinia]
      }
    })

    // Füge mehrere Notifications hinzu
    appStore.addNotification('Erste Nachricht', 'success', 5000)
    appStore.addNotification('Zweite Nachricht', 'error', 8000)
    appStore.addNotification('Dritte Nachricht', 'info', 3000)

    await wrapper.vm.$nextTick()

    // Prüfe ob alle Toasts aufgerufen wurden
    expect(mockToast.success).to.have.been.calledWith('Erste Nachricht', {
      timeout: 5000
    })
    expect(mockToast.error).to.have.been.calledWith('Zweite Nachricht', {
      timeout: 8000
    })
    expect(mockToast.info).to.have.been.calledWith('Dritte Nachricht', {
      timeout: 3000
    })
  })

  it('should use default timeout when not specified', async () => {
    const wrapper = mount(NotificationSystem, {
      global: {
        plugins: [pinia]
      }
    })

    // Füge Notification ohne Timeout hinzu
    appStore.addNotification('Test ohne Timeout', 'success')

    await wrapper.vm.$nextTick()

    expect(mockToast.success).to.have.been.calledWith('Test ohne Timeout', {
      timeout: 5000 // Default timeout
    })
  })

  it('should remove notification from store after showing toast', async () => {
    const wrapper = mount(NotificationSystem, {
      global: {
        plugins: [pinia]
      }
    })

    // Füge Notification hinzu
    appStore.addNotification('Test Message', 'success', 100)

    await wrapper.vm.$nextTick()

    // Warte auf Timeout (100ms + 100ms buffer)
    await new Promise(resolve => setTimeout(resolve, 200))

    // Prüfe ob Notification aus dem Store entfernt wurde
    expect(appStore.notifications).to.have.length(0)
  })

  it('should handle notifications with zero timeout', async () => {
    const wrapper = mount(NotificationSystem, {
      global: {
        plugins: [pinia]
      }
    })

    // Füge Notification mit 0 Timeout hinzu
    appStore.addNotification('Permanent Message', 'info', 0)

    await wrapper.vm.$nextTick()

    expect(mockToast.info).to.have.been.calledWith('Permanent Message', {
      timeout: 5000 // Sollte trotzdem default timeout verwenden
    })
  })
})
