import { useUserStore } from '~/stores/user'

export default defineNuxtPlugin(async () => {
  const userStore = useUserStore()
  
  // Prüfe beim App-Start, ob User bereits eingeloggt ist
  await userStore.checkAuth()
})
