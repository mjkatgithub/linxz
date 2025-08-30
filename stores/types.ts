// Zentrale Typendefinitionen für alle Stores

// Benutzer-Typen
export interface User {
  id: string
  username: string
  email: string
  createdAt: Date
  isAuthenticated: boolean
}

// Link-Typen
export interface Link {
  id: string
  title: string
  url: string
  description?: string
  isActive: boolean
  order: number
  createdAt: Date
}

// App-Einstellungen
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  language: string
  notifications: boolean
}

// UI-State
export interface UIState {
  sidebarOpen: boolean
  currentPage: string
  breadcrumbs: string[]
}

// Benachrichtigungen
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  timeout?: number
}

// API-Response-Typen
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Login-Request
export interface LoginRequest {
  email: string
  password: string
}

// Registrierungs-Request
export interface SignupRequest {
  username: string
  email: string
  password: string
  confirmPassword: string
}

// Link-Request (ohne ID und createdAt)
export interface CreateLinkRequest {
  title: string
  url: string
  description?: string
  isActive: boolean
  order: number
}

// Link-Update-Request
export interface UpdateLinkRequest {
  title?: string
  url?: string
  description?: string
  isActive?: boolean
  order?: number
}
