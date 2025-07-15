<template>
  <v-container class="py-10 d-flex flex-column align-center">
    <v-avatar size="96" class="mb-4">
      <v-img src="https://randomuser.me/api/portraits/men/1.jpg" alt="Avatar" />
    </v-avatar>
    <h2 class="mb-6">@{{ $route.params.username }}</h2>
    <v-btn
      v-for="link in links"
      :key="link.url"
      :href="link.url"
      target="_blank"
      class="mb-2"
      color="primary"
      size="large"
      block
    >
      {{ link.label }}
    </v-btn>
  </v-container>
</template>

<script setup>
const links = [
  { label: 'Meine Website', url: 'https://example.com' },
  { label: 'GitHub', url: 'https://github.com/' },
  { label: 'Instagram', url: 'https://instagram.com/' },
]
</script> 