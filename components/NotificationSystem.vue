<template>
  <div>
    <!-- Toastr wird automatisch von vue-toastification gerendert -->
  </div>
</template>

<script setup>
import { watch, onMounted } from 'vue'
import { useAppStore } from '~/stores/app'
import { useToast } from 'vue-toastification'

const appStore = useAppStore()
const toast = useToast()

// Einfache Funktion um Notifications anzuzeigen
function showNotification(notification) {
  // Zeige Toast basierend auf dem Typ
  switch (notification.type) {
    case 'success':
      toast.success(notification.message, {
        timeout: notification.timeout || 5000
      })
      break
    case 'error':
      toast.error(notification.message, {
        timeout: notification.timeout || 8000
      })
      break
    case 'warning':
      toast.warning(notification.message, {
        timeout: notification.timeout || 6000
      })
      break
    case 'info':
    default:
      toast.info(notification.message, {
        timeout: notification.timeout || 5000
      })
      break
  }
  
  // Entferne die Notification aus dem Store nach kurzer Verzögerung
  setTimeout(() => {
    appStore.removeNotification(notification.id)
  }, 100)
}

// Watch für neue Notifications und zeige sie als Toast an
watch(() => appStore.notifications, (newNotifications, oldNotifications) => {
  if (newNotifications.length > (oldNotifications?.length || 0)) {
    const latestNotification = newNotifications[newNotifications.length - 1]
    showNotification(latestNotification)
  }
}, { deep: true })

// Initialisierung
onMounted(() => {
  // Komponente ist bereit
})
</script>
