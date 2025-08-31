<template>
  <NuxtLayout>
    <v-container class="py-10">
    <v-row justify="center">
      <v-col cols="12" md="8">
        <!-- Header -->
        <div class="text-center mb-8">
          <v-avatar size="80" class="mb-4">
            <v-img 
              v-if="userStore.currentUser?.avatar" 
              :src="userStore.currentUser.avatar" 
              :alt="userStore.username" 
            />
            <v-icon v-else size="40">mdi-account</v-icon>
          </v-avatar>
          <h1>Dashboard</h1>
          <p class="text-h6">Willkommen, {{ userStore.username }}!</p>
          <p v-if="userStore.currentUser?.name" class="text-body-1">{{ userStore.currentUser.name }}</p>
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
                @click="openLink(link.url)"
              >
                <template #prepend>
                  <v-icon>mdi-link</v-icon>
                </template>
                <template #append>
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    @click.stop="editLink(link)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    @click.stop="deleteLink(link.id)"
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
              color="info"
              variant="outlined"
              class="mr-4 mb-2"
              @click="showProfileDialog = true"
            >
              <v-icon class="mr-2">mdi-account-edit</v-icon>
              Profil bearbeiten
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

    <!-- Edit Link Dialog -->
    <v-dialog v-model="showEditDialog" max-width="500">
      <v-card>
        <v-card-title>Link bearbeiten</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="updateLink">
            <v-text-field
              v-model="editForm.title"
              label="Titel"
              required
              class="mb-4"
            />
            <v-text-field
              v-model="editForm.url"
              label="URL"
              type="url"
              required
              class="mb-4"
            />
            <v-textarea
              v-model="editForm.description"
              label="Beschreibung (optional)"
              rows="3"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showEditDialog = false">Abbrechen</v-btn>
          <v-btn color="primary" @click="updateLink">Speichern</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Profile Edit Dialog -->
    <v-dialog v-model="showProfileDialog" max-width="600">
      <v-card>
        <v-card-title>Profil bearbeiten</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="updateProfile">
            <v-text-field
              v-model="profileForm.username"
              label="Username"
              required
              class="mb-4"
            />
            <v-text-field
              v-model="profileForm.name"
              label="Name (optional)"
              class="mb-4"
            />
            <v-textarea
              v-model="profileForm.bio"
              label="Bio (optional)"
              rows="3"
              class="mb-4"
            />
            <v-text-field
              v-model="profileForm.avatar"
              label="Avatar URL (optional)"
              class="mb-4"
            />
            
            <v-divider class="my-4" />
            
            <h3 class="mb-4">Passwort ändern</h3>
            <v-text-field
              v-model="profileForm.currentPassword"
              label="Aktuelles Passwort"
              type="password"
              class="mb-4"
            />
            <v-text-field
              v-model="profileForm.newPassword"
              label="Neues Passwort"
              type="password"
              class="mb-4"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showProfileDialog = false">Abbrechen</v-btn>
          <v-btn color="primary" @click="updateProfile">Speichern</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
      </v-container>
  </NuxtLayout>
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
const showEditDialog = ref(false)
const showProfileDialog = ref(false)
const newLink = ref({
  title: '',
  url: '',
  description: ''
})
const editForm = ref({
  id: '',
  title: '',
  url: '',
  description: ''
})

// Profile Form
const profileForm = ref({
  username: userStore.currentUser?.username || '',
  name: userStore.currentUser?.name || '',
  bio: userStore.currentUser?.bio || '',
  avatar: userStore.currentUser?.avatar || '',
  currentPassword: '',
  newPassword: ''
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

function editLink(link) {
  // Setze Form-Daten
  editForm.value = {
    id: link.id,
    title: link.title,
    url: link.url,
    description: link.description || ''
  }
  showEditDialog.value = true
}

async function updateLink() {
  try {
    await userStore.updateLink(editForm.value.id, {
      title: editForm.value.title,
      url: editForm.value.url,
      description: editForm.value.description
    })
    
    appStore.addNotification('Link erfolgreich aktualisiert!', 'success')
    showEditDialog.value = false
    
  } catch {
    appStore.addNotification('Fehler beim Aktualisieren des Links', 'error')
  }
}

async function updateProfile() {
  try {
    // Entferne leere Felder
    const updateData = {}
    if (profileForm.value.username) updateData.username = profileForm.value.username
    if (profileForm.value.name) updateData.name = profileForm.value.name
    if (profileForm.value.bio) updateData.bio = profileForm.value.bio
    if (profileForm.value.avatar) updateData.avatar = profileForm.value.avatar
    if (profileForm.value.currentPassword && profileForm.value.newPassword) {
      updateData.currentPassword = profileForm.value.currentPassword
      updateData.newPassword = profileForm.value.newPassword
    }
    
    await userStore.updateProfile(updateData)
    
    appStore.addNotification('Profil erfolgreich aktualisiert!', 'success')
    showProfileDialog.value = false
    
    // Form zurücksetzen
    profileForm.value.currentPassword = ''
    profileForm.value.newPassword = ''
    
  } catch {
    appStore.addNotification('Fehler beim Aktualisieren des Profils', 'error')
  }
}

function openLink(url) {
  // Öffne Link in neuem Tab
  window.open(url, '_blank', 'noopener,noreferrer')
}

async function handleLogout() {
  userStore.logout()
  appStore.addNotification('Erfolgreich abgemeldet', 'success')
  await navigateTo('/')
}
</script> 