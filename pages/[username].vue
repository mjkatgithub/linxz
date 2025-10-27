<template>
  <NuxtLayout>
    <v-container class="py-10 d-flex flex-column align-center">
      <!-- Loading State -->
      <div v-if="pending" class="text-center py-8">
        <v-progress-circular indeterminate size="64" />
        <p class="mt-4">Loading profile...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
        <h2>Profile not found</h2>
        <p class="text-body-1 mb-4">The user "{{ username }}" does not exist.</p>
        <v-btn color="primary" to="/">
          To Homepage
        </v-btn>
      </div>

      <!-- Profile Content -->
      <div v-else-if="hasUser" class="w-100 px-4" style="max-width: 500px;">
        <!-- Avatar -->
        <div class="text-center mb-6">
          <v-avatar size="96" class="mb-4">
            <v-img
              v-if="user?.avatar"
              :src="user.avatar"
              :alt="user.username"
            />
            <v-icon v-else size="48">mdi-account</v-icon>
          </v-avatar>
          <h2 class="mb-2">@{{ user.username }}</h2>
          <p v-if="user?.name" class="text-h6 mb-2">{{ user.name }}</p>
          <p v-if="user?.bio" class="text-body-1">{{ user.bio }}</p>
        </div>

        <!-- Links -->
        <div v-if="user?.links && user.links.length > 0">
          <v-btn
            v-for="link in user.links"
            :key="link.id"
            class="mb-3"
            color="primary"
            size="large"
            block
            variant="elevated"
            type="button"
            @click="openLink(link.url)"
          >
            <v-icon v-if="link.icon" class="mr-2">{{ link.icon }}</v-icon>
            {{ link.title }}
          </v-btn>
        </div>

        <!-- No Links -->
        <div v-else class="text-center py-8">
          <v-icon size="48" class="mb-4">mdi-link-off</v-icon>
          <p>No links yet</p>
        </div>

        <!-- Link zur Startseite -->
        <div class="text-center mt-8">
          <v-btn
            variant="outlined"
            color="primary"
            to="/"
            prepend-icon="mdi-home"
            type="button"
          >
            Create Link Collection
          </v-btn>
        </div>
      </div>
    </v-container>
  </NuxtLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const route = useRoute()
const username = computed(() => String(route.params.username ?? ''))

const userData = ref(null)
const pending = ref(true)
const error = ref(null)

const hasUser = computed(() => !!userData.value)
const user = computed(() => userData.value)

onMounted(async () => {
  try {
    const response = await $fetch('/api/links', {
      query: { username: username.value }
    })
    userData.value = response
  } catch (err) {
    error.value = err
  } finally {
    pending.value = false
  }
})

function openLink(url) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

useHead({
  title: computed(() => `@${username.value} - Linxz`),
  meta: [
    {
      name: 'description',
      content: computed(() => `Besuche das Profil von @${username.value} auf Linxz`)
    }
  ]
})
</script>
