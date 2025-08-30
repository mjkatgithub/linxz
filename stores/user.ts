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
        // TODO: Hier später echte Login-API implementieren
        // Für jetzt: Dummy-Login (später durch echte Auth ersetzen)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Simuliere erfolgreichen Login
        this.currentUser = {
          id: '1',
          username: 'testuser',
          email: email,
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
    },

    // Links des Benutzers laden
    async loadUserLinks() {
      if (!this.currentUser) return
      
      this.isLoading = true
      
      try {
        // Lade Links über API
        const response = await $fetch('/api/links', {
          query: { username: this.currentUser.username }
        })
        
        // Konvertiere API-Response zu Link-Format
        this.userLinks = response.links.map((link: any) => ({
          id: link.id.toString(),
          title: link.title,
          url: link.url,
          description: link.description,
          isActive: link.isActive,
          order: link.order,
          createdAt: new Date(link.createdAt)
        }))
        
      } catch (error) {
        this.error = 'Fehler beim Laden der Links'
        console.error('Load links error:', error)
        // Fallback zu Dummy-Daten bei Fehler
        this.userLinks = [
          {
            id: '1',
            title: 'Meine Website',
            url: 'https://example.com',
            description: 'Meine persönliche Website',
            isActive: true,
            order: 1,
            createdAt: new Date()
          }
        ]
      } finally {
        this.isLoading = false
      }
    },

    // Neuen Link hinzufügen
    async addLink(linkData: CreateLinkRequest) {
      if (!this.currentUser) return
      
      this.isLoading = true
      
      try {
        // TODO: Hier später echte API-Calls machen
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const newLink: Link = {
          ...linkData,
          id: Date.now().toString(), // Einfache ID-Generierung
          createdAt: new Date()
        }
        
        this.userLinks.push(newLink)
        
      } catch (error) {
        this.error = 'Fehler beim Hinzufügen des Links'
        console.error('Add link error:', error)
      } finally {
        this.isLoading = false
      }
    },

    // Link aktualisieren
    async updateLink(linkId: string, updates: UpdateLinkRequest) {
      this.isLoading = true
      
      try {
        // TODO: Hier später echte API-Calls machen
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const linkIndex = this.userLinks.findIndex(link => link.id === linkId)
        if (linkIndex !== -1) {
          this.userLinks[linkIndex] = { ...this.userLinks[linkIndex], ...updates }
        }
        
      } catch (error) {
        this.error = 'Fehler beim Aktualisieren des Links'
        console.error('Update link error:', error)
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
    }
  }
})
