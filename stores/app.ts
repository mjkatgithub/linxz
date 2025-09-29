import { defineStore } from 'pinia'
import type { AppSettings, UIState, Notification } from './types'

import { isClient } from './utils'
// Einfacher Fallback-Logger für Client-Side
const log = {
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(`[app] ERROR: ${message}`, context)
  }
}

export const useAppStore = defineStore('app', {
  state: () => ({
    settings: {
      theme: 'auto' as 'light' | 'dark' | 'auto',
      language: 'de',
      notifications: true
    } as AppSettings,
    
    ui: {
      sidebarOpen: false,
      currentPage: '',
      breadcrumbs: []
    } as UIState,
    
    isLoading: false,
    notifications: [] as Notification[]
  }),

  getters: {
    // Prüft ob das Theme dunkel ist
    isDarkTheme: (state) => {
      if (state.settings.theme === 'auto') {
        // Prüfe System-Präferenz nur auf Client-Side
        if (isClient()) {
          return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        // Server-Side: Standard auf dark
        return true
      }
      return state.settings.theme === 'dark'
    },
    
    // Gibt die aktuelle Sprache zurück
    currentLanguage: (state) => state.settings.language,
    
    // Prüft ob Benachrichtigungen aktiviert sind
    notificationsEnabled: (state) => state.settings.notifications
  },

  actions: {
    // Theme ändern
          setTheme(theme: 'light' | 'dark' | 'auto') {
        this.settings.theme = theme
        if (isClient()) {
          localStorage.setItem('app-theme', theme)
        }
      },

    // Sprache ändern
    setLanguage(language: string) {
      this.settings.language = language
      // TODO: Sprache in localStorage speichern
      localStorage.setItem('app-language', language)
    },

    // Benachrichtigungen ein-/ausschalten
    toggleNotifications() {
      this.settings.notifications = !this.settings.notifications
      localStorage.setItem('app-notifications', this.settings.notifications.toString())
    },

    // Sidebar öffnen/schließen
    toggleSidebar() {
      this.ui.sidebarOpen = !this.ui.sidebarOpen
    },

    // Sidebar schließen
    closeSidebar() {
      this.ui.sidebarOpen = false
    },

    // Aktuelle Seite setzen
    setCurrentPage(page: string) {
      this.ui.currentPage = page
    },

    // Breadcrumbs setzen
    setBreadcrumbs(breadcrumbs: string[]) {
      this.ui.breadcrumbs = breadcrumbs
    },

    // Benachrichtigung hinzufügen
    addNotification(
      message: string, 
      type: 'success' | 'error' | 'warning' | 'info' = 'info',
      timeout: number = 5000
    ) {
      const id = Date.now().toString()
      const notification = { id, type, message, timeout }
      
      this.notifications.push(notification)
      
      // Automatisch entfernen nach Timeout
      if (timeout > 0) {
        setTimeout(() => {
          this.removeNotification(id)
        }, timeout)
      }
    },

    // Benachrichtigung entfernen
    removeNotification(id: string) {
      this.notifications = this.notifications.filter(n => n.id !== id)
    },

    // Alle Benachrichtigungen entfernen
    clearNotifications() {
      this.notifications = []
    },

    // Loading-State setzen
    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    // Einstellungen aus localStorage laden
    loadSettings() {
      if (!isClient()) return
      
      try {
        const theme = localStorage.getItem('app-theme')
        if (theme && ['light', 'dark', 'auto'].includes(theme)) {
          this.settings.theme = theme as 'light' | 'dark' | 'auto'
        } else {
          // Standard auf 'auto' wenn nichts gespeichert ist
          this.settings.theme = 'auto'
        }

        const language = localStorage.getItem('app-language')
        if (language) {
          this.settings.language = language
        }

        const notifications = localStorage.getItem('app-notifications')
        if (notifications !== null) {
          this.settings.notifications = notifications === 'true'
        }
      } catch (error) {
        log.error('Failed to load settings', { error: (error as Error).message })
      }
    },

    // Einstellungen zurücksetzen
    resetSettings() {
      this.settings = {
        theme: 'auto',
        language: 'de',
        notifications: true
      }
      
      // localStorage löschen
      localStorage.removeItem('app-theme')
      localStorage.removeItem('app-language')
      localStorage.removeItem('app-notifications')
    }
  }
})
