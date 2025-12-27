// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-12-26',
  srcDir: 'app',
  devtools: {
    enabled: true,
    timeline: {
      enabled: true
    },
    // Explizite Konfiguration fuer Pinia-Integration
    // in den DevTools
    componentInspector: {
      enabled: true
    }
  },
  modules: [
    '@nuxt/eslint',
    '@nuxt/test-utils',
    '@prisma/nuxt',
    '@pinia/nuxt'
  ],
  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.css',
  ],
  build: {
    transpile: ['vuetify'],
  },
  runtimeConfig: {
    // Private keys (nur serverseitig verfügbar)
    // Diese Werte werden aus .env gelesen
    // WICHTIG: Nach Änderungen in .env muss der Server neu gestartet werden!
    privacyContactName: process.env.PRIVACY_CONTACT_NAME || 
      '[Ihr Name]',
    privacyContactAddress: process.env.PRIVACY_CONTACT_ADDRESS || 
      '[Ihre Adresse]',
    privacyContactEmail: process.env.PRIVACY_CONTACT_EMAIL || 
      '[Ihre E-Mail-Adresse]',
    // Public keys (auch im Client verfügbar, falls nötig)
    public: {
      // Hier können öffentliche Config-Werte hinzugefügt werden
    }
  }
})