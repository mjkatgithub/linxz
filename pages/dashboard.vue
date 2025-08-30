<template>
  <v-container class="py-10">
    <v-row justify="center">
      <v-col cols="12" md="8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1>Dashboard</h1>
          <p class="text-h6">Willkommen, {{ userStore.username }}!</p>
        </div>

        <!-- Links Übersicht -->
        <v-card class="mb-6">
          <v-card-title>
            <v-icon class="mr-2">mdi-link</v-icon>
            Deine Links ({{ userStore.linkCount }})
          </v-card-title>
          <v-card-text>
            <div v-if="userStore.isLoading" class="text-center py-4">
              <v-progress-circular indeterminate />
              <p class="mt-2">Lade Links...</p>
            </div>
            
            <div v-else-if="userStore.activeLinks.length === 0" class="text-center py-4">
              <v-icon size="48" class="mb-2">mdi-link-off</v-icon>
              <p>Noch keine Links vorhanden</p>
              <v-btn color="primary" @click="showAddLinkDialog = true">
                Ersten Link hinzufügen
              </v-btn>
            </div>
            
            <v-list v-else>
              <v-list-item
                v-for="link in userStore.activeLinks"
                :key="link.id"
                :title="link.title"
                :subtitle="link.description"
                :href="link.url"
                target="_blank"
              >
                <template #prepend>
                  <v-icon>mdi-link</v-icon>
                </template>
                <template #append>
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    @click="editLink(link)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    @click="deleteLink(link.id)"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Aktionen -->
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-cog</v-icon>
            Aktionen
          </v-card-title>
          <v-card-text>
            <v-btn
              color="primary"
              class="mr-4 mb-2"
              @click="showAddLinkDialog = true"
            >
              <v-icon class="mr-2">mdi-plus</v-icon>
              Link hinzufügen
            </v-btn>
            
            <v-btn
              color="secondary"
              class="mr-4 mb-2"
              :href="`/${userStore.username}`"
              target="_blank"
            >
              <v-icon class="mr-2">mdi-eye</v-icon>
              Profil ansehen
            </v-btn>
            
            <v-btn
              color="error"
              variant="outlined"
              @click="handleLogout"
            >
              <v-icon class="mr-2">mdi-logout</v-icon>
              Abmelden
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add Link Dialog -->
    <v-dialog v-model="showAddLinkDialog" max-width="500">
      <v-card>
        <v-card-title>Link hinzufügen</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="addNewLink">
            <v-text-field
              v-model="newLink.title"
              label="Titel"
              required
              class="mb-4"
            />
            <v-text-field
              v-model="newLink.url"
              label="URL"
              type="url"
              required
              class="mb-4"
            />
            <v-textarea
              v-model="newLink.description"
              label="Beschreibung (optional)"
              rows="3"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showAddLinkDialog = false">Abbrechen</v-btn>
          <v-btn color="primary" @click="addNewLink">Hinzufügen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { useUserStore } from '~/stores/user'
import { useAppStore } from '~/stores/app'

const userStore = useUserStore()
const appStore = useAppStore()

// Redirect wenn nicht eingeloggt
if (!userStore.isLoggedIn) {
  await navigateTo('/login')
}

// Laden der Links beim Mount
await userStore.loadUserLinks()

// Dialog State
const showAddLinkDialog = ref(false)
const newLink = ref({
  title: '',
  url: '',
  description: ''
})

async function addNewLink() {
  try {
    await userStore.addLink({
      ...newLink.value,
      isActive: true,
      order: userStore.userLinks.length + 1
    })
    
    appStore.addNotification('Link erfolgreich hinzugefügt!', 'success')
    showAddLinkDialog.value = false
    newLink.value = { title: '', url: '', description: '' }
    
  } catch {
    appStore.addNotification('Fehler beim Hinzufügen des Links', 'error')
  }
}

async function deleteLink(linkId) {
  if (confirm('Link wirklich löschen?')) {
    try {
      await userStore.deleteLink(linkId)
      appStore.addNotification('Link gelöscht!', 'success')
    } catch {
      appStore.addNotification('Fehler beim Löschen des Links', 'error')
    }
  }
}

function editLink(_link) {
  // TODO: Edit Dialog implementieren
  appStore.addNotification('Edit-Funktion kommt bald!', 'info')
}

async function handleLogout() {
  userStore.logout()
  appStore.addNotification('Erfolgreich abgemeldet', 'success')
  await navigateTo('/')
}
</script> 