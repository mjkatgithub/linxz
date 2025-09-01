import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from '~/stores/user'
import { useAppStore } from '~/stores/app'

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

// Mock navigateTo
const navigateToSpy = vi.fn()
vi.stubGlobal('navigateTo', navigateToSpy)

// Einfache Login-Komponente für Tests
const LoginComponent = {
  template: `
    <div class="login-page">
      <h2>Login</h2>
      
      <div v-if="userStore.error" class="error-alert">
        {{ userStore.error }}
        <button @click="userStore.error = null">×</button>
      </div>
      
      <form @submit.prevent="handleLogin">
        <input 
          v-model="form.email" 
          type="email" 
          placeholder="E-Mail" 
          required 
        />
        <input 
          v-model="form.password" 
          type="password" 
          placeholder="Passwort" 
          required 
        />
        <button 
          type="submit" 
          :disabled="userStore.isLoading"
        >
          Login
        </button>
      </form>
      
      <a href="/signup">Noch keinen Account? Jetzt registrieren</a>
    </div>
  `,
  setup() {
    const userStore = useUserStore()
    const appStore = useAppStore()
    
    const form = ref({
      email: '',
      password: ''
    })
    
    async function handleLogin() {
      try {
        await userStore.login(form.value.email, form.value.password)
        appStore.addNotification('Erfolgreich angemeldet!', 'success')
        await navigateToSpy('/dashboard')
      } catch {
        appStore.addNotification('Login fehlgeschlagen', 'error')
      }
    }
    
    return {
      userStore,
      appStore,
      form,
      handleLogin
    }
  }
}

describe('Login Page', () => {
  let pinia: any
  let userStore: any
  let appStore: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    appStore = useAppStore()
    
    // Reset mocks
    vi.clearAllMocks()
    navigateToSpy.mockClear()
  })

  it('should render login form correctly', () => {
    const wrapper = mount(LoginComponent, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.exists()).to.be.true
    expect(wrapper.find('h2').text()).to.equal('Login')
    expect(wrapper.find('input[type="email"]').exists()).to.be.true
    expect(wrapper.find('input[type="password"]').exists()).to.be.true
    expect(wrapper.find('button[type="submit"]').exists()).to.be.true
  })

  it('should show error message when userStore has error', () => {
    // Set error in store
    userStore.error = 'Login fehlgeschlagen'

    const wrapper = mount(LoginComponent, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.find('.error-alert').exists()).to.be.true
    expect(wrapper.text()).to.include('Login fehlgeschlagen')
  })

  it('should hide error message when userStore has no error', () => {
    const wrapper = mount(LoginComponent, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.find('.error-alert').exists()).to.be.false
  })

  it('should show loading state on submit button when userStore is loading', () => {
    // Set loading state
    userStore.isLoading = true

    const wrapper = mount(LoginComponent, {
      global: {
        plugins: [pinia]
      }
    })

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).to.not.be.undefined
  })

  it('should have correct form fields', () => {
    const wrapper = mount(LoginComponent, {
      global: {
        plugins: [pinia]
      }
    })

    const emailField = wrapper.find('input[type="email"]')
    const passwordField = wrapper.find('input[type="password"]')

    expect(emailField.exists()).to.be.true
    expect(passwordField.exists()).to.be.true
    expect(emailField.attributes('required')).to.not.be.undefined
    expect(passwordField.attributes('required')).to.not.be.undefined
  })

  it('should have signup link', () => {
    const wrapper = mount(LoginComponent, {
      global: {
        plugins: [pinia]
      }
    })

    const signupLink = wrapper.find('a[href="/signup"]')
    expect(signupLink.exists()).to.be.true
    expect(signupLink.text()).to.include('Noch keinen Account? Jetzt registrieren')
  })

  it('should update form data when user types', async () => {
    const wrapper = mount(LoginComponent, {
      global: {
        plugins: [pinia]
      }
    })

    const emailField = wrapper.find('input[type="email"]')
    const passwordField = wrapper.find('input[type="password"]')

    // Simuliere Eingabe
    await emailField.setValue('test@example.com')
    await passwordField.setValue('password123')

    // Prüfe ob die Werte korrekt gesetzt wurden
    expect((emailField.element as HTMLInputElement).value).to.equal('test@example.com')
    expect((passwordField.element as HTMLInputElement).value).to.equal('password123')
  })

  it('should call userStore.login when form is submitted', async () => {
    const loginSpy = vi.spyOn(userStore, 'login').mockResolvedValue(undefined)

    const wrapper = mount(LoginComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Setze Form-Daten über die Input-Felder
    const emailField = wrapper.find('input[type="email"]')
    const passwordField = wrapper.find('input[type="password"]')
    
    await emailField.setValue('test@example.com')
    await passwordField.setValue('password123')

    // Simuliere Form-Submit
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(loginSpy).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('should handle login success', async () => {
    const wrapper = mount(LoginComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Mock erfolgreichen Login
    vi.spyOn(userStore, 'login').mockResolvedValue(undefined)

    // Setze Form-Daten und submit
    const emailField = wrapper.find('input[type="email"]')
    const passwordField = wrapper.find('input[type="password"]')
    
    await emailField.setValue('test@example.com')
    await passwordField.setValue('password123')
    
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    // Warte auf async operation
    await wrapper.vm.$nextTick()

    // Prüfe ob Navigation stattfindet
    expect(navigateToSpy).toHaveBeenCalledWith('/dashboard')
  })

  it('should handle login error', async () => {
    const wrapper = mount(LoginComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Mock fehlgeschlagenen Login
    const loginError = new Error('Invalid credentials')
    const loginSpy = vi.spyOn(userStore, 'login').mockRejectedValue(loginError)

    // Setze Form-Daten und submit
    const emailField = wrapper.find('input[type="email"]')
    const passwordField = wrapper.find('input[type="password"]')
    
    await emailField.setValue('wrong@example.com')
    await passwordField.setValue('wrongpassword')
    
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    // Warte auf async operation
    await wrapper.vm.$nextTick()

    // Prüfe ob Login-Aufruf stattgefunden hat
    expect(loginSpy).toHaveBeenCalledWith('wrong@example.com', 'wrongpassword')
  })

  it('should clear error when error alert is closed', async () => {
    // Set initial error
    userStore.error = 'Test error'

    const wrapper = mount(LoginComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Finde und klicke auf close button
    const closeButton = wrapper.find('.error-alert button')
    await closeButton.trigger('click')

    expect(userStore.error).to.be.null
  })

  it('should have correct accessibility attributes', () => {
    const wrapper = mount(LoginComponent, {
      global: {
        plugins: [pinia]
      }
    })

    const emailField = wrapper.find('input[type="email"]')
    const passwordField = wrapper.find('input[type="password"]')
    const submitButton = wrapper.find('button[type="submit"]')

    expect(emailField.attributes('required')).to.not.be.undefined
    expect(passwordField.attributes('required')).to.not.be.undefined
    expect(submitButton.attributes('type')).to.equal('submit')
  })
})
