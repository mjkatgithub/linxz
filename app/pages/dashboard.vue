<template>
  <NuxtLayout>
    <v-container class="py-10">
      <v-row justify="center">
        <v-col cols="12" md="8">
          <!-- Header -->
          <div class="text-center mb-8">
            <v-avatar size="80" class="mb-4">
              <v-img
                v-if="avatarUrl"
                :src="avatarUrl"
                :alt="userStore.username"
              />
              <v-icon v-else size="40">mdi-account</v-icon>
            </v-avatar>
            <h1>Dashboard</h1>
            <p class="text-h6">Welcome, {{ userStore.username }}!</p>
            <p v-if="userStore.currentUser?.name" class="text-body-1">
              {{ userStore.currentUser.name }}
            </p>

            <div class="mt-4">
              <v-btn
                variant="text"
                color="primary"
                to="/"
                prepend-icon="mdi-home"
              >
                To Homepage
              </v-btn>
            </div>
          </div>

          <!-- Links Übersicht -->
          <v-card class="mb-6">
            <v-card-title>
              <v-icon class="mr-2">mdi-link</v-icon>
              Your Links ({{ userStore.linkCount }})
            </v-card-title>
            <v-card-text>
              <div v-if="userStore.isLoading" class="text-center py-4">
                <v-progress-circular indeterminate />
                <p class="mt-2">Loading links...</p>
              </div>

              <div
                v-else-if="userStore.activeLinks.length === 0"
                class="text-center py-4"
              >
                <v-icon size="48" class="mb-2">mdi-link-off</v-icon>
                <p>No links yet</p>
                <v-btn color="primary" @click="showAddLinkDialog = true">
                  Add First Link
                </v-btn>
              </div>

              <v-list v-else>
                <v-list-item
                  v-for="link in userStore.activeLinks"
                  :key="link.id"
                  :title="link.title"
                  :subtitle="link.description"
                  style="cursor: pointer"
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
              Actions
            </v-card-title>
            <v-card-text>
              <v-btn
                color="primary"
                class="mr-4 mb-2"
                @click="showAddLinkDialog = true"
              >
                <v-icon class="mr-2">mdi-plus</v-icon>
                Add Link
              </v-btn>

              <v-btn
                color="secondary"
                class="mr-4 mb-2"
                :to="`/${userStore.username}`"
              >
                <v-icon class="mr-2">mdi-eye</v-icon>
                View Profile
              </v-btn>

              <v-btn
                color="info"
                variant="outlined"
                class="mr-4 mb-2"
                @click="openProfileDialog"
              >
                <v-icon class="mr-2">mdi-account-edit</v-icon>
                Edit Profile
              </v-btn>

              <v-btn
                color="error"
                variant="outlined"
                class="mr-4 mb-2"
                @click="handleLogout"
              >
                <v-icon class="mr-2">mdi-logout</v-icon>
                Sign Out
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Add Link Dialog -->
      <v-dialog v-model="showAddLinkDialog" max-width="500">
        <v-card>
          <v-card-title>Add Link</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="addNewLink">
              <v-text-field
                v-model="newLink.title"
                label="Title"
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
                label="Description (optional)"
                rows="3"
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="showAddLinkDialog = false">Cancel</v-btn>
            <v-btn color="primary" @click="addNewLink">Add</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Edit Link Dialog -->
      <v-dialog v-model="showEditDialog" max-width="500">
        <v-card>
          <v-card-title>Edit Link</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="updateLink">
              <v-text-field
                v-model="editForm.title"
                label="Title"
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
                label="Description (optional)"
                rows="3"
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="showEditDialog = false">Cancel</v-btn>
            <v-btn color="primary" @click="updateLink">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Profile Edit Dialog -->
      <v-dialog v-model="showProfileDialog" max-width="600">
        <v-card>
          <v-card-title>Edit Profile</v-card-title>
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

              <v-divider class="my-4" />

              <div class="d-flex align-center mb-4">
                <v-checkbox
                  v-model="profileForm.useGravatar"
                  label="Use Gravatar"
                  hide-details
                  class="mr-2"
                />
                <NuxtLink
                  to="/privacy?lang=en"
                  target="_blank"
                  class="text-caption text-decoration-none"
                >
                  (Privacy Policy)
                </NuxtLink>
              </div>

              <v-divider class="my-4" />

              <h3 class="mb-4">Change Password</h3>
              <v-text-field
                v-model="profileForm.currentPassword"
                label="Current Password"
                type="password"
                class="mb-4"
              />
              <v-text-field
                v-model="profileForm.newPassword"
                label="New Password"
                type="password"
                class="mb-4"
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="showProfileDialog = false">Cancel</v-btn>
            <v-btn color="primary" @click="updateProfile">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </NuxtLayout>
