<template>
  <v-app-bar elevation="1" color="surface">
    <v-container class="d-flex align-center">
      <!-- Logo/Brand -->
      <v-app-bar-title>
        <NuxtLink 
          to="/" 
          class="text-decoration-none text-primary"
        >
          linxz
        </NuxtLink>
      </v-app-bar-title>

      <v-spacer />

      <!-- Theme Toggle -->
      <v-btn
        icon
        @click="cycleTheme"
        :title="themeTooltip"
      >
        <v-icon>{{ themeIcon }}</v-icon>
      </v-btn>

      <!-- Auth Buttons (nicht eingeloggt) -->
      <template v-if="!userStore.isLoggedIn">
        <v-btn 
          variant="text" 
          to="/login"
          class="ml-2"
        >
          Login
        </v-btn>
        <v-btn 
          variant="tonal" 
          to="/signup"
          class="ml-2"
        >
          Sign Up
        </v-btn>
      </template>

      <!-- User Menu (eingeloggt) -->
      <template v-else>
        <v-btn 
          variant="text" 
          to="/dashboard"
          class="ml-2"
        >
          Dashboard
        </v-btn>
        <v-avatar 
          size="32" 
          class="ml-2"
          style="cursor: pointer;"
          @click="navigateTo(`/${userStore.username}`)"
        >
          <v-img 
            v-if="userStore.currentUser?.avatar" 
            :src="userStore.currentUser.avatar" 
          />
          <v-icon v-else size="20">mdi-account</v-icon>
        </v-avatar>
      </template>
    </v-container>
  </v-app-bar>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '~/stores/user'
import { useAppStore } from '~/stores/app'

const userStore = useUserStore()
const appStore = useAppStore()

const themeIcon = computed(() => {
  const theme = appStore.settings.theme
  if (theme === 'light') return 'mdi-white-balance-sunny'
  if (theme === 'dark') return 'mdi-moon-waning-crescent'
  return 'mdi-theme-light-dark'
})

const themeTooltip = computed(() => {
  const theme = appStore.settings.theme
  if (theme === 'light') return 'Light Mode'
  if (theme === 'dark') return 'Dark Mode'
  return 'System Mode'
})

function cycleTheme() {
  const current = appStore.settings.theme
  const next = 
    current === 'light' ? 'dark' :
    current === 'dark' ? 'auto' : 'light'
  appStore.setTheme(next)
}
</script>

