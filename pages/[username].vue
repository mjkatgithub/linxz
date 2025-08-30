<template>
  <v-container class="py-10 d-flex flex-column align-center">
    <!-- Loading State -->
    <div v-if="pending" class="text-center py-8">
      <v-progress-circular indeterminate size="64" />
      <p class="mt-4">Lade Profil...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
      <h2>Profil nicht gefunden</h2>
      <p class="text-body-1 mb-4">Der Benutzer "{{ $route.params.username }}" existiert nicht.</p>
      <v-btn color="primary" @click="$router.push('/')">
        Zur Startseite
      </v-btn>
    </div>

    <!-- Profile Content -->
    <div v-else-if="userData" class="w-100" style="max-width: 400px;">
      <!-- Avatar -->
      <div class="text-center mb-6">
        <v-avatar size="96" class="mb-4">
          <v-img 
            v-if="userData.avatar" 
            :src="userData.avatar" 
            :alt="userData.username" 
          />
          <v-icon v-else size="48">mdi-account</v-icon>
        </v-avatar>
        <h2 class="mb-2">@{{ userData.username }}</h2>
        <p v-if="userData.name" class="text-h6 mb-2">{{ userData.name }}</p>
        <p v-if="userData.bio" class="text-body-1">{{ userData.bio }}</p>
      </div>

      <!-- Links -->
      <div v-if="userData.links && userData.links.length > 0">
        <v-btn
          v-for="link in userData.links"
          :key="link.id"
          @click="openLink(link.url)"
          class="mb-3"
          color="primary"
          size="large"
          block
          variant="elevated"
        >
          <v-icon v-if="link.icon" class="mr-2">{{ link.icon }}</v-icon>
          {{ link.title }}
        </v-btn>
      </div>

      <!-- No Links -->
      <div v-else class="text-center py-8">
        <v-icon size="48" class="mb-4">mdi-link-off</v-icon>
        <p>Noch keine Links vorhanden</p>
      </div>
    </div>
  </v-container>
</template>

<script setup>
const route = useRoute()
const username = route.params.username

// Lade Benutzer-Daten über API
const userData = ref(null)
const pending = ref(true)
const error = ref(null)

try {
  const response = await $fetch('/api/links', {
    query: { username },
    server: true
  })
  userData.value = response
} catch (err) {
  console.log(`User "${username}" nicht gefunden`)
  error.value = err
} finally {
  pending.value = false
}

// openLink Funktion
function openLink(url) {
  // Öffne Link in neuem Tab
  window.open(url, '_blank', 'noopener,noreferrer')
}

// SEO Meta Tags
useHead({
  title: `@${username} - Linxz`,
  meta: [
    { name: 'description', content: `Besuche das Profil von @${username} auf Linxz` }
  ]
})
</script> 