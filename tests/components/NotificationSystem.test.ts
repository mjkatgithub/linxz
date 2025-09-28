import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import NotificationSystem from '~/components/NotificationSystem.vue'
import { useAppStore } from '~/stores/app'
import type { Notification } from '~/stores/types'

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
  let pinia: ReturnType<typeof createPinia>
  let appStore: ReturnType<typeof useAppStore>
  let wrapper: VueWrapper<InstanceType<typeof NotificationSystem>>
  let notificationId = 0

  const mountComponent = () => {
    wrapper = mount(NotificationSystem, {
      global: {
        plugins: [pinia]
      }
    })
  }

  const setNotifications = async (notifications: Notification[]) => {
    appStore.notifications = notifications
    await nextTick()
  }

  const pushNotification = async (override: Partial<Notification> = {}) => {
    const notification: Notification = {
      id: `notification-${++notificationId}`,
      message: 'Test message',
      type: 'info',
      ...override
    }

    await setNotifications([...appStore.notifications, notification])
    return notification
  }

  const clearToastMocks = () => {
    Object.values(mockToast).forEach((toastFn) => toastFn.mockClear())
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    notificationId = 0
    pinia = createPinia()
    setActivePinia(pinia)
    appStore = useAppStore()
    mountComponent()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('mounts successfully', () => {
    expect(wrapper.exists()).toBe(true)
  })

  const notificationMatrix: Array<{
    type: Notification['type']
    spy: keyof typeof mockToast
    timeout: number
  }> = [
    { type: 'success', spy: 'success', timeout: 5000 },
    { type: 'error', spy: 'error', timeout: 8000 },
    { type: 'warning', spy: 'warning', timeout: 6000 },
    { type: 'info', spy: 'info', timeout: 5000 }
  ]

  it.each(notificationMatrix)(
    'shows $type notifications with default timeout',
    async ({ type, spy, timeout }) => {
      const message = `${type} message`

      await pushNotification({ type, message })

      expect(mockToast[spy]).toHaveBeenCalledTimes(1)
      expect(mockToast[spy]).toHaveBeenLastCalledWith(message, { timeout })
    }
  )

  it('uses a custom timeout when provided', async () => {
    const message = 'Custom timeout'

    await pushNotification({ type: 'warning', message, timeout: 1234 })

    expect(mockToast.warning).toHaveBeenCalledTimes(1)
    expect(mockToast.warning).toHaveBeenLastCalledWith(message, { timeout: 1234 })
  })

  it('removes notifications after displaying them', async () => {
    const removeNotificationSpy = vi.spyOn(appStore, 'removeNotification')

    const notification = await pushNotification({ id: 'removal-test', type: 'success' })

    vi.advanceTimersByTime(100)

    expect(removeNotificationSpy).toHaveBeenCalledWith(notification.id)
  })

  it('does not trigger extra toasts when notifications are removed', async () => {
    await pushNotification({ type: 'success', message: 'First notification' })

    clearToastMocks()

    await setNotifications([])

    expect(mockToast.success).not.toHaveBeenCalled()
    expect(mockToast.error).not.toHaveBeenCalled()
    expect(mockToast.warning).not.toHaveBeenCalled()
    expect(mockToast.info).not.toHaveBeenCalled()
  })

  it('only toasts the newest notification when multiple are present', async () => {
    await pushNotification({ type: 'info', message: 'First' })

    clearToastMocks()

    await pushNotification({ type: 'error', message: 'Second' })

    expect(mockToast.error).toHaveBeenCalledTimes(1)
    expect(mockToast.error).toHaveBeenLastCalledWith('Second', { timeout: 8000 })
    expect(mockToast.info).not.toHaveBeenCalled()
    expect(mockToast.success).not.toHaveBeenCalled()
    expect(mockToast.warning).not.toHaveBeenCalled()
  })
})
