import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { h, Suspense } from 'vue'

// SUT
import DashboardPage from '@/pages/dashboard.vue'

// Nuxt mocks from tests/setup.ts
import { navigateTo as mockedNavigateTo } from '#app'

// Store mocks are injected via vi.mock using variables captured from this scope
let userStoreMock: any
let appStoreMock: any

vi.mock('~/stores/user', () => ({
  useUserStore: () => userStoreMock
}))

vi.mock('~/stores/app', () => ({
  useAppStore: () => appStoreMock
}))

// Simple stubs for Vuetify components
const stubs = {
  NuxtLayout: {
    name: 'NuxtLayout',
    template: '<div data-testid="nuxt-layout"><slot /></div>'
  },
  'v-container': {
    name: 'VContainer',
    template: '<div data-testid="v-container"><slot /></div>'
  },
  'v-row': { name: 'VRow', template: '<div data-testid="v-row"><slot /></div>' },
  'v-col': { name: 'VCol', template: '<div data-testid="v-col"><slot /></div>' },
  'v-card': { name: 'VCard', template: '<div data-testid="v-card"><slot /></div>' },
  'v-card-title': { name: 'VCardTitle', template: '<div data-testid="v-card-title"><slot /></div>' },
  'v-card-text': { name: 'VCardText', template: '<div data-testid="v-card-text"><slot /></div>' },
  'v-card-actions': { name: 'VCardActions', template: '<div data-testid="v-card-actions"><slot /></div>' },
  'v-divider': { name: 'VDivider', template: '<hr />' },
  'v-spacer': { name: 'VSpacer', template: '<span data-testid="v-spacer" />' },
  'v-progress-circular': {
    name: 'VProgressCircular',
    template: '<div role="status" aria-label="loading" />'
  },
  'v-avatar': {
    name: 'VAvatar',
    template: '<div data-testid="v-avatar"><slot /></div>'
  },
  'v-img': {
    name: 'VImg',
    props: ['src', 'alt'],
    template: '<img :src="src" :alt="alt" data-testid="v-img" />'
  },
  'v-icon': { 
    name: 'VIcon', 
    template: '<span data-testid="v-icon"><slot /></span>' 
  },
  'v-list': { name: 'VList', template: '<div data-testid="v-list"><slot /></div>' },
  'v-list-item': {
    name: 'VListItem',
    inheritAttrs: false,
    props: ['title', 'subtitle'],
    setup(props: any, { attrs, slots }: any) {
      return () =>
        h(
          'div',
          {
            'data-testid': 'v-list-item',
            ...(attrs as any)
          },
          [
            h('div', { 'data-testid': 'v-list-item-title' }, props.title),
            h('div', { 'data-testid': 'v-list-item-subtitle' }, props.subtitle),
            slots.prepend ? h('div', { 'data-testid': 'prepend' }, slots.prepend()) : null,
            slots.default ? slots.default() : null,
            slots.append ? h('div', { 'data-testid': 'append' }, slots.append()) : null
          ].filter(Boolean)
        )
    }
  },
  'v-btn': {
    name: 'VBtn',
    inheritAttrs: false,
    props: ['to', 'type', 'icon', 'variant', 'color', 'size'],
    emits: ['click'],
    setup(props: any, { emit, slots, attrs }: any) {
      return () =>
        h(
          'button',
          {
            type: (props.type as any) || 'button',
            'data-testid': 'v-btn',
            'aria-label': props.icon ? String(props.icon) : (attrs as any)['aria-label'],
            onClick: (e: Event) => emit('click', e),
            ...(attrs as any)
          },
          slots.default ? slots.default() : []
        )
    }
  },
  'v-dialog': {
    name: 'VDialog',
    props: ['modelValue', 'maxWidth'],
    emits: ['update:modelValue'],
    template: '<div v-if="modelValue" data-testid="v-dialog"><slot /></div>'
  },
  'v-form': {
    name: 'VForm',
    emits: ['submit'],
    template: '<form @submit.prevent="$emit(\'submit\', $event)"><slot /></form>'
  },
  'v-text-field': {
    name: 'VTextField',
    props: ['modelValue', 'label', 'type', 'required'],
    emits: ['update:modelValue'],
    template:
      '<label style="display:block"><span>{{ label }}</span><input :aria-label="label" :type="type || \'text\'" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /></label>'
  },
  'v-textarea': {
    name: 'VTextarea',
    props: ['modelValue', 'label', 'rows'],
    emits: ['update:modelValue'],
    template:
      '<label style="display:block"><span>{{ label }}</span><textarea :aria-label="label" :rows="rows || 3" @input="$emit(\'update:modelValue\', $event.target.value)">{{ modelValue }}</textarea></label>'
  }
}

