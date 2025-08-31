<template>
  <NuxtLayout>
    <v-container class="fill-height d-flex flex-column align-center justify-center">
      <h1 class="mb-4">Willkommen bei linxz</h1>
      <p class="mb-8">Deine persönliche Link-Sammlung – einfach, modern, flexibel.</p>
      <v-btn color="primary" class="mb-2" to="/login" size="large">Login</v-btn>
      <v-btn color="secondary" class="mb-2" to="/signup" size="large">Sign Up</v-btn>
      <v-btn variant="outlined" class="mt-4" to="/dashboard">Getting Started</v-btn>
    </v-container>
  </NuxtLayout>
</template> 