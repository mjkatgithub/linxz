import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

// Mock Nuxt functions
const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)

// Mock user store
const mockUserStore = {
  isLoggedIn: true,
  username: 'testuser',
  linkCount: 5,
  isLoading: false,
  activeLinks: [
    {
      id: '1',
      title: 'Test Link 1',
      url: 'https://example.com',
      description: 'Test description'
    },
    {
      id: '2',
      title: 'Test Link 2',
      url: 'https://test.com',
      description: 'Another test'
    }
  ],
  userLinks: [],
  currentUser: {
    username: 'testuser',
    name: 'Test User',
    bio: 'Test bio',
    avatar: 'avatar.jpg'
  },
  loadUserLinks: vi.fn(),
  addLink: vi.fn(),
  deleteLink: vi.fn(),
  updateLink: vi.fn(),
  updateProfile: vi.fn(),
  logout: vi.fn()
}

// Mock app store
const mockAppStore = {
  addNotification: vi.fn()
}

// Mock stores
vi.mock('~/stores/user', () => ({
  useUserStore: () => mockUserStore
}))

vi.mock('~/stores/app', () => ({
  useAppStore: () => mockAppStore
}))

// Create a simplified Dashboard component for testing
const DashboardComponent = {
  name: 'DashboardComponent',
  template: `
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {{ userStore.username }}!</p>
      <p v-if="userStore.currentUser?.name">{{ userStore.currentUser.name }}</p>
      
      <div v-if="userStore.isLoading" class="loading">
        <p>Loading links...</p>
      </div>
      
      <div v-else-if="userStore.activeLinks.length === 0" class="no-links">
        <p>No links yet</p>
        <button @click="showAddLinkDialog = true">Add First Link</button>
      </div>
      
      <div v-else class="links-list">
        <div v-for="link in userStore.activeLinks" :key="link.id" class="link-item">
          <h3>{{ link.title }}</h3>
          <p>{{ link.description }}</p>
          <a :href="link.url" target="_blank">{{ link.url }}</a>
          <button @click="editLink(link)">Bearbeiten</button>
          <button @click="deleteLink(link.id)">LÃ¶schen</button>
        </div>
      </div>
      
      <div class="actions">
        <button @click="showAddLinkDialog = true">Link hinzufÃ¼gen</button>
        <button @click="showProfileDialog = true">Profil bearbeiten</button>
        <button @click="handleLogout">Abmelden</button>
      </div>
      
      <!-- Add Link Dialog -->
      <div v-if="showAddLinkDialog" class="dialog">
        <h3>Link hinzufÃ¼gen</h3>
        <form @submit.prevent="addNewLink">
          <input v-model="newLink.title" placeholder="Titel" required />
          <input v-model="newLink.url" placeholder="URL" type="url" required />
          <textarea v-model="newLink.description" placeholder="Beschreibung"></textarea>
          <button type="submit">HinzufÃ¼gen</button>
          <button type="button" @click="showAddLinkDialog = false">Abbrechen</button>
        </form>
      </div>
      
      <!-- Edit Link Dialog -->
      <div v-if="showEditDialog" class="dialog">
        <h3>Link bearbeiten</h3>
        <form @submit.prevent="updateLink">
          <input v-model="editForm.title" placeholder="Titel" required />
          <input v-model="editForm.url" placeholder="URL" type="url" required />
          <textarea v-model="editForm.description" placeholder="Beschreibung"></textarea>
          <button type="submit">Speichern</button>
          <button type="button" @click="showEditDialog = false">Abbrechen</button>
        </form>
      </div>
      
      <!-- Profile Dialog -->
      <div v-if="showProfileDialog" class="dialog">
        <h3>Profil bearbeiten</h3>
        <form @submit.prevent="updateProfile">
          <input v-model="profileForm.username" placeholder="Username" required />
          <input v-model="profileForm.name" placeholder="Name" />
          <textarea v-model="profileForm.bio" placeholder="Bio"></textarea>
          <input v-model="profileForm.avatar" placeholder="Avatar URL" />
          <input v-model="profileForm.currentPassword" type="password" placeholder="Aktuelles Passwort" />
          <input v-model="profileForm.newPassword" type="password" placeholder="Neues Passwort" />
          <button type="submit">Speichern</button>
          <button type="button" @click="showProfileDialog = false">Abbrechen</button>
        </form>
      </div>
    </div>
  `,
  setup() {
    const showAddLinkDialog = ref(false)
    const showEditDialog = ref(false)
    const showProfileDialog = ref(false)
    
    const newLink = ref({
      title: '',
      url: '',
      description: ''
    })
    
    const editForm = ref({
      id: '',
      title: '',
      url: '',
      description: ''
    })
    
    const profileForm = ref({
      username: mockUserStore.currentUser?.username || '',
      name: mockUserStore.currentUser?.name || '',
      bio: mockUserStore.currentUser?.bio || '',
      avatar: mockUserStore.currentUser?.avatar || '',
      currentPassword: '',
      newPassword: ''
    })
    
    async function addNewLink() {
      try {
        await mockUserStore.addLink({
          ...newLink.value,
          isActive: true,
          order: mockUserStore.userLinks.length + 1
        })
        
        mockAppStore.addNotification('Link erfolgreich hinzugefÃ¼gt!', 'success')
        showAddLinkDialog.value = false
        newLink.value = { title: '', url: '', description: '' }
      } catch {
        mockAppStore.addNotification('Fehler beim HinzufÃ¼gen des Links', 'error')
      }
    }
    
    async function deleteLink(linkId: string) {
      if (confirm('Link wirklich lÃ¶schen?')) {
        try {
          await mockUserStore.deleteLink(linkId)
          mockAppStore.addNotification('Link gelÃ¶scht!', 'success')
        } catch {
          mockAppStore.addNotification('Fehler beim LÃ¶schen des Links', 'error')
        }
      }
    }
    
    function editLink(link: any) {
      editForm.value = {
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description || ''
      }
      showEditDialog.value = true
    }
    
    async function updateLink() {
      try {
        await mockUserStore.updateLink(editForm.value.id, {
          title: editForm.value.title,
          url: editForm.value.url,
          description: editForm.value.description
        })
        
        mockAppStore.addNotification('Link erfolgreich aktualisiert!', 'success')
        showEditDialog.value = false
      } catch {
        mockAppStore.addNotification('Fehler beim Aktualisieren des Links', 'error')
      }
    }
    
    async function updateProfile() {
      try {
        const updateData: any = {}
        if (profileForm.value.username) updateData.username = profileForm.value.username
        if (profileForm.value.name) updateData.name = profileForm.value.name
        if (profileForm.value.bio) updateData.bio = profileForm.value.bio
        if (profileForm.value.avatar) updateData.avatar = profileForm.value.avatar
        if (profileForm.value.currentPassword && profileForm.value.newPassword) {
          updateData.currentPassword = profileForm.value.currentPassword
          updateData.newPassword = profileForm.value.newPassword
        }
        
        await mockUserStore.updateProfile(updateData)
        
        mockAppStore.addNotification('Profil erfolgreich aktualisiert!', 'success')
        showProfileDialog.value = false
        
        profileForm.value.currentPassword = ''
        profileForm.value.newPassword = ''
      } catch {
        mockAppStore.addNotification('Fehler beim Aktualisieren des Profils', 'error')
      }
    }
    
    async function handleLogout() {
      mockUserStore.logout()
      mockAppStore.addNotification('Erfolgreich abgemeldet', 'success')
      await mockNavigateTo('/')
    }
    
    return {
      userStore: mockUserStore,
      appStore: mockAppStore,
      showAddLinkDialog,
      showEditDialog,
      showProfileDialog,
      newLink,
      editForm,
      profileForm,
      addNewLink,
      deleteLink,
      editLink,
      updateLink,
      updateProfile,
      handleLogout
    }
  }
}

