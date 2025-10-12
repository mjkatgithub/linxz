// Minimal shim so Vite can resolve "#app" during tests.
// The actual implementation is mocked in tests/setup.ts via vi.mock('#app', ...).
export const useRoute = () => ({ params: {}, query: {} })
export const useRouter = () => ({ push: () => {}, replace: () => {}, go: () => {}, back: () => {}, forward: () => {} })
export const navigateTo = () => {}
export const useRuntimeConfig = () => ({ public: {} })
export const useNuxtApp = () => ({ $router: useRouter() })