// Utility to render page wrapped in Suspense
const SuspendedWrapper = {
  name: 'SuspendedWrapper',
  setup() {
    return () => h(Suspense, null, { default: () => h(DashboardPage as any) })
  }
}

const renderDashboard = async (overrides?: Partial<typeof userStoreMock>) => {
  // Default user store mock
  userStoreMock = {
    isLoggedIn: true,
    username: 'testuser',
    linkCount: 2,
    isLoading: false,
    activeLinks: [
      { id: '1', title: 'Test Link 1', url: 'https://example.com', description: 'Desc 1', isActive: true, order: 1 },
      { id: '2', title: 'Test Link 2', url: 'https://test.com', description: 'Desc 2', isActive: true, order: 2 }
    ],
    userLinks: [],
    currentUser: { username: 'testuser', name: 'Test User', avatar: 'avatar.jpg' },
    loadUserLinks: vi.fn().mockResolvedValue(undefined),
    addLink: vi.fn().mockResolvedValue(undefined),
    deleteLink: vi.fn().mockResolvedValue(undefined),
    updateLink: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn()
  }

  Object.assign(userStoreMock, overrides)

  // Default app store mock
  appStoreMock = {
    addNotification: vi.fn()
  }

  const push = vi.fn()
  const utils = render(SuspendedWrapper as any, {
    global: {
      // Inject minimal $router/$route for templates that rely on them
      // Cast the whole config to any to avoid TS friction in tests
      // @typescript-eslint/no-explicit-any
      config: ({ globalProperties: { $router: ({ push } as any), $route: ({ params: {} } as any) } } as any),
      stubs
    }
  })

  return { push, ...utils }
}

