<template>
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
          :loading="loading"
        >
          Registrieren
        </v-btn>
      </v-form>
      <div class="mt-4 text-center">
        <NuxtLink to="/login">Bereits einen Account? Jetzt anmelden</NuxtLink>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
const form = ref({
  email: '',
  username: '',
  name: '',
  password: ''
})

const loading = ref(false)

async function handleSignup() {
  loading.value = true
  
  try {
    const response = await $fetch('/api/users', {
      method: 'POST',
      body: form.value
    })
    
    // Erfolgreiche Registrierung
    console.log('User erstellt:', response)
    await navigateTo('/login')
  } catch (error) {
    console.error('Fehler bei Registrierung:', error)
    // TODO: Zeige Fehlermeldung an
  } finally {
    loading.value = false
  }
}
</script> 