<template>
  <NuxtLayout>
    <v-container class="fill-height d-flex flex-column align-center justify-center">
    <v-card width="400" class="pa-6">
      <h2 class="mb-6 text-center">Login</h2>
      
      <!-- Fehlermeldung anzeigen -->
      <v-alert
        v-if="userStore.error"
        type="error"
        class="mb-4"
        closable
        @click:close="userStore.error = null"
      >
        {{ userStore.error }}
      </v-alert>
      
      <v-form @submit.prevent="handleLogin">
        <v-text-field 
          v-model="form.email" 
          label="E-Mail" 
          type="email" 
          class="mb-4" 
          required 
        />
        <v-text-field 
          v-model="form.password" 
          label="Passwort" 
          type="password" 
          class="mb-6" 
          required 
        />
        <v-btn 
          color="primary" 
          block 
          size="large" 
          type="submit"
          :loading="userStore.isLoading"
        >
          Login
        </v-btn>
      </v-form>
      <div class="mt-4 text-center">
        <NuxtLink to="/signup">Noch keinen Account? Jetzt registrieren</NuxtLink>
      </div>
      
      <div class="mt-6 text-center">
        <v-btn
          variant="text"
          color="primary"
          to="/"
          prepend-icon="mdi-home"
        >
          Zur Startseite
        </v-btn>
      </div>
    </v-card>
      </v-container>
  </NuxtLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '~/stores/user'
import { useAppStore } from '~/stores/app'

const userStore = useUserStore()
const appStore = useAppStore()

const form = ref({
  email: '',
  password: ''
})

async function handleLogin() {
  try {
    await userStore.login(form.value.email, form.value.password)
    
    // Erfolgreiche Anmeldung
    appStore.addNotification('Erfolgreich angemeldet!', 'success')
    await navigateTo('/dashboard')
    
  } catch {
    // Fehler wird bereits im Store behandelt
    appStore.addNotification('Login fehlgeschlagen', 'error')
  }
}

// Redirect wenn bereits eingeloggt (auf Mount, um async setup zu vermeiden)
onMounted(async () => {
  if (userStore.isLoggedIn) {
    await navigateTo('/dashboard')
  }
})
</script> 
