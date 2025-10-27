<template>
  <v-app-bar elevation="1" color="surface">
    <v-container class="d-flex align-center">
      <!-- Logo/Brand -->
      <v-app-bar-title>
        <NuxtLink 
          to="/" 
          class="text-decoration-none text-primary d-flex align-center"
        >
          <v-icon class="mr-1" size="24">mdi-link</v-icon>
          <span class="d-none d-sm-inline">linxz</span>
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
        <v-menu offset-y>
          <template #activator="{ props }">
            <v-avatar 
              size="32" 
              class="ml-2"
              style="cursor: pointer;"
              v-bind="props"
            >
              <v-img 
                v-if="userStore.currentUser?.avatar" 
                :src="userStore.currentUser.avatar" 
              />
              <v-icon v-else size="20">mdi-account</v-icon>
            </v-avatar>
          </template>
          
          <v-list>
            <v-list-item 
              :title="userStore.currentUser?.name || userStore.username"
              :subtitle="userStore.currentUser?.email"
              disabled
            />
            <v-divider />
            <v-list-item
              prepend-icon="mdi-view-dashboard"
              title="Dashboard"
              :to="'/dashboard'"
            />
            <v-list-item
              prepend-icon="mdi-account"
              title="Profile"
              :to="`/${userStore.username}`"
            />
            <v-divider />
            <v-list-item
              prepend-icon="mdi-logout"
              title="Sign Out"
              @click="handleLogout"
            />
          </v-list>
        </v-menu>
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

async function handleLogout() {
  userStore.logout()
  appStore.addNotification('Signed out successfully', 'success')
  await navigateTo('/')
}
</script>

