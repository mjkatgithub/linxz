<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center">
    <v-card width="400" class="pa-6">
      <h2 class="mb-6 text-center">Login</h2>
      <v-form>
        <v-text-field label="E-Mail" type="email" class="mb-4" required />
        <v-text-field label="Passwort" type="password" class="mb-6" required />
        <v-btn color="primary" block size="large">Login</v-btn>
      </v-form>
      <div class="mt-4 text-center">
        <NuxtLink to="/signup">Noch keinen Account? Jetzt registrieren</NuxtLink>
      </div>
    </v-card>
  </v-container>
</template> 