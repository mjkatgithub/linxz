import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { defineNuxtPlugin, useHead } from '#imports'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

export default defineNuxtPlugin((nuxtApp) => {
  let vuetify

  try {
    vuetify = createVuetify({
      components,
      directives,
      theme: {
        defaultTheme: 'system', // Automatische Erkennung von Dark/Light
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
