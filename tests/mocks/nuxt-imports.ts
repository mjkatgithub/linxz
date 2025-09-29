const defineNuxtPlugin = (globalThis as any).defineNuxtPlugin ?? ((plugin: any) => plugin)
const useHead = (globalThis as any).useHead ?? (() => undefined)

export { defineNuxtPlugin, useHead }

