# Pinia Stores Dokumentation

Diese Datei erklärt die Struktur und Verwendung der Pinia Stores in der Linxz-Anwendung.

## Store-Struktur

### 1. `user.ts` - Benutzer-Store
Verwaltet alle benutzerbezogenen Daten und Aktionen.

#### State
- `currentUser`: Aktueller eingeloggter Benutzer
- `userLinks`: Array aller Links des Benutzers
- `isLoading`: Loading-State für API-Calls
- `error`: Fehlermeldungen

#### Getters
- `isLoggedIn`: Prüft ob ein Benutzer eingeloggt ist
- `username`: Gibt den Benutzernamen zurück
- `activeLinks`: Gibt nur aktive Links zurück (sortiert)
- `linkCount`: Zählt die aktiven Links

#### Actions
- `login(email, password)`: Benutzer einloggen
- `logout()`: Benutzer ausloggen
- `loadUserLinks()`: Links des Benutzers laden
- `addLink(linkData)`: Neuen Link hinzufügen
- `updateLink(linkId, updates)`: Link aktualisieren
- `deleteLink(linkId)`: Link löschen
- `reorderLinks(linkIds)`: Links neu ordnen

### 2. `app.ts` - App-Store
Verwaltet App-Einstellungen und UI-State.

#### State
- `settings`: App-Einstellungen (Theme, Sprache, etc.)
- `ui`: UI-State (Sidebar, aktuelle Seite, etc.)
- `isLoading`: Globaler Loading-State
- `notifications`: Array der Benachrichtigungen

#### Getters
- `isDarkTheme`: Prüft ob dunkles Theme aktiv ist
- `currentLanguage`: Aktuelle Sprache
- `notificationsEnabled`: Prüft ob Benachrichtigungen aktiv sind

#### Actions
- `setTheme(theme)`: Theme ändern
- `setLanguage(language)`: Sprache ändern
- `toggleNotifications()`: Benachrichtigungen ein-/ausschalten
- `toggleSidebar()`: Sidebar öffnen/schließen
- `addNotification(message, type, timeout)`: Benachrichtigung hinzufügen
- `loadSettings()`: Einstellungen aus localStorage laden

### 3. `types.ts` - Typendefinitionen
Zentrale Typendefinitionen für alle Stores.

## Verwendung in Komponenten

### Store importieren
```vue
<script setup>
import { useUserStore } from '~/stores/user'
import { useAppStore } from '~/stores/app'

const userStore = useUserStore()
const appStore = useAppStore()
</script>
```

### State verwenden
```vue
<template>
  <div v-if="userStore.isLoggedIn">
    Willkommen, {{ userStore.username }}!
  </div>
  
  <div v-if="appStore.isLoading">
    Lade...
  </div>
</template>
```

### Actions aufrufen
```vue
<script setup>
const userStore = useUserStore()
const appStore = useAppStore()

// Login
await userStore.login('test@example.com', 'password')

// Link hinzufügen
await userStore.addLink({
  title: 'Meine Website',
  url: 'https://example.com',
  description: 'Meine persönliche Website',
  isActive: true,
  order: 1
})

// Benachrichtigung anzeigen
appStore.addNotification('Link erfolgreich hinzugefügt!', 'success')
</script>
```

### Computed Properties mit Stores
```vue
<script setup>
import { computed } from 'vue'

const userStore = useUserStore()

// Computed property basierend auf Store-State
const activeLinkCount = computed(() => userStore.linkCount)

// Computed property mit Store-Getter
const sortedLinks = computed(() => userStore.activeLinks)
</script>
```

## Best Practices

1. **Store-Namen**: Verwende immer `use` als Prefix (z.B. `useUserStore`)
2. **Typisierung**: Verwende immer die Typen aus `types.ts`
3. **Error Handling**: Alle Actions sollten try-catch verwenden
4. **Loading States**: Verwende `isLoading` für bessere UX
5. **Notifications**: Verwende `appStore.addNotification()` für Feedback

## Erweiterte Features

### Persistierung (später hinzufügen)
```bash
npm install pinia-plugin-persistedstate
```

### DevTools
Pinia hat eingebaute DevTools für Vue DevTools. Diese sind automatisch aktiviert.

### Hot Module Replacement
Stores unterstützen HMR (Hot Module Replacement) in der Entwicklung.
