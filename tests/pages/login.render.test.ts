import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { defineComponent, h, Suspense, reactive } from 'vue'

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

// SUT import after mocks are defined, so it uses our mocked stores
// eslint-disable-next-line import/first
import LoginPage from '@/pages/login.vue'

// Lightweight Vuetify + NuxtLink stubs
const stubs = {
  NuxtLayout: {
    name: 'NuxtLayout',
    template: '<div data-testid="nuxt-layout"><slot /></div>'
  },
  'v-container': { name: 'VContainer', template: '<div data-testid="v-container"><slot /></div>' },
  VContainer: { name: 'VContainer', template: '<div data-testid="v-container"><slot /></div>' },
  'v-card': { name: 'VCard', template: '<div data-testid="v-card"><slot /></div>' },
  VCard: { name: 'VCard', template: '<div data-testid="v-card"><slot /></div>' },
  'v-form': {
    name: 'VForm',
    emits: ['submit'],
    template: '<form @submit.prevent="$emit(\'submit\', $event)"><slot /></form>'
  },
  VForm: {
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
  VTextField: {
    name: 'VTextField',
    props: ['modelValue', 'label', 'type', 'required'],
    emits: ['update:modelValue'],
    template:
      '<label style="display:block"><span>{{ label }}</span><input :aria-label="label" :type="type || \'text\'" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /></label>'
  },
  'v-btn': {
    name: 'VBtn',
    inheritAttrs: false,
    props: ['to', 'type', 'loading', 'variant', 'color', 'size'],
    emits: ['click'],
    setup(props: any, { emit, slots, attrs }: any) {
      return () =>
        h(
          'button',
          {
            type: (props.type as any) || 'button',
            'data-testid': 'v-btn',
            'data-to': props.to || null,
            'aria-busy': props.loading ? 'true' : undefined,
            onClick: (e: Event) => emit('click', e),
            ...(attrs as any)
          },
          slots.default ? slots.default() : []
        )
    }
  },
  VBtn: {
    name: 'VBtn',
    inheritAttrs: false,
    props: ['to', 'type', 'loading', 'variant', 'color', 'size'],
    emits: ['click'],
    setup(props: any, { emit, slots, attrs }: any) {
      return () =>
        h(
          'button',
          {
            type: (props.type as any) || 'button',
            'data-testid': 'v-btn',
            'data-to': props.to || null,
            'aria-busy': props.loading ? 'true' : undefined,
            onClick: (e: Event) => emit('click', e),
            ...(attrs as any)
          },
          slots.default ? slots.default() : []
        )
    }
  },
  'v-alert': {
    name: 'VAlert',
    props: ['type', 'closable'],
    emits: ['click:close'],
    template:
      '<div role="alert" :data-type="type"><slot /><button aria-label="close" @click="$emit(\'click:close\')">x</button></div>'
  },
  VAlert: {
    name: 'VAlert',
    props: ['type', 'closable'],
    emits: ['click:close'],
    template:
      '<div role="alert" :data-type="type"><slot /><button aria-label="close" @click="$emit(\'click:close\')">x</button></div>'
  },
  NuxtLink: {
    name: 'NuxtLink',
    props: ['to'],
    template: '<a :href="to"><slot /></a>'
  }
}

// Suspense wrapper to resolve async setup (redirects)
const SuspendedWrapper = defineComponent({
  name: 'SuspendedWrapper',
  setup() {
    return () =>
      h(Suspense, null, {
        default: () => h(LoginPage as any),
        fallback: () => h('div', { 'data-testid': 'fallback' }, 'fallback')
      })
  }
})

const setupStores = (overrides: Partial<any> = {}) => {
  userStoreMock = reactive({
    error: null,
    isLoading: false,
    isLoggedIn: false,
    login: vi.fn().mockResolvedValue(undefined),
    ...overrides
  })
  appStoreMock = {
    addNotification: vi.fn()
  }
}

const renderPage = async () => {
  const utils = render(SuspendedWrapper as any, {
    global: {
      stubs,
      components: stubs as any,
      config: { renderStubDefaultSlot: true } as any
    }
  })
  return utils
}

describe('pages/login.vue (render + interactions)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupStores()
  })

  it('renders form and structure correctly', async () => {
    await renderPage()

    // Heading
    expect(await screen.findByRole('heading', { name: /login/i })).toBeTruthy()

    // Fields
    const email = (await screen.findByLabelText(/e-mail/i)) as HTMLInputElement
    const password = (await screen.findByLabelText(/passwort/i)) as HTMLInputElement
    expect(email).toBeTruthy()
    expect(password).toBeTruthy()
    expect(email.getAttribute('type')).toBe('email')
    expect(password.getAttribute('type')).toBe('password')

    // Submit button
    expect(await screen.findByRole('button', { name: /login/i })).toBeTruthy()

    // Signup link (NuxtLink -> <a href="/signup">)
    const signup = (await screen.findByRole('link', { name: /registrieren/i })) as HTMLAnchorElement
    expect(signup.getAttribute('href')).toBe('/signup')

    // Back home button (v-btn with to="/")
    const homeBtn = await screen.findByRole('button', { name: /to homepage/i })
    expect(homeBtn.getAttribute('data-to')).toBe('/')
  })

  it('submits and navigates on successful login', async () => {
    const loginSpy = vi.fn().mockResolvedValue(undefined)
    setupStores({ login: loginSpy })
    await renderPage()

    const user = userEvent.setup()
    const email = (await screen.findByLabelText(/e-mail/i)) as HTMLInputElement
    const password = (await screen.findByLabelText(/passwort/i)) as HTMLInputElement
    const submit = await screen.findByRole('button', { name: /login/i })

    await user.type(email, 'test@example.com')
    await user.type(password, 'secret')
    await user.click(submit)

    expect(loginSpy).toHaveBeenCalledWith('test@example.com', 'secret')
    expect(appStoreMock.addNotification).toHaveBeenCalledWith('Erfolgreich angemeldet!', 'success')
    expect((mockedNavigateTo as any)).toHaveBeenCalledWith('/dashboard')
  })

  it('shows error notification on failed login', async () => {
    const loginSpy = vi.fn().mockRejectedValue(new Error('fail'))
    setupStores({ login: loginSpy })
    await renderPage()

    const user = userEvent.setup()
    const email = (await screen.findByLabelText(/e-mail/i)) as HTMLInputElement
    const password = (await screen.findByLabelText(/passwort/i)) as HTMLInputElement
    const submit = await screen.findByRole('button', { name: /login/i })

    await user.type(email, 'wrong@example.com')
    await user.type(password, 'nope')
    await user.click(submit)

    expect(loginSpy).toHaveBeenCalledWith('wrong@example.com', 'nope')
    expect(appStoreMock.addNotification).toHaveBeenCalledWith('Login fehlgeschlagen', 'error')
  })

  it('renders error alert and closes it (sets store.error to null)', async () => {
    setupStores({ error: 'Login fehlgeschlagen' })
    await renderPage()

    // Alert visible with text
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(await screen.findByText('Login fehlgeschlagen')).toBeTruthy()

    const close = screen.getByRole('button', { name: /close/i })
    await userEvent.click(close)

    // userStore.error should be cleared and alert disappears
    expect(userStoreMock.error).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('redirects to dashboard when already logged in', async () => {
    setupStores({ isLoggedIn: true })
    await renderPage()

    expect((mockedNavigateTo as any)).toHaveBeenCalledWith('/dashboard')
  })

  it('reflects loading state on submit button', async () => {
    setupStores({ isLoading: true })
    await renderPage()

    const submit = await screen.findByRole('button', { name: /login/i })
    expect(submit.getAttribute('aria-busy')).toBe('true')
  })

})

