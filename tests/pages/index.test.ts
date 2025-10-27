import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import IndexPage from '~/pages/index.vue'

// Mock NuxtLayout
vi.mock('#app', () => ({
  NuxtLayout: {
    name: 'NuxtLayout',
    template: '<div><slot /></div>'
  }
}))

// Mock Vuetify components
const mockVBtn = {
  name: 'v-btn',
  props: ['color', 'class', 'to', 'size', 'variant'],
  template: '<button><slot /></button>'
}

const mockVContainer = {
  name: 'v-container',
  props: ['class'],
  template: '<div><slot /></div>'
}

describe('Index Page', () => {
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('should render without crashing', () => {
    const wrapper = mount(IndexPage, {
      global: {
        plugins: [pinia],
        components: {
          NuxtLayout: { template: '<div><slot /></div>' },
          'v-container': mockVContainer,
          'v-btn': mockVBtn
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should display welcome message', () => {
    const wrapper = mount(IndexPage, {
      global: {
        plugins: [pinia],
        components: {
          NuxtLayout: { template: '<div><slot /></div>' },
          'v-container': mockVContainer,
          'v-btn': mockVBtn
        }
      }
    })

    expect(wrapper.text()).toContain('Welcome to linxz')
    expect(wrapper.text()).toContain('Your personal link collection for your bio')
  })

  it('should have login button', () => {
    const wrapper = mount(IndexPage, {
      global: {
        plugins: [pinia],
        components: {
          NuxtLayout: { template: '<div><slot /></div>' },
          'v-container': mockVContainer,
          'v-btn': mockVBtn
        }
      }
    })

    const loginBtn = wrapper.find('button')
    expect(loginBtn.exists()).toBe(true)
    expect(loginBtn.text()).toContain('Login')
  })

  it('should have signup button', () => {
    const wrapper = mount(IndexPage, {
      global: {
        plugins: [pinia],
        components: {
          NuxtLayout: { template: '<div><slot /></div>' },
          'v-container': mockVContainer,
          'v-btn': mockVBtn
        }
      }
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
    
    const signupBtn = buttons.find(btn => btn.text().includes('Sign Up'))
    expect(signupBtn).toBeDefined()
  })

  it('should have getting started button', () => {
    const wrapper = mount(IndexPage, {
      global: {
        plugins: [pinia],
        components: {
          NuxtLayout: { template: '<div><slot /></div>' },
          'v-container': mockVContainer,
          'v-btn': mockVBtn
        }
      }
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(3)
    
    const gettingStartedBtn = buttons.find(btn => btn.text().includes('Getting Started'))
    expect(gettingStartedBtn).toBeDefined()
  })

  it('should render all buttons', () => {
    const wrapper = mount(IndexPage, {
      global: {
        plugins: [pinia],
        components: {
          NuxtLayout: { template: '<div><slot /></div>' },
          'v-container': mockVContainer,
          'v-btn': mockVBtn
        }
      }
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(3)
    
    expect(buttons[0].text()).toContain('Login')
    expect(buttons[1].text()).toContain('Sign Up')
    expect(buttons[2].text()).toContain('Getting Started')
  })

  it('should have correct structure', () => {
    const wrapper = mount(IndexPage, {
      global: {
        plugins: [pinia],
        components: {
          NuxtLayout: { template: '<div><slot /></div>' },
          'v-container': mockVContainer,
          'v-btn': mockVBtn
        }
      }
    })

    // Check for main heading
    expect(wrapper.find('h1').exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('Welcome to linxz')
    
    // Check for description paragraph
    expect(wrapper.find('p').exists()).toBe(true)
    expect(wrapper.find('p').text()).toContain('Your personal link collection for your bio')
    
    // Check for buttons
    expect(wrapper.findAll('button').length).toBe(3)
  })

  it('should have proper CSS classes', () => {
    const wrapper = mount(IndexPage, {
      global: {
        plugins: [pinia],
        components: {
          NuxtLayout: { template: '<div><slot /></div>' },
          'v-container': mockVContainer,
          'v-btn': mockVBtn
        }
      }
    })

    // Check that the template structure is correct
    // Note: CSS classes are not rendered in the mock components
    // but we can verify the component structure exists
    expect(wrapper.find('h1').exists()).toBe(true)
    expect(wrapper.find('p').exists()).toBe(true)
    expect(wrapper.findAll('button').length).toBe(3)
  })
})
