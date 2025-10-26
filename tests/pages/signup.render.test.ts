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
import SignupPage from '@/pages/signup.vue'

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
        default: () => h(SignupPage as any),
        fallback: () => h('div', { 'data-testid': 'fallback' }, 'fallback')
      })
  }
})

// Helper to initialize store mocks per test
const setupStores = (overrides: Partial<any> = {}) => {
  userStoreMock = reactive({
    isLoading: false,
    isLoggedIn: false,
    signup: vi.fn().mockResolvedValue(undefined),
    ...overrides
  })
  appStoreMock = {
    addNotification: vi.fn()
  }
}

const renderPage = async () => {
  const utils = render(SuspendedWrapper as any, {
    global: {
      // Let #app's NuxtLayout from tests/setup.ts provide the layout wrapper
      stubs,
      components: stubs as any,
      config: {
        renderStubDefaultSlot: true,
        compilerOptions: { isCustomElement: (tag: string) => false }
      } as any
    }
  })
  return utils
}

describe('pages/signup.vue (render + interactions)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupStores()
  })

  it('renders form and structure correctly', async () => {
    await renderPage()

    // Heading
    expect(await screen.findByRole('heading', { name: /registrierung/i })).toBeTruthy()

    // Fields
    const email = (await screen.findByLabelText(/e-mail/i)) as HTMLInputElement
    const username = (await screen.findByLabelText(/username/i)) as HTMLInputElement
    const name = (await screen.findByLabelText(/name \(optional\)/i)) as HTMLInputElement
    const password = (await screen.findByLabelText(/passwort/i)) as HTMLInputElement
    expect(email).toBeTruthy()
    expect(username).toBeTruthy()
    expect(name).toBeTruthy()
    expect(password).toBeTruthy()
    expect(email.getAttribute('type')).toBe('email')
    expect(password.getAttribute('type')).toBe('password')

    // Submit button
    expect(await screen.findByRole('button', { name: /registrieren/i })).toBeTruthy()

    // Login link (NuxtLink -> <a href="/login">)
    const loginLink = (await screen.findByRole('link', { name: /jetzt anmelden/i })) as HTMLAnchorElement
    expect(loginLink.getAttribute('href')).toBe('/login')

    // Back home button (v-btn with to="/")
    const homeBtn = await screen.findByRole('button', { name: /zur startseite/i })
    expect(homeBtn.getAttribute('data-to')).toBe('/')
  })

  it('submits and navigates on successful signup', async () => {
    const signupSpy = vi.fn().mockResolvedValue(undefined)
    setupStores({ signup: signupSpy })
    await renderPage()

    const user = userEvent.setup()
    const email = (await screen.findByLabelText(/e-mail/i)) as HTMLInputElement
    const username = (await screen.findByLabelText(/username/i)) as HTMLInputElement
    const name = (await screen.findByLabelText(/name \(optional\)/i)) as HTMLInputElement
    const password = (await screen.findByLabelText(/passwort/i)) as HTMLInputElement
    const submit = await screen.findByRole('button', { name: /registrieren/i })

    await user.type(email, 'test@example.com')
    await user.type(username, 'tester')
    await user.type(name, 'Test Name')
    await user.type(password, 'secret')
    await user.click(submit)

    expect(signupSpy).toHaveBeenCalledWith({
      email: 'test@example.com',
      username: 'tester',
      name: 'Test Name',
      password: 'secret'
    })
    expect(appStoreMock.addNotification).toHaveBeenCalledWith('Registrierung erfolgreich!', 'success')
    expect((mockedNavigateTo as any)).toHaveBeenCalledWith('/dashboard')
  })

  it('shows error notification on failed signup', async () => {
    const signupSpy = vi.fn().mockRejectedValue(new Error('fail'))
    setupStores({ signup: signupSpy })
    await renderPage()

    const user = userEvent.setup()
    const email = (await screen.findByLabelText(/e-mail/i)) as HTMLInputElement
    const username = (await screen.findByLabelText(/username/i)) as HTMLInputElement
    const name = (await screen.findByLabelText(/name \(optional\)/i)) as HTMLInputElement
    const password = (await screen.findByLabelText(/passwort/i)) as HTMLInputElement
    const submit = await screen.findByRole('button', { name: /registrieren/i })

    await user.type(email, 'wrong@example.com')
    await user.type(username, 'wrong')
    await user.type(name, 'X')
    await user.type(password, 'nope')
    await user.click(submit)

    expect(signupSpy).toHaveBeenCalledWith({
      email: 'wrong@example.com',
      username: 'wrong',
      name: 'X',
      password: 'nope'
    })
    expect(appStoreMock.addNotification).toHaveBeenCalledWith('Registrierung fehlgeschlagen', 'error')
  })

  it('redirects to dashboard when already logged in', async () => {
    setupStores({ isLoggedIn: true })
    await renderPage()

    expect((mockedNavigateTo as any)).toHaveBeenCalledWith('/dashboard')
  })

  it('reflects loading state on submit button', async () => {
    setupStores({ isLoading: true })
    await renderPage()

    const submit = await screen.findByRole('button', { name: /registrieren/i })
    expect(submit.getAttribute('aria-busy')).toBe('true')
  })
})
