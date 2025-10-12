const defineNuxtPlugin = (globalThis as any).defineNuxtPlugin ?? ((plugin: any) => plugin)
const useHead = (globalThis as any).useHead ?? (() => undefined)

// Bridge common composables used in templates to the #app mock
// These re-exports ensure SFCs compiled to use '#imports' find them.
export { useRoute, useRouter } from '#app'
export { ref } from 'vue'

// Bridge for $fetch auto-import
export const $fetch: any = (...args: any[]) => (globalThis as any).$fetch?.(...args)

export { defineNuxtPlugin, useHead }

