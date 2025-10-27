<template>
  <v-app>
    <!-- Header nur auf Nicht-Profilseiten -->
    <AppHeader v-if="!isProfilePage" />
    
    <v-main>
      <slot />
    </v-main>
    
    <!-- Globale Benachrichtigungen -->
    <NotificationSystem />
  </v-app>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Prüfe ob aktuelle Seite eine Profilseite ist
const isProfilePage = computed(() => {
  return route.path.match(/^\/[^/]+$/) && 
         route.path !== '/' && 
         route.path !== '/login' && 
         route.path !== '/signup' && 
         route.path !== '/dashboard'
})
</script> 