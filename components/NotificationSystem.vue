<template>
  <v-snackbar
    v-for="notification in appStore.notifications"
    :key="notification.id"
    :model-value="true"
    :color="getNotificationColor(notification.type)"
    :timeout="notification.timeout || 5000"
    @update:model-value="appStore.removeNotification(notification.id)"
  >
    <div class="d-flex align-center">
      <v-icon class="mr-2">{{ getNotificationIcon(notification.type) }}</v-icon>
      {{ notification.message }}
    </div>
    
    <template #actions>
      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        @click="appStore.removeNotification(notification.id)"
      />
    </template>
  </v-snackbar>
</template>

<script setup>
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()

function getNotificationColor(type) {
  switch (type) {
    case 'success': return 'success'
    case 'error': return 'error'
    case 'warning': return 'warning'
    case 'info': return 'info'
    default: return 'info'
  }
}

function getNotificationIcon(type) {
  switch (type) {
    case 'success': return 'mdi-check-circle'
    case 'error': return 'mdi-alert-circle'
    case 'warning': return 'mdi-alert'
    case 'info': return 'mdi-information'
    default: return 'mdi-information'
  }
}
</script>
