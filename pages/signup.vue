<template>
  <NuxtLayout>
    <v-container class="fill-height d-flex flex-column align-center justify-center">
    <v-card width="400" class="pa-6">
      <h2 class="mb-6 text-center">Registrierung</h2>
      <v-form @submit.prevent="handleSignup">
        <v-text-field 
          v-model="form.email" 
          label="E-Mail" 
          type="email" 
          class="mb-4" 
          required 
        />
        <v-text-field 
          v-model="form.username" 
          label="Username" 
          class="mb-4" 
          required 
        />
        <v-text-field 
          v-model="form.name" 
          label="Name (optional)" 
          class="mb-4" 
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
          Registrieren
        </v-btn>
      </v-form>
      <div class="mt-4 text-center">
        <NuxtLink to="/login">Bereits einen Account? Jetzt anmelden</NuxtLink>
      </div>
    </v-card>
      </v-container>
  </NuxtLayout>
</template>

<script setup>
import { useUserStore } from '~/stores/user'
import { useAppStore } from '~/stores/app'

const userStore = useUserStore()
const appStore = useAppStore()

const form = ref({
  email: '',
  username: '',
  name: '',
  password: ''
})

async function handleSignup() {
  try {
    await userStore.signup(form.value)
    
    // Erfolgreiche Registrierung
    appStore.addNotification('Registrierung erfolgreich!', 'success')
    await navigateTo('/dashboard')
    
  } catch {
    // Fehler wird bereits im Store behandelt
    appStore.addNotification('Registrierung fehlgeschlagen', 'error')
  }
}

// Redirect wenn bereits eingeloggt
if (userStore.isLoggedIn) {
  await navigateTo('/dashboard')
}
</script> 