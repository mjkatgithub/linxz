<template>
  <NuxtLayout>
    <v-container class="py-10">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <v-card>
            <v-card-title class="text-h4 mb-4 d-flex justify-space-between align-center">
              <span>{{ t?.privacy?.title || 'Datenschutzerklärung' }}</span>
              <v-chip-group>
                <v-chip
                  :color="locale === 'de' ? 'primary' : 'default'"
                  @click="switchLanguage('de')"
                  size="small"
                >
                  DE
                </v-chip>
                <v-chip
                  :color="locale === 'en' ? 'primary' : 'default'"
                  @click="switchLanguage('en')"
                  size="small"
                >
                  EN
                </v-chip>
              </v-chip-group>
            </v-card-title>
            <v-card-text>
              <div class="text-body-1" v-if="t?.privacy">
                <p class="mb-4">
                  <strong>{{ t.privacy.lastUpdated }}:</strong> 
                  {{ new Date().toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US') }}
                </p>

                <!-- 1. Verantwortlicher -->
                <h2 class="text-h5 mb-3 mt-6">
                  {{ t.privacy.sections.responsible.title }}
                </h2>
                <p class="mb-4">
                  {{ t.privacy.sections.responsible.text }}
                </p>
                <p class="mb-4" v-if="contact">
                  {{ contact.name }}<br>
                  <span v-html="formattedAddress"></span><br>
                  {{ contact.email }}
                </p>

                <!-- 2. Datenerfassung -->
                <h2 class="text-h5 mb-3 mt-6">
                  {{ t.privacy.sections.dataCollection.title }}
                </h2>
                
                <!-- 2.1 Registrierung -->
                <h3 class="text-h6 mb-2 mt-4">
                  {{ t.privacy.sections.dataCollection.registration.title }}
                </h3>
                <p class="mb-4">
                  {{ t.privacy.sections.dataCollection.registration.text }}
                </p>
                <ul class="mb-4 privacy-list">
                  <li v-for="item in t.privacy.sections.dataCollection.registration.items" 
                      :key="item">
                    {{ item }}
                  </li>
                </ul>
                <p class="mb-4">
                  {{ t.privacy.sections.dataCollection.registration.legalBasis }}
                </p>

                <!-- 2.2 Gravatar -->
                <h3 class="text-h6 mb-2 mt-4">
                  {{ t.privacy.sections.dataCollection.gravatar.title }}
                </h3>
                <p class="mb-4">
                  {{ t.privacy.sections.dataCollection.gravatar.description }}
                </p>
                <p class="mb-4">
                  <strong>{{ t.privacy.sections.dataCollection.gravatar.dataProcessed.title }}</strong><br>
                  {{ t.privacy.sections.dataCollection.gravatar.dataProcessed.text }}
                </p>
                <p class="mb-4">
                  <strong>{{ t.privacy.sections.dataCollection.gravatar.purpose.title }}</strong><br>
                  {{ t.privacy.sections.dataCollection.gravatar.purpose.text }}
                </p>
                <p class="mb-4">
                  <strong>{{ t.privacy.sections.dataCollection.gravatar.legalBasis.title }}</strong><br>
                  {{ t.privacy.sections.dataCollection.gravatar.legalBasis.text }}
                </p>
                <p class="mb-4">
                  <strong>{{ t.privacy.sections.dataCollection.gravatar.thirdParty.title }}</strong><br>
                  {{ t.privacy.sections.dataCollection.gravatar.thirdParty.company }}<br>
                  {{ t.privacy.sections.dataCollection.gravatar.thirdParty.address }}<br>
                  {{ t.privacy.sections.dataCollection.gravatar.thirdParty.city }}<br>
                  {{ t.privacy.sections.dataCollection.gravatar.thirdParty.country }}
                </p>
                <p class="mb-4">
                  <strong>{{ t.privacy.sections.dataCollection.gravatar.dataTransfer.title }}</strong><br>
                  {{ t.privacy.sections.dataCollection.gravatar.dataTransfer.text }}
                </p>
                <p class="mb-4">
                  <strong>{{ t.privacy.sections.dataCollection.gravatar.optOut.title }}</strong><br>
                  {{ t.privacy.sections.dataCollection.gravatar.optOut.text }}
                </p>
                <p class="mb-4">
                  {{ t.privacy.sections.dataCollection.gravatar.moreInfo }}
                  <a href="https://automattic.com/privacy/" target="_blank" 
                     rel="noopener noreferrer">
                    https://automattic.com/privacy/
                  </a>
                </p>

                <!-- 3. Speicherdauer -->
                <h2 class="text-h5 mb-3 mt-6">
                  {{ t.privacy.sections.storageDuration.title }}
                </h2>
                <p class="mb-4">
                  {{ t.privacy.sections.storageDuration.text }}
                </p>

                <!-- 4. Rechte -->
                <h2 class="text-h5 mb-3 mt-6">
                  {{ t.privacy.sections.rights.title }}
                </h2>
                <p class="mb-4">{{ t.privacy.sections.rights.intro }}</p>
                <ul class="mb-4 privacy-list">
                  <li>
                    <strong>{{ t.privacy.sections.rights.items.access.split(':')[0] }}:</strong>
                    {{ t.privacy.sections.rights.items.access.split(':')[1] }}
                  </li>
                  <li>
                    <strong>{{ t.privacy.sections.rights.items.rectification.split(':')[0] }}:</strong>
                    {{ t.privacy.sections.rights.items.rectification.split(':')[1] }}
                  </li>
                  <li>
                    <strong>{{ t.privacy.sections.rights.items.erasure.split(':')[0] }}:</strong>
                    {{ t.privacy.sections.rights.items.erasure.split(':')[1] }}
                  </li>
                  <li>
                    <strong>{{ t.privacy.sections.rights.items.restriction.split(':')[0] }}:</strong>
                    {{ t.privacy.sections.rights.items.restriction.split(':')[1] }}
                  </li>
                  <li>
                    <strong>{{ t.privacy.sections.rights.items.objection.split(':')[0] }}:</strong>
                    {{ t.privacy.sections.rights.items.objection.split(':')[1] }}
                  </li>
                  <li>
                    <strong>{{ t.privacy.sections.rights.items.portability.split(':')[0] }}:</strong>
                    {{ t.privacy.sections.rights.items.portability.split(':')[1] }}
                  </li>
                  <li>
                    <strong>{{ t.privacy.sections.rights.items.complaint.split(':')[0] }}:</strong>
                    {{ t.privacy.sections.rights.items.complaint.split(':')[1] }}
                  </li>
                </ul>

                <!-- 5. Kontakt -->
                <h2 class="text-h5 mb-3 mt-6">
                  {{ t.privacy.sections.contact.title }}
                </h2>
                <p class="mb-4" v-if="contact">
                  {{ t.privacy.sections.contact.text }}
                  <a :href="`mailto:${contact.email}`">{{ contact.email }}</a>
                </p>

                <!-- 6. Änderungen -->
                <h2 class="text-h5 mb-3 mt-6">
                  {{ t.privacy.sections.changes.title }}
                </h2>
                <p class="mb-4">
                  {{ t.privacy.sections.changes.text }}
                </p>
              </div>
              <div v-else class="text-center py-8">
                <v-progress-circular indeterminate />
                <p class="mt-4">Loading...</p>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="primary" to="/">
                {{ t?.privacy?.backToHome || 'Zur Startseite' }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </NuxtLayout>
</template>

<script setup>
// Seite explizit als SSR markieren
definePageMeta({
  ssr: true
})

const route = useRoute()
const router = useRouter()

// Privacy Composable verwenden
const { 
  locale, 
  contact, 
  translations: t, 
  formattedAddress,
  loadContact, 
  loadTranslations 
} = usePrivacy()

// Sprache wechseln
const switchLanguage = (lang) => {
  router.push({ query: { ...route.query, lang } })
}

// Lade Daten sowohl beim SSR als auch beim Client
const loadData = async () => {
  await Promise.all([
    loadContact(),
    loadTranslations()
  ])
}

// Lade Daten sofort (funktioniert SSR und Client)
await loadData()

// Lade Übersetzungen neu wenn Sprache wechselt
watch(locale, () => {
  loadTranslations()
})

useHead({
  title: computed(() => 
    `${t.value?.privacy?.title || 'Datenschutzerklärung'} - Linxz`
  ),
  meta: [
    {
      name: 'description',
      content: computed(() => 
        t.value?.privacy?.title || 'Datenschutzerklärung für die Linxz-Anwendung'
      )
    }
  ]
})
</script>

<style scoped>
.privacy-list {
  padding-left: 1.5rem;
}

.privacy-list li {
  margin-bottom: 0.5rem;
}
</style>