describe('pages/dashboard.vue (render + interactions)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders user info and stats', async () => {
    await renderDashboard({ linkCount: 2 })

    // heading should appear
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeTruthy()
    expect(screen.getByText(/willkommen,\s*testuser/i)).toBeTruthy()
    expect(screen.getByText('Test User')).toBeTruthy()
    expect(screen.getByText(/deine links \(2\)/i)).toBeTruthy()
    const img = screen.getByTestId('v-img') as HTMLImageElement
    expect(img.getAttribute('alt')).toBe('testuser')
  })

  it('calls loadUserLinks on mount', async () => {
    const loadUserLinks = vi.fn().mockResolvedValue(undefined)
    await renderDashboard({ loadUserLinks })
    expect(loadUserLinks).toHaveBeenCalled()
  })

  it('redirects to login when not logged in', async () => {
    await renderDashboard({ isLoggedIn: false })
    // Cast to any to avoid TS/IDE namespace issues
    expect((mockedNavigateTo as any)).toHaveBeenCalledWith('/login')
  })

  it('shows loading state', async () => {
    await renderDashboard({ isLoading: true, activeLinks: [] })
    expect(screen.getByText('Lade Links...')).toBeTruthy()
  })

  it.skip('shows empty state and opens/closes add-link dialog', async () => {
    const user = userEvent.setup()
    await renderDashboard({ isLoading: false, activeLinks: [], linkCount: 0 })

    expect(screen.getByText(/noch keine links vorhanden/i)).toBeTruthy()

    const addFirstBtn = screen.getByRole('button', { name: /ersten link hinzufügen/i })
    await user.click(addFirstBtn)
    expect(screen.getByTestId('v-dialog')).toBeTruthy()
    expect(screen.getByText('Link hinzufügen')).toBeTruthy()

    const cancel = screen.getByRole('button', { name: /abbrechen/i })
    await user.click(cancel)
    expect(screen.queryByText('Link hinzufügen')).toBeNull()
  })

  it.skip('opens add-link dialog from actions and submits to call addLink', async () => {
    const user = userEvent.setup()
    const addLink = vi.fn().mockResolvedValue(undefined)
    await renderDashboard({ userLinks: [], addLink })

    const actionsAddBtn = screen.getAllByRole('button').find((b) => /link hinzufügen/i.test(b.textContent || ''))!
    await user.click(actionsAddBtn)
    expect(screen.getByText('Link hinzufügen')).toBeTruthy()

    const title = screen.getByRole('textbox', { name: 'Titel' }) as HTMLInputElement
    const url = screen.getByRole('textbox', { name: 'URL' }) as HTMLInputElement
    const desc = screen.getByRole('textbox', { name: 'Beschreibung (optional)' }) as HTMLTextAreaElement
    await user.type(title, 'New Link')
    await user.type(url, 'https://newlink.com')
    await user.type(desc, 'New description')

    const submit = screen.getByRole('button', { name: /hinzufügen/i })
    await user.click(submit)

    expect(addLink).toHaveBeenCalledWith({
      title: 'New Link',
      url: 'https://newlink.com',
      description: 'New description',
      isActive: true,
      order: 1
    })
    expect(appStoreMock.addNotification).toHaveBeenCalledWith('Link erfolgreich hinzugefügt!', 'success')
  })

  it.skip('shows error notification when addLink fails', async () => {
    const user = userEvent.setup()
    const addLink = vi.fn().mockRejectedValue(new Error('fail'))
    await renderDashboard({ userLinks: [], addLink })

    const actionsAddBtn = screen.getAllByRole('button').find((b) => /link hinzufügen/i.test(b.textContent || ''))!
    await user.click(actionsAddBtn)

    const submit = screen.getByRole('button', { name: /hinzufügen/i })
    await user.click(submit)

    expect(appStoreMock.addNotification).toHaveBeenCalledWith('Fehler beim Hinzufügen des Links', 'error')
  })

  it.skip('opens edit dialog and submits to call updateLink', async () => {
    const user = userEvent.setup()
    const updateLink = vi.fn().mockResolvedValue(undefined)
    await renderDashboard({
      updateLink,
      activeLinks: [
        { id: '1', title: 'Old', url: 'https://example.com', description: 'Test', isActive: true, order: 1 }
      ]
    })

    const editBtn = screen.getAllByRole('button').find((b) => (b.getAttribute('aria-label') || '').includes('mdi-pencil'))
    expect(editBtn).toBeTruthy()
    await user.click(editBtn as HTMLElement)

    expect(screen.getByText('Link bearbeiten')).toBeTruthy()
    const title = screen.getByRole('textbox', { name: 'Titel' }) as HTMLInputElement
    await user.clear(title)
    await user.type(title, 'Updated Link')

    const save = screen.getByRole('button', { name: /speichern/i })
    await user.click(save)

    expect(updateLink).toHaveBeenCalledWith('1', {
      title: 'Updated Link',
      url: 'https://example.com',
      description: 'Test'
    })
    expect(appStoreMock.addNotification).toHaveBeenCalledWith('Link erfolgreich aktualisiert!', 'success')
  })

  it.skip('shows error notification when updateLink fails', async () => {
    const user = userEvent.setup()
    const updateLink = vi.fn().mockRejectedValue(new Error('fail'))
    await renderDashboard({
      updateLink,
      activeLinks: [
        { id: '1', title: 'Old', url: 'https://example.com', description: 'Test', isActive: true, order: 1 }
      ]
    })

    const editBtn = screen.getAllByRole('button').find((b) => (b.getAttribute('aria-label') || '').includes('mdi-pencil'))
    await user.click(editBtn as HTMLElement)
    const save = screen.getByRole('button', { name: /speichern/i })
    await user.click(save)

    expect(appStoreMock.addNotification).toHaveBeenCalledWith('Fehler beim Aktualisieren des Links', 'error')
  })

  it.skip('deleteLink is called after confirmation', async () => {
    const user = userEvent.setup()
    const deleteLink = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('confirm', vi.fn(() => true))
    await renderDashboard({ deleteLink, activeLinks: [ { id: '1', title: 'One', url: 'https://example.com', description: 'd', isActive: true, order: 1 } ] })

    const delBtn = screen.getAllByRole('button').find((b) => (b.getAttribute('aria-label') || '').includes('mdi-delete'))
    expect(delBtn).toBeTruthy()
    await user.click(delBtn as HTMLElement)

    expect(global.confirm).toHaveBeenCalledWith('Link wirklich löschen?')
    expect(deleteLink).toHaveBeenCalledWith('1')
    expect(appStoreMock.addNotification).toHaveBeenCalledWith('Link gelöscht!', 'success')
  })

  it.skip('does not call deleteLink when confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const deleteLink = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('confirm', vi.fn(() => false))
    await renderDashboard({ deleteLink, activeLinks: [ { id: '1', title: 'One', url: 'https://example.com', description: 'd', isActive: true, order: 1 } ] })

    const delBtn = screen.getAllByRole('button').find((b) => (b.getAttribute('aria-label') || '').includes('mdi-delete'))
    await user.click(delBtn as HTMLElement)
    expect(global.confirm).toHaveBeenCalledWith('Link wirklich löschen?')
    expect(deleteLink).not.toHaveBeenCalled()
  })

  it.skip('shows error notification when deleteLink fails after confirm', async () => {
    const user = userEvent.setup()
    const deleteLink = vi.fn().mockRejectedValue(new Error('fail'))
    vi.stubGlobal('confirm', vi.fn(() => true))
    await renderDashboard({ deleteLink, activeLinks: [ { id: '1', title: 'One', url: 'https://example.com', description: 'd', isActive: true, order: 1 } ] })

    const delBtn = screen.getAllByRole('button').find((b) => (b.getAttribute('aria-label') || '').includes('mdi-delete'))
    await user.click(delBtn as HTMLElement)

    expect(appStoreMock.addNotification).toHaveBeenCalledWith('Fehler beim Löschen des Links', 'error')
  })

  it.skip('list item click opens link in new tab', async () => {
    const openSpy = vi.fn()
    Object.defineProperty(window, 'open', { value: openSpy, writable: true })

    await renderDashboard({
      activeLinks: [ { id: '1', title: 'Website', url: 'https://example.com', description: 'Desc', isActive: true, order: 1 } ]
    })

    const list = screen.getByTestId('v-list')
    const item = within(list).getByTestId('v-list-item')
    await userEvent.click(item)
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer')
  })

  it.skip('logout button triggers userStore.logout and navigates home', async () => {
    const user = userEvent.setup()
    const logout = vi.fn()
    await renderDashboard({ logout })

    const logoutBtn = screen.getAllByRole('button').find((b) => /abmelden/i.test(b.textContent || ''))!
    await user.click(logoutBtn)

    expect(logout).toHaveBeenCalled()
    expect(appStoreMock.addNotification).toHaveBeenCalledWith('Erfolgreich abgemeldet', 'success')
    expect((mockedNavigateTo as any)).toHaveBeenCalledWith('/')
  })

  it.skip('opens profile dialog and submits updateProfile with only filled fields', async () => {
    const user = userEvent.setup()
    const updateProfile = vi.fn().mockResolvedValue(undefined)
    await renderDashboard({ updateProfile })

    const profileBtn = screen.getAllByRole('button').find((b) => /profil bearbeiten/i.test(b.textContent || ''))!
    await user.click(profileBtn)

    const username = screen.getByRole('textbox', { name: 'Username' }) as HTMLInputElement
    const name = screen.getByRole('textbox', { name: 'Name (optional)' }) as HTMLInputElement
    const bio = screen.getByRole('textbox', { name: 'Bio (optional)' }) as HTMLTextAreaElement
    const avatar = screen.getByRole('textbox', { name: 'Avatar URL (optional)' }) as HTMLInputElement
    const currentPwd = screen.getByLabelText('Aktuelles Passwort') as HTMLInputElement
    const newPwd = screen.getByLabelText('Neues Passwort') as HTMLInputElement

    await user.clear(username); await user.type(username, 'newuser')
    await user.clear(name); await user.type(name, 'New Name')
    await user.type(bio, 'About me')
    await user.type(avatar, 'https://img')
    await user.type(currentPwd, 'oldpass')
    await user.type(newPwd, 'newpass')

    const save = screen.getByRole('button', { name: /speichern/i })
    await user.click(save)

    expect(updateProfile).toHaveBeenCalledWith({
      username: 'newuser',
      name: 'New Name',
      bio: 'About me',
      avatar: 'https://img',
      currentPassword: 'oldpass',
      newPassword: 'newpass'
    })
    expect(appStoreMock.addNotification).toHaveBeenCalledWith('Profil erfolgreich aktualisiert!', 'success')
  })

  it.skip('shows error notification when updateProfile fails', async () => {
    const user = userEvent.setup()
    const updateProfile = vi.fn().mockRejectedValue(new Error('boom'))
    await renderDashboard({ updateProfile })

    const profileBtn = screen.getAllByRole('button').find((b) => /profil bearbeiten/i.test(b.textContent || ''))!
    await user.click(profileBtn)

    const save = screen.getByRole('button', { name: /speichern/i })
    await user.click(save)

    expect(appStoreMock.addNotification).toHaveBeenCalledWith('Fehler beim Aktualisieren des Profils', 'error')
  })

  it.skip('falls back to icon avatar and hides empty name', async () => {
    await renderDashboard({ currentUser: { username: 'testuser', name: '', avatar: '' } })
    expect(screen.getByText('mdi-account')).toBeTruthy()
    expect(screen.queryByText('Test User')).toBeNull()
  })
})
