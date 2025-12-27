/**
 * Composable für Datenschutzerklärung
 * Lädt Kontaktdaten und Übersetzungen
 */
export const usePrivacy = () => {
  const route = useRoute()
  const locale = computed(() => {
    // Später mit @nuxtjs/i18n: return useI18n().locale.value
    // Für jetzt: aus URL oder Browser-Sprache
    const lang = route.query.lang as string || 
      (process.client ? navigator.language.split('-')[0] : 'de')
    return ['de', 'en'].includes(lang) ? lang : 'de'
  })

  const contact = ref<{
    name: string
    address: string
    email: string
  } | null>(null)

  const translations = ref<any>(null)

  // Lade Kontaktdaten vom Server
  const loadContact = async () => {
    try {
      const data = await $fetch('/api/privacy/contact')
      contact.value = data
    } catch (error) {
      console.error('Failed to load privacy contact data', error)
      contact.value = {
        name: '[Ihr Name]',
        address: '[Ihre Adresse]',
        email: '[Ihre E-Mail-Adresse]'
      }
    }
  }

  // Lade Übersetzungen
  const loadTranslations = async () => {
    try {
      const lang = locale.value
      const translationsModule = await import(`~/locales/${lang}.json`)
      translations.value = translationsModule.default
    } catch (error) {
      console.error(`Failed to load translations for ${locale.value}`, error)
      // Fallback zu Deutsch
      try {
        const fallback = await import('~/locales/de.json')
        translations.value = fallback.default
      } catch {
        translations.value = null
      }
    }
  }

  // Formatiere Adresse (ersetzt \n mit <br>)
  const formattedAddress = computed(() => {
    if (!contact.value) return ''
    return contact.value.address.replace(/\\n/g, '<br>')
  })

  return {
    locale,
    contact: readonly(contact),
    translations: readonly(translations),
    formattedAddress,
    loadContact,
    loadTranslations
  }
}

