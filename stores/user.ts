import { defineStore } from 'pinia'
import type { User, Link, CreateLinkRequest, UpdateLinkRequest } from './types'

// Der Store für Benutzer und deren Links
export const useUserStore = defineStore('user', {
  // State - hier werden die Daten gespeichert
  state: () => ({
    currentUser: null as User | null,
    userLinks: [] as Link[],
    isLoading: false,
    error: null as string | null
  }),

  // Getters - für berechnete Werte
  getters: {
    // Prüft ob ein Benutzer eingeloggt ist
    isLoggedIn: (state) => state.currentUser?.isAuthenticated ?? false,
    
    // Gibt den Benutzernamen zurück
    username: (state) => state.currentUser?.username ?? '',
    
    // Gibt die aktiven Links zurück (sortiert nach Reihenfolge)
    activeLinks: (state) => 
      state.userLinks
        .filter(link => link.isActive)
        .sort((a, b) => a.order - b.order),
    
    // Zählt die aktiven Links
    linkCount: (state) => state.userLinks.filter(link => link.isActive).length
  },

  // Actions - für Aktionen und API-Calls
  actions: {
    // Benutzer einloggen
    async login(email: string, password: string) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await $fetch('/api/auth/login', {
          method: 'POST',
          body: { email, password }
        })
        
        // Speichere Token im localStorage
        localStorage.setItem('auth-token', response.token)
        
        // Setze User-Info
        this.currentUser = {
          id: response.id.toString(),
          username: response.username,
          email: response.email,
          createdAt: new Date(),
          isAuthenticated: true
        }
        
        // Lade die Links des Benutzers
        await this.loadUserLinks()
        
      } catch (error) {
        this.error = 'Login fehlgeschlagen'
        console.error('Login error:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Benutzer registrieren
    async signup(signupData: { email: string; username: string; password: string; name?: string }) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await $fetch('/api/users', {
          method: 'POST',
          body: signupData
        })
        
        // Speichere Token im localStorage
        localStorage.setItem('auth-token', response.token)
        
        // Nach erfolgreicher Registrierung automatisch einloggen
        this.currentUser = {
          id: response.id.toString(),
          username: response.username,
          email: response.email,
          createdAt: new Date(),
          isAuthenticated: true
        }
        
        return response
        
      } catch (error) {
        this.error = 'Registrierung fehlgeschlagen'
        console.error('Signup error:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Benutzer ausloggen
    logout() {
      this.currentUser = null
      this.userLinks = []
      this.error = null
      // Entferne Token aus localStorage
      localStorage.removeItem('auth-token')
    },

    // Links des Benutzers laden
    async loadUserLinks() {
      if (!this.currentUser) return
      
      this.isLoading = true
      
      try {
        const token = localStorage.getItem('auth-token')
        if (!token) {
          throw new Error('Nicht authentifiziert')
        }
        
        // Lade eigene Links über API
        const response = await $fetch('/api/users/links', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        // Konvertiere API-Response zu Link-Format
        this.userLinks = response.links.map((link: any) => ({
          id: link.id.toString(),
          title: link.title,
          url: link.url,
          description: link.description || undefined,
          isActive: link.isActive,
          order: link.order,
          createdAt: new Date(link.createdAt)
        }))
        
      } catch (error) {
        this.error = 'Fehler beim Laden der Links'
        console.error('Load links error:', error)
        this.userLinks = []
      } finally {
        this.isLoading = false
      }
    },

    // Neuen Link hinzufügen
    async addLink(linkData: CreateLinkRequest) {
      if (!this.currentUser) return
      
      this.isLoading = true
      
      try {
        const token = localStorage.getItem('auth-token')
        if (!token) {
          throw new Error('Nicht authentifiziert')
        }
        
        const response = await $fetch('/api/links', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: linkData
        })
        
        // Konvertiere API-Response zu Link-Format
        const newLink: Link = {
          id: response.id.toString(),
          title: response.title,
          url: response.url,
          description: response.description || undefined,
          isActive: response.isActive,
          order: response.order,
          createdAt: new Date(response.createdAt)
        }
        
        this.userLinks.push(newLink)
        
      } catch (error) {
        this.error = 'Fehler beim Hinzufügen des Links'
        console.error('Add link error:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Link aktualisieren
    async updateLink(linkId: string, updates: UpdateLinkRequest) {
      this.isLoading = true
      
      try {
        const token = localStorage.getItem('auth-token')
        if (!token) {
          throw new Error('Nicht authentifiziert')
        }
        
        const response = await $fetch(`/api/links/${linkId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: updates
        })
        
        // Aktualisiere Link im Store
        const linkIndex = this.userLinks.findIndex(link => link.id === linkId)
        if (linkIndex !== -1) {
          this.userLinks[linkIndex] = {
            ...this.userLinks[linkIndex],
            title: response.title,
            url: response.url,
            description: response.description || undefined,
            isActive: response.isActive,
            order: response.order
          }
        }
        
      } catch (error) {
        this.error = 'Fehler beim Aktualisieren des Links'
        console.error('Update link error:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Link löschen
    async deleteLink(linkId: string) {
      this.isLoading = true
      
      try {
        // TODO: Hier später echte API-Calls machen
        await new Promise(resolve => setTimeout(resolve, 500))
        
        this.userLinks = this.userLinks.filter(link => link.id !== linkId)
        
      } catch (error) {
        this.error = 'Fehler beim Löschen des Links'
        console.error('Delete link error:', error)
      } finally {
        this.isLoading = false
      }
    },

    // Links neu ordnen
    async reorderLinks(linkIds: string[]) {
      this.isLoading = true
      
      try {
        // TODO: Hier später echte API-Calls machen
        await new Promise(resolve => setTimeout(resolve, 500))
        
        linkIds.forEach((linkId, index) => {
          const link = this.userLinks.find(l => l.id === linkId)
          if (link) {
            link.order = index + 1
          }
        })
        
      } catch (error) {
        this.error = 'Fehler beim Neuordnen der Links'
        console.error('Reorder links error:', error)
      } finally {
        this.isLoading = false
      }
    },

    // User-Profil aktualisieren
    async updateProfile(profileData: { username?: string; name?: string; bio?: string; avatar?: string; currentPassword?: string; newPassword?: string }) {
      this.isLoading = true
      this.error = null
      
      try {
        const token = localStorage.getItem('auth-token')
        if (!token) {
          throw new Error('Nicht authentifiziert')
        }
        
        const response = await $fetch('/api/users', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: profileData
        })
        
        // Aktualisiere User-Info im Store
        if (this.currentUser) {
          this.currentUser.username = response.username
        }
        
        return response
        
      } catch (error) {
        this.error = 'Fehler beim Aktualisieren des Profils'
        console.error('Update profile error:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // User-Profil laden
    async loadProfile() {
      this.isLoading = true
      
      try {
        const token = localStorage.getItem('auth-token')
        if (!token) {
          throw new Error('Nicht authentifiziert')
        }
        
        const response = await $fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        return response
        
      } catch (error) {
        this.error = 'Fehler beim Laden des Profils'
        console.error('Load profile error:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Auto-Login beim App-Start
    async checkAuth() {
      const token = localStorage.getItem('auth-token')
      if (!token) return false
      
      try {
        // Lade User-Profil über API
        const userData = await $fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        // Setze User-Info
        this.currentUser = {
          id: userData.id.toString(),
          username: userData.username,
          email: userData.email,
          name: userData.name,
          bio: userData.bio,
          avatar: userData.avatar,
          createdAt: new Date(userData.createdAt),
          isAuthenticated: true
        }
        
        await this.loadUserLinks()
        return true
        
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('auth-token')
        return false
      }
    }
  }
})
