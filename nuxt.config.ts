// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
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
  pinia: {
    storesDirs: ['./stores'],
    autoImports: ['defineStore', 'storeToRefs']
  },
  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.css',
  ],
  build: {
    transpile: ['vuetify'],
  },
})