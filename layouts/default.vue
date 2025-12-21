<template>
  <v-app>
    <!-- Header auf allen Seiten (nur auf Profilseiten wenn eingeloggt) -->
    <AppHeader v-if="showHeader" />
    
    <v-main>
      <slot />
    </v-main>
    
    <!-- Footer -->
    <v-footer app class="justify-center">
      <NuxtLink to="/privacy?lang=en" class="text-decoration-none">
        Privacy Policy
      </NuxtLink>
    </v-footer>
    
    <!-- Globale Benachrichtigungen -->
    <NotificationSystem />
  </v-app>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '~/stores/user'

const route = useRoute()
const userStore = useUserStore()

// Prüfe ob aktuelle Seite eine Profilseite ist
const isProfilePage = computed(() => {
  return route.path.match(/^\/[^/]+$/) && 
         route.path !== '/' && 
         route.path !== '/login' && 
         route.path !== '/signup' && 
         route.path !== '/dashboard'
})

// Header soll angezeigt werden wenn nicht Profilseite oder (Profilseite UND eingeloggt)
const showHeader = computed(() => {
  if (!isProfilePage.value) return true
  return userStore.isLoggedIn
})
</script> 