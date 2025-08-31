<template>
  <div>
    <!-- Toastr wird automatisch von vue-toastification gerendert -->
  </div>
</template>

<script setup>
import { useAppStore } from '~/stores/app'
import { useToast } from 'vue-toastification'

const appStore = useAppStore()
const toast = useToast()

// Watch für neue Notifications und zeige sie als Toast an
watch(() => appStore.notifications, (newNotifications, oldNotifications) => {
  if (newNotifications.length > (oldNotifications?.length || 0)) {
    const latestNotification = newNotifications[newNotifications.length - 1]
    
    // Zeige Toast basierend auf dem Typ
    switch (latestNotification.type) {
      case 'success':
        toast.success(latestNotification.message, {
          timeout: latestNotification.timeout || 5000
        })
        break
      case 'error':
        toast.error(latestNotification.message, {
          timeout: latestNotification.timeout || 8000
        })
        break
      case 'warning':
        toast.warning(latestNotification.message, {
          timeout: latestNotification.timeout || 6000
        })
        break
      case 'info':
      default:
        toast.info(latestNotification.message, {
          timeout: latestNotification.timeout || 5000
        })
        break
    }
    
    // Entferne die Notification aus dem Store nach kurzer Verzögerung
    setTimeout(() => {
      appStore.removeNotification(latestNotification.id)
    }, 100)
  }
}, { deep: true })
</script>
