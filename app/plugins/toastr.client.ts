import { defineNuxtPlugin } from '#imports'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

export default defineNuxtPlugin((nuxtApp) => {
  try {
    nuxtApp.vueApp.use(Toast, {
      position: 'top-right',
      timeout: 5000,
      closeOnClick: true,
      pauseOnFocusLoss: true,
      pauseOnHover: true,
      draggable: true,
      draggablePercent: 0.6,
      showCloseButtonOnHover: false,
      hideProgressBar: false,
      closeButton: 'button',
      icon: true,
      rtl: false
    })
  } catch (error) {
    console.error('[toastr.client plugin] Toast installation failed', error)
  }
})