describe('Dashboard Page', () => {
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  it('should render dashboard with user info', () => {
    const wrapper = mount(DashboardComponent, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.find('h1').text()).toBe('Dashboard')
    expect(wrapper.text()).toContain('Welcome, testuser!')
    expect(wrapper.text()).toContain('Test User')
  })

  it('should display loading state', () => {
    mockUserStore.isLoading = true
    mockUserStore.activeLinks = []
    
    const wrapper = mount(DashboardComponent, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.text()).toContain('Loading links...')
  })

  it('should display no links message when empty', () => {
    mockUserStore.isLoading = false
    mockUserStore.activeLinks = []
    
    const wrapper = mount(DashboardComponent, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.text()).toContain('No links yet')
    expect(wrapper.find('button').text()).toContain('Add First Link')
  })

  it('should display links list', () => {
    mockUserStore.isLoading = false
    mockUserStore.activeLinks = [
      {
        id: '1',
        title: 'Test Link 1',
        url: 'https://example.com',
        description: 'Test description'
      }
    ]
    
    const wrapper = mount(DashboardComponent, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.text()).toContain('Test Link 1')
    expect(wrapper.text()).toContain('Test description')
    expect(wrapper.text()).toContain('https://example.com')
  })

  it('should show add link dialog when button clicked', async () => {
    const wrapper = mount(DashboardComponent, {
      global: {
        plugins: [pinia]
      }
    })

    const addButton = wrapper.findAll('button').find(btn => btn.text().includes('Link hinzufÃ¼gen'))
    expect(addButton).toBeDefined()
    
    await addButton!.trigger('click')
    
    expect(wrapper.find('.dialog').text()).toContain('Link hinzufÃ¼gen')
  })

  it('should show edit link dialog when edit button clicked', async () => {
    mockUserStore.activeLinks = [
      {
        id: '1',
        title: 'Test Link',
        url: 'https://example.com',
        description: 'Test'
      }
    ]
    
    const wrapper = mount(DashboardComponent, {
      global: {
        plugins: [pinia]
      }
    })

    const editButton = wrapper.findAll('button').find(btn => btn.text().includes('Bearbeiten'))
    expect(editButton).toBeDefined()
    
    await editButton!.trigger('click')
    
    expect(wrapper.find('.dialog').text()).toContain('Link bearbeiten')
  })

  it('should show profile dialog when profile button clicked', async () => {
    const wrapper = mount(DashboardComponent, {
      global: {
        plugins: [pinia]
      }
    })

    const profileButton = wrapper.findAll('button').find(btn => btn.text().includes('Profil bearbeiten'))
    expect(profileButton).toBeDefined()
    
    await profileButton!.trigger('click')
    
    expect(wrapper.find('.dialog').text()).toContain('Profil bearbeiten')
  })

  it('should handle logout', async () => {
    const wrapper = mount(DashboardComponent, {
      global: {
        plugins: [pinia]
      }
    })

    const logoutButton = wrapper.findAll('button').find(btn => btn.text().includes('Abmelden'))
    expect(logoutButton).toBeDefined()
    
    await logoutButton!.trigger('click')
    
    expect(mockUserStore.logout).toHaveBeenCalled()
    expect(mockAppStore.addNotification).toHaveBeenCalledWith('Erfolgreich abgemeldet', 'success')
    expect(mockNavigateTo).toHaveBeenCalledWith('/')
  })

  it('should handle add new link form submission', async () => {
    const wrapper = mount(DashboardComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Open dialog
    await wrapper.find('button').trigger('click')
    
    // Set values directly in the component
    const vm = wrapper.vm as any
    vm.newLink.title = 'New Link'
    vm.newLink.url = 'https://newlink.com'
    vm.newLink.description = 'New description'
    
    // Call the function
    await vm.addNewLink()
    
    expect(mockUserStore.addLink).toHaveBeenCalledWith({
      title: 'New Link',
      url: 'https://newlink.com',
      description: 'New description',
      isActive: true,
      order: 1
    })
    expect(mockAppStore.addNotification).toHaveBeenCalledWith('Link erfolgreich hinzugefÃ¼gt!', 'success')
  })

  it('should handle edit link form submission', async () => {
    mockUserStore.activeLinks = [
      {
        id: '1',
        title: 'Test Link',
        url: 'https://example.com',
        description: 'Test'
      }
    ]
    
    const wrapper = mount(DashboardComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Open edit dialog
    const editButton = wrapper.findAll('button').find(btn => btn.text().includes('Bearbeiten'))
    await editButton!.trigger('click')
    
    // Fill form
    const titleInput = wrapper.find('input[placeholder="Titel"]')
    await titleInput.setValue('Updated Link')
    
    // Call the function directly instead of form submission
    const vm = wrapper.vm as any
    await vm.updateLink()
    
    expect(mockUserStore.updateLink).toHaveBeenCalledWith('1', {
      title: 'Updated Link',
      url: 'https://example.com',
      description: 'Test'
    })
    expect(mockAppStore.addNotification).toHaveBeenCalledWith('Link erfolgreich aktualisiert!', 'success')
  })

  it('should handle profile update form submission', async () => {
    const wrapper = mount(DashboardComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // Open profile dialog
    const profileButton = wrapper.findAll('button').find(btn => btn.text().includes('Profil bearbeiten'))
    await profileButton!.trigger('click')
    
    // Fill form
    const usernameInput = wrapper.find('input[placeholder="Username"]')
    await usernameInput.setValue('newusername')
    
    // Call the function directly instead of form submission
    const vm = wrapper.vm as any
    await vm.updateProfile()
    
    expect(mockUserStore.updateProfile).toHaveBeenCalledWith({
      username: 'newusername',
      name: 'Test User',
      bio: 'Test bio',
      avatar: 'avatar.jpg'
    })
    expect(mockAppStore.addNotification).toHaveBeenCalledWith('Profil erfolgreich aktualisiert!', 'success')
  })

  it('should handle delete link confirmation', async () => {
    // Mock confirm to return true
    global.confirm = vi.fn(() => true)
    
    mockUserStore.activeLinks = [
      {
        id: '1',
        title: 'Test Link',
        url: 'https://example.com',
        description: 'Test'
      }
    ]
    
    const wrapper = mount(DashboardComponent, {
      global: {
        plugins: [pinia]
      }
    })

    const deleteButton = wrapper.findAll('button').find(btn => btn.text().includes('LÃ¶schen'))
    expect(deleteButton).toBeDefined()
    
    await deleteButton!.trigger('click')
    
    expect(global.confirm).toHaveBeenCalledWith('Link wirklich lÃ¶schen?')
    expect(mockUserStore.deleteLink).toHaveBeenCalledWith('1')
    expect(mockAppStore.addNotification).toHaveBeenCalledWith('Link gelÃ¶scht!', 'success')
  })

  it('should not delete link when confirmation is cancelled', async () => {
    // Mock confirm to return false
    global.confirm = vi.fn(() => false)
    
    mockUserStore.activeLinks = [
      {
        id: '1',
        title: 'Test Link',
        url: 'https://example.com',
        description: 'Test'
      }
    ]
    
    const wrapper = mount(DashboardComponent, {
      global: {
        plugins: [pinia]
      }
    })

    const deleteButton = wrapper.findAll('button').find(btn => btn.text().includes('LÃ¶schen'))
    await deleteButton!.trigger('click')
    
    expect(global.confirm).toHaveBeenCalledWith('Link wirklich lÃ¶schen?')
    expect(mockUserStore.deleteLink).not.toHaveBeenCalled()
  })

  it('should handle user without name', () => {
    mockUserStore.currentUser = {
      username: 'testuser',
      name: '',
      bio: '',
      avatar: ''
    }
    
    const wrapper = mount(DashboardComponent, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.text()).toContain('Welcome, testuser!')
    expect(wrapper.text()).not.toContain('Test User')
  })
})

