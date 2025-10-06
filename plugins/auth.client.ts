import { defineNuxtPlugin } from '#imports'
import { useUserStore } from '~/stores/user'

export default defineNuxtPlugin(async () => {
  const userStore = useUserStore()
  
  // Pruefe beim App-Start, ob User bereits eingeloggt ist
  try {
    await userStore.checkAuth()
  } catch (error) {
    console.error('[auth.client plugin] checkAuth failed', error)
  }
})

