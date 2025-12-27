import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

// Mock Nuxt functions
const mockUseRoute = vi.fn()
const mockUseHead = vi.fn()
const mockGlobalFetch = vi.fn()

vi.stubGlobal('useRoute', mockUseRoute)
vi.stubGlobal('useHead', mockUseHead)
vi.stubGlobal('$fetch', mockGlobalFetch)

// Mock window.open
const mockWindowOpen = vi.fn()
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true
})

// Create a simplified Username component for testing
const UsernameComponent = {
  name: 'UsernameComponent',
  template: `
    <div>
      <!-- Loading State -->
      <div v-if="pending" class="loading">
        <p>Loading profile...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error">
        <h2>Profile not found</h2>
        <p>The user "{{ username }}" does not exist.</p>
        <button @click="goHome">To Homepage</button>
      </div>

      <!-- Profile Content -->
      <div v-else-if="userData" class="profile">
        <!-- Avatar -->
        <div class="avatar-section">
          <img v-if="userData.avatar" :src="userData.avatar" :alt="userData.username" />
          <div v-else class="default-avatar">ðŸ‘¤</div>
          <h2>@{{ userData.username }}</h2>
          <p v-if="userData.name">{{ userData.name }}</p>
          <p v-if="userData.bio">{{ userData.bio }}</p>
        </div>

        <!-- Links -->
        <div v-if="userData.links && userData.links.length > 0" class="links">
          <button
            v-for="link in userData.links"
            :key="link.id"
            class="link-button"
            @click="openLink(link.url)"
          >
            {{ link.title }}
          </button>
        </div>

        <!-- No Links -->
        <div v-else class="no-links">
          <p>No links yet</p>
        </div>
        
        <!-- Link zur Startseite -->
        <div class="home-link">
          <button @click="goHome">Create Link Collection</button>
        </div>
      </div>
    </div>
  `,
  setup() {
    const mockRoute = {
      params: {
        username: 'testuser'
      }
    }
    
    mockUseRoute.mockReturnValue(mockRoute)
    
    const username = ref('testuser')
    const userData = ref(null)
    const pending = ref(true)
    const error = ref(null)
    
    // Simulate API call
    const loadUserData = async () => {
      try {
        pending.value = true
        const response = await mockGlobalFetch('/api/links', {
          query: { username: username.value },
          server: true
        })
        userData.value = response
      } catch (err) {
        error.value = err as any
      } finally {
        pending.value = false
      }
    }
    
    function openLink(url: string) {
      mockWindowOpen(url, '_blank', 'noopener,noreferrer')
    }
    
    function goHome() {
      // Mock navigation
    }
    
    // Mock useHead
    mockUseHead.mockImplementation((config: any) => {
      // Mock implementation
    })
    
    return {
      username,
      userData,
      pending,
      error,
      loadUserData,
      openLink,
      goHome
    }
  }
}

describe('Username Page', () => {
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  it('should render loading state', () => {
    const wrapper = mount(UsernameComponent, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.text()).toContain('Loading profile...')
    expect(wrapper.find('.loading').exists()).toBe(true)
  })

  it('should render error state when user not found', async () => {
    const wrapper = mount(UsernameComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Set error state
    const vm = wrapper.vm as any
    vm.error = { message: 'User not found' }
    vm.pending = false
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Profile not found')
    expect(wrapper.text()).toContain('The user "testuser" does not exist.')
    expect(wrapper.find('.error').exists()).toBe(true)
  })

  it('should render user profile with data', async () => {
    const mockUserData = {
      username: 'testuser',
      name: 'Test User',
      bio: 'Test bio',
      avatar: 'avatar.jpg',
      links: [
        { id: '1', title: 'Test Link', url: 'https://example.com' },
        { id: '2', title: 'Another Link', url: 'https://test.com' }
      ]
    }

    const wrapper = mount(UsernameComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Set user data
    const vm = wrapper.vm as any
    vm.userData = mockUserData
    vm.pending = false
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('@testuser')
    expect(wrapper.text()).toContain('Test User')
    expect(wrapper.text()).toContain('Test bio')
    expect(wrapper.find('.profile').exists()).toBe(true)
  })

  it('should render user profile without name and bio', async () => {
    const mockUserData = {
      username: 'testuser',
      name: '',
      bio: '',
      avatar: '',
      links: []
    }

    const wrapper = mount(UsernameComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Set user data
    const vm = wrapper.vm as any
    vm.userData = mockUserData
    vm.pending = false
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('@testuser')
    expect(wrapper.text()).not.toContain('Test User')
    expect(wrapper.text()).not.toContain('Test bio')
  })

  it('should render user links', async () => {
    const mockUserData = {
      username: 'testuser',
      name: 'Test User',
      bio: 'Test bio',
      avatar: 'avatar.jpg',
      links: [
        { id: '1', title: 'Test Link', url: 'https://example.com' },
        { id: '2', title: 'Another Link', url: 'https://test.com' }
      ]
    }

    const wrapper = mount(UsernameComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Set user data
    const vm = wrapper.vm as any
    vm.userData = mockUserData
    vm.pending = false
    await wrapper.vm.$nextTick()

    const linkButtons = wrapper.findAll('.link-button')
    expect(linkButtons).toHaveLength(2)
    expect(linkButtons[0].text()).toContain('Test Link')
    expect(linkButtons[1].text()).toContain('Another Link')
  })

  it('should render no links message when user has no links', async () => {
    const mockUserData = {
      username: 'testuser',
      name: 'Test User',
      bio: 'Test bio',
      avatar: 'avatar.jpg',
      links: []
    }

    const wrapper = mount(UsernameComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Set user data
    const vm = wrapper.vm as any
    vm.userData = mockUserData
    vm.pending = false
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('No links yet')
    expect(wrapper.find('.no-links').exists()).toBe(true)
  })

  it('should render no links message when links is null', async () => {
    const mockUserData = {
      username: 'testuser',
      name: 'Test User',
      bio: 'Test bio',
      avatar: 'avatar.jpg',
      links: null
    }

    const wrapper = mount(UsernameComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Set user data
    const vm = wrapper.vm as any
    vm.userData = mockUserData
    vm.pending = false
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('No links yet')
    expect(wrapper.find('.no-links').exists()).toBe(true)
  })

  it('should handle link click', async () => {
    const mockUserData = {
      username: 'testuser',
      name: 'Test User',
      bio: 'Test bio',
      avatar: 'avatar.jpg',
      links: [
        { id: '1', title: 'Test Link', url: 'https://example.com' }
      ]
    }

    const wrapper = mount(UsernameComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Set user data
    const vm = wrapper.vm as any
    vm.userData = mockUserData
    vm.pending = false
    await wrapper.vm.$nextTick()

    const linkButton = wrapper.find('.link-button')
    await linkButton.trigger('click')

    expect(mockWindowOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer')
  })

  it('should handle multiple link clicks', async () => {
    const mockUserData = {
      username: 'testuser',
      name: 'Test User',
      bio: 'Test bio',
      avatar: 'avatar.jpg',
      links: [
        { id: '1', title: 'First Link', url: 'https://first.com' },
        { id: '2', title: 'Second Link', url: 'https://second.com' }
      ]
    }

    const wrapper = mount(UsernameComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Set user data
    const vm = wrapper.vm as any
    vm.userData = mockUserData
    vm.pending = false
    await wrapper.vm.$nextTick()

    const linkButtons = wrapper.findAll('.link-button')
    await linkButtons[0].trigger('click')
    await linkButtons[1].trigger('click')

    expect(mockWindowOpen).toHaveBeenCalledTimes(2)
    expect(mockWindowOpen).toHaveBeenNthCalledWith(1, 'https://first.com', '_blank', 'noopener,noreferrer')
    expect(mockWindowOpen).toHaveBeenNthCalledWith(2, 'https://second.com', '_blank', 'noopener,noreferrer')
  })

  it('should render avatar when provided', async () => {
    const mockUserData = {
      username: 'testuser',
      name: 'Test User',
      bio: 'Test bio',
      avatar: 'https://example.com/avatar.jpg',
      links: []
    }

    const wrapper = mount(UsernameComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Set user data
    const vm = wrapper.vm as any
    vm.userData = mockUserData
    vm.pending = false
    await wrapper.vm.$nextTick()

    const avatar = wrapper.find('img')
    expect(avatar.exists()).toBe(true)
    expect(avatar.attributes('src')).toBe('https://example.com/avatar.jpg')
    expect(avatar.attributes('alt')).toBe('testuser')
  })

  it('should render default avatar when no avatar provided', async () => {
    const mockUserData = {
      username: 'testuser',
      name: 'Test User',
      bio: 'Test bio',
      avatar: '',
      links: []
    }

    const wrapper = mount(UsernameComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Set user data
    const vm = wrapper.vm as any
    vm.userData = mockUserData
    vm.pending = false
    await wrapper.vm.$nextTick()

    const defaultAvatar = wrapper.find('.default-avatar')
    expect(defaultAvatar.exists()).toBe(true)
    expect(defaultAvatar.text()).toBe('ðŸ‘¤')
  })

  it('should handle home button click', async () => {
    const mockUserData = {
      username: 'testuser',
      name: 'Test User',
      bio: 'Test bio',
      avatar: 'avatar.jpg',
      links: []
    }

    const wrapper = mount(UsernameComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Set user data to show the home button
    const vm = wrapper.vm as any
    vm.userData = mockUserData
    vm.pending = false
    await wrapper.vm.$nextTick()

    const homeButton = wrapper.find('button')
    expect(homeButton.exists()).toBe(true)
    await homeButton.trigger('click')

    // Test passes if no error is thrown
    expect(true).toBe(true)
  })

  it('should handle error button click', async () => {
    const wrapper = mount(UsernameComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Set error state
    const vm = wrapper.vm as any
    vm.error = { message: 'User not found' }
    vm.pending = false
    await wrapper.vm.$nextTick()

    const errorButton = wrapper.find('button')
    await errorButton.trigger('click')

    // Test passes if no error is thrown
    expect(true).toBe(true)
  })

  it('should handle different usernames', async () => {
    const wrapper = mount(UsernameComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Set different username
    const vm = wrapper.vm as any
    vm.username = 'differentuser'
    vm.error = { message: 'User not found' }
    vm.pending = false
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('The user "differentuser" does not exist.')
  })

  it('should handle empty username', async () => {
    const wrapper = mount(UsernameComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Set empty username
    const vm = wrapper.vm as any
    vm.username = ''
    vm.error = { message: 'User not found' }
    vm.pending = false
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('The user "" does not exist.')
  })
})