</template>

<script setup>
import { onMounted, computed } from "vue";
import { useUserStore } from "~/stores/user";
import { useAppStore } from "~/stores/app";
import { getGravatarUrl } from "~/lib/gravatar";

defineOptions({
  name: "DashboardPage",
});

const userStore = useUserStore();
const appStore = useAppStore();

const avatarUrl = computed(() => {
  const user = userStore.currentUser;
  if (!user) return null;

  if (user.useGravatar && user.email) {
    return getGravatarUrl(user.email, 80);
  }

  return user.avatar || null;
});

// Laden der Links beim Mount
onMounted(async () => {
  // Redirect wenn nicht eingeloggt
  if (!userStore.isLoggedIn) {
    await navigateTo("/login");
    return;
  }

  await userStore.loadUserLinks();
});

// Dialog State
const showAddLinkDialog = ref(false);
const showEditDialog = ref(false);
const showProfileDialog = ref(false);
const newLink = ref({
  title: "",
  url: "",
  description: "",
});
const editForm = ref({
  id: "",
  title: "",
  url: "",
  description: "",
});

// Profile Form
const profileForm = ref({
  username: userStore.currentUser?.username || "",
  name: userStore.currentUser?.name || "",
  bio: userStore.currentUser?.bio || "",
  useGravatar: userStore.currentUser?.useGravatar || false,
  currentPassword: "",
  newPassword: "",
});

async function addNewLink() {
  try {
    await userStore.addLink({
      ...newLink.value,
      isActive: true,
      order: userStore.userLinks.length + 1,
    });

    appStore.addNotification("Link added successfully!", "success");
    showAddLinkDialog.value = false;
    newLink.value = { title: "", url: "", description: "" };
  } catch {
    appStore.addNotification("Error adding link", "error");
  }
}

async function deleteLink(linkId) {
  if (confirm("Really delete link?")) {
    try {
      await userStore.deleteLink(linkId);
      appStore.addNotification("Link deleted!", "success");
    } catch {
      appStore.addNotification("Error deleting link", "error");
    }
  }
}

function editLink(link) {
  // Setze Form-Daten
  editForm.value = {
    id: link.id,
    title: link.title,
    url: link.url,
    description: link.description || "",
  };
  showEditDialog.value = true;
}

function openProfileDialog() {
  // Aktualisiere Formular mit aktuellen User-Daten
  profileForm.value = {
    username: userStore.currentUser?.username || "",
    name: userStore.currentUser?.name || "",
    bio: userStore.currentUser?.bio || "",
    useGravatar: userStore.currentUser?.useGravatar || false,
    currentPassword: "",
    newPassword: "",
  };
  showProfileDialog.value = true;
}

async function updateLink() {
  try {
    await userStore.updateLink(editForm.value.id, {
      title: editForm.value.title,
      url: editForm.value.url,
      description: editForm.value.description,
    });

    appStore.addNotification("Link updated successfully!", "success");
    showEditDialog.value = false;
  } catch {
    appStore.addNotification("Error updating link", "error");
  }
}

async function updateProfile() {
  try {
    // Entferne leere Felder
    const updateData = {};
    if (profileForm.value.username)
      updateData.username = profileForm.value.username;
    if (profileForm.value.name !== undefined)
      updateData.name = profileForm.value.name;
    if (profileForm.value.bio !== undefined)
      updateData.bio = profileForm.value.bio;
    if (profileForm.value.useGravatar !== undefined) {
      updateData.useGravatar = profileForm.value.useGravatar;
    }
    if (profileForm.value.currentPassword && profileForm.value.newPassword) {
      updateData.currentPassword = profileForm.value.currentPassword;
      updateData.newPassword = profileForm.value.newPassword;
    }

    await userStore.updateProfile(updateData);

    appStore.addNotification("Profile updated successfully!", "success");
    showProfileDialog.value = false;

    // Form zurücksetzen
    profileForm.value.currentPassword = "";
    profileForm.value.newPassword = "";
  } catch {
    appStore.addNotification("Error updating profile", "error");
  }
}

function openLink(url) {
  // Öffne Link in neuem Tab
  window.open(url, "_blank", "noopener,noreferrer");
}

async function handleLogout() {
  userStore.logout();
  appStore.addNotification("Signed out successfully", "success");
  await navigateTo("/");
}
</script>
