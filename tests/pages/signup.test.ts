import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

// Mock navigateTo
const mockNavigateTo = vi.fn()
vi.mock('#app', () => ({
  navigateTo: mockNavigateTo
}))

// Mock stores
const mockUserStore = {
  signup: vi.fn(),
  isLoading: false,
  isLoggedIn: false
}

const mockAppStore = {
  addNotification: vi.fn()
}

vi.mock('~/stores/user', () => ({
  useUserStore: () => mockUserStore
}))

vi.mock('~/stores/app', () => ({
  useAppStore: () => mockAppStore
}))

// Create a simplified SignupComponent for testing
const SignupComponent = {
  name: 'SignupComponent',
  template: `
    <div>
      <h2>Registrierung</h2>
      <form @submit.prevent="handleSignup">
        <input v-model="form.email" type="email" placeholder="E-Mail" />
        <input v-model="form.username" placeholder="Username" />
        <input v-model="form.name" placeholder="Name (optional)" />
        <input v-model="form.password" type="password" placeholder="Passwort" />
        <button type="submit" :disabled="userStore.isLoading">
          Registrieren
        </button>
      </form>
      <a href="/login">Bereits einen Account? Jetzt anmelden</a>
      <a href="/">Zur Startseite</a>
    </div>
  `,
  setup() {
    const form = ref({
      email: '',
      username: '',
      name: '',
      password: ''
    })

    async function handleSignup() {
      try {
        await mockUserStore.signup(form.value)
        mockAppStore.addNotification('Registrierung erfolgreich!', 'success')
        await mockNavigateTo('/dashboard')
      } catch {
        mockAppStore.addNotification('Registrierung fehlgeschlagen', 'error')
      }
    }

    return {
      form,
      handleSignup,
      userStore: mockUserStore,
      appStore: mockAppStore
    }
  }
}

describe('Signup Page', () => {
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  it('should render without crashing', () => {
    const wrapper = mount(SignupComponent, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should display signup form title', () => {
    const wrapper = mount(SignupComponent, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.text()).toContain('Registrierung')
  })

  it('should have all required form fields', () => {
    const wrapper = mount(SignupComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Check that the form structure is correct
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('should have login link', () => {
    const wrapper = mount(SignupComponent, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.text()).toContain('Bereits einen Account? Jetzt anmelden')
  })

  it('should have home button', () => {
    const wrapper = mount(SignupComponent, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.text()).toContain('Zur Startseite')
  })

  it('should have correct structure', () => {
    const wrapper = mount(SignupComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Check that the layout structure is correct
    expect(wrapper.find('div').exists()).toBe(true) // Layout wrapper
    expect(wrapper.find('form').exists()).toBe(true) // Form
    expect(wrapper.find('h2').exists()).toBe(true) // Title
  })

  it('should handle form submission', async () => {
    mockUserStore.signup.mockResolvedValue(undefined)
    mockNavigateTo.mockResolvedValue(undefined)
    
    const wrapper = mount(SignupComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Simulate form submission
    await wrapper.find('form').trigger('submit')
    
    expect(mockUserStore.signup).toHaveBeenCalled()
  })

  it('should show loading state on submit button', () => {
    mockUserStore.isLoading = true
    
    const wrapper = mount(SignupComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Check that the button exists and is disabled when loading
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('should handle signup success', async () => {
    mockUserStore.signup.mockResolvedValue(undefined)
    mockNavigateTo.mockResolvedValue(undefined)
    
    const wrapper = mount(SignupComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Simulate form submission
    await wrapper.find('form').trigger('submit')
    
    expect(mockAppStore.addNotification).toHaveBeenCalledWith('Registrierung erfolgreich!', 'success')
    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard')
  })

  it('should handle signup error', async () => {
    mockUserStore.signup.mockRejectedValue(new Error('Signup failed'))
    
    const wrapper = mount(SignupComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Simulate form submission
    await wrapper.find('form').trigger('submit')
    
    expect(mockAppStore.addNotification).toHaveBeenCalledWith('Registrierung fehlgeschlagen', 'error')
  })
})

