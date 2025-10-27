import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { defineNuxtPlugin, useHead } from '#imports'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

export default defineNuxtPlugin(async (nuxtApp) => {
  // Determine initial theme BEFORE creating Vuetify instance
  let initialTheme = 'light'
  if (typeof window !== 'undefined') {
    const { useAppStore } = await import('~/stores/app')
    const appStore = useAppStore()
    appStore.loadSettings()
    
    if (appStore.settings.theme === 'auto') {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches
      initialTheme = prefersDark ? 'dark' : 'light'
    } else {
      initialTheme = appStore.settings.theme
    }
  }

  let vuetify

  try {
    vuetify = createVuetify({
      components,
      directives,
      theme: {
        defaultTheme: initialTheme,
        themes: {
          light: {},
          dark: {},
        },
      },
      icons: {
        defaultSet: 'mdi',
      },
    })
  } catch (error) {
    console.error('[vuetify plugin] Failed to create Vuetify instance', error)
    return
  }

  nuxtApp.vueApp.use(vuetify)

  try {
    // Set up theme synchronization for changes
    if (typeof window !== 'undefined') {
      const { useAppStore } = await import('~/stores/app')
      const { watch } = await import('vue')
      const appStore = useAppStore()
      
      const syncTheme = () => {
        let themeName = appStore.settings.theme
        if (themeName === 'auto') {
          const prefersDark = window.matchMedia(
            '(prefers-color-scheme: dark)'
          ).matches
          themeName = prefersDark ? 'dark' : 'light'
        }
        // Directly assign to name.value
        vuetify.theme.global.name.value = themeName
      }
      
      // Watch store changes
      watch(() => appStore.settings.theme, () => {
        syncTheme()
      })
      
      // Watch system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', syncTheme)
    }
    
    // Setzt das Theme-Color-Meta-Tag passend zum Modus
    useHead({
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/icon?family=Material+Icons'
        }
      ],
      meta: [
        {
          name: 'theme-color',
          content: 'rgb(33, 33, 33)',
          media: '(prefers-color-scheme: dark)'
        },
        {
          name: 'theme-color',
          content: 'rgb(250, 250, 250)',
          media: '(prefers-color-scheme: light)'
        }
      ]
    })
  } catch (error) {
    console.error('[vuetify plugin] Failed to register head metadata', error)
  }
}) 
