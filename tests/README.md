# Test Suite Documentation

## Übersicht

Dieses Test-Setup bietet eine umfassende Test-Suite für die Nuxt-Anwendung mit folgenden Features:

- **100% Code Coverage** als Ziel
- **BDD (Behavior-Driven Development)** mit Cucumber und Gherkin
- **Chai should-style assertions** für chain-capable BDD
- **Nuxt Test Utils** für Vue-Komponenten-Tests
- **Vitest** als Test-Runner
- **Playwright** für E2E-Tests
- **API-Tests** für alle Server-Endpoints

## Test-Architektur

### 1. Unit Tests
- **Komponenten**: Vue-Komponenten mit `@vue/test-utils`
- **Stores**: Pinia-Stores mit Mock-Daten
- **Utilities**: Hilfsfunktionen und Libraries

### 2. Integration Tests
- **API-Endpoints**: Server-API mit Mock-Datenbank
- **Authentication**: Login/Logout-Flows
- **Database**: Prisma-Interaktionen

### 3. E2E Tests
- **User Flows**: Vollständige Benutzer-Journeys
- **Browser Automation**: Mit Playwright
- **Cucumber**: BDD-Szenarien in natürlicher Sprache

## Test-Struktur

```
tests/
├── setup.ts                 # Globale Test-Konfiguration
├── features/                # Cucumber Feature-Dateien
│   ├── user-authentication.feature
│   ├── link-management.feature
│   └── user-profile.feature
├── step-definitions/        # Cucumber Step-Definitionen
│   └── auth.steps.ts
├── components/              # Komponenten-Tests
│   └── NotificationSystem.test.ts
├── stores/                  # Store-Tests
│   └── user.test.ts
├── api/                     # API-Tests
│   ├── auth.test.ts
│   └── links.test.ts
├── e2e/                     # E2E-Tests
│   └── cucumber-runner.ts
├── utils/                   # Test-Utilities
│   ├── test-helpers.ts
│   └── api-test-utils.ts
└── coverage-report.md       # Coverage-Dokumentation
```

## Verwendung

### Tests ausführen

```bash
# Alle Tests ausführen
npm run test:all

# Tests im Watch-Modus
npm run test:watch

# Tests mit UI
npm run test:ui

# Nur Coverage
npm run test:coverage

# E2E-Tests
npm run test:e2e
```

### Test schreiben

#### 1. Komponenten-Test

```typescript
import { describe, it, expect } from 'vitest'
import { setupTest } from '~/tests/utils/test-helpers'
import MyComponent from '~/components/MyComponent.vue'

describe('MyComponent', () => {
  let testHelper: any

  beforeEach(() => {
    testHelper = setupTest()
  })

  it('should render correctly', () => {
    const wrapper = testHelper.mountComponent(MyComponent)
    expect(wrapper.exists()).to.be.true
  })
})
```

#### 2. Store-Test

```typescript
import { describe, it, expect } from 'vitest'
import { setupTest } from '~/tests/utils/test-helpers'
import { useUserStore } from '~/stores/user'

describe('User Store', () => {
  let userStore: any
  let testHelper: any

  beforeEach(() => {
    testHelper = setupTest()
    userStore = testHelper.getUserStore()
  })

  it('should authenticate user', () => {
    const user = createMockUser()
    userStore.setUser(user)
    userStore.setAuthenticated(true)
    
    expect(userStore.isAuthenticated).to.be.true
  })
})
```

#### 3. API-Test

```typescript
import { describe, it, expect } from 'vitest'
import { setupApiTest } from '~/tests/utils/api-test-utils'

describe('Auth API', () => {
  let apiHelper: any

  beforeEach(() => {
    apiHelper = setupApiTest()
  })

  it('should login with valid credentials', async () => {
    await apiHelper.testPost('/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    }, 200, { success: true })
  })
})
```

#### 4. BDD-Feature

```gherkin
Feature: User Authentication
  As a user
  I want to be able to login
  So that I can access my account

  Scenario: Successful login
    Given I am on the login page
    When I fill in the login form with:
      | Field    | Value              |
      | email    | test@example.com   |
      | password | password123        |
    And I submit the form
    Then I should be redirected to the dashboard
    And I should be authenticated
```

## BDD mit Chai should-style

Das Setup verwendet Chai mit should-style assertions für chain-capable BDD:

```typescript
// Chain-capable assertions
expect(user).to.exist
expect(user.name).to.equal('Test User')
expect(user.isActive).to.be.true
expect(links).to.have.length(3)
expect(response.status).to.be.greaterThan(200)

// Should-style (wenn global verfügbar)
user.should.exist
user.name.should.equal('Test User')
user.isActive.should.be.true
links.should.have.length(3)
```

## Coverage-Konfiguration

Die Coverage ist auf 100% für alle Metriken konfiguriert:

- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%
- **Statements**: 100%

Coverage-Reports werden in `coverage/` generiert:
- HTML-Report: `coverage/index.html`
- LCOV: `coverage/lcov.info`
- JSON: `coverage/coverage-final.json`

## Mock-Strategien

### 1. API-Mocks
```typescript
// Mock fetch responses
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve(mockData)
})
```

### 2. Store-Mocks
```typescript
// Mock Pinia stores
const mockStore = {
  user: null,
  isAuthenticated: false,
  setUser: vi.fn(),
  setAuthenticated: vi.fn()
}
```

### 3. Component-Mocks
```typescript
// Mock Nuxt components
const defaultOptions = {
  global: {
    stubs: {
      'nuxt-link': true,
      'nuxt-page': true
    }
  }
}
```

## Best Practices

### 1. Test-Organisation
- Ein Test pro Datei für Komponenten
- Gruppierung nach Funktionalität
- Klare, beschreibende Test-Namen

### 2. BDD-Ansatz
- Feature-Dateien in natürlicher Sprache
- Step-Definitionen wiederverwendbar
- Business-Logic im Fokus

### 3. Coverage
- 100% Coverage als Ziel
- Sinnvolle Tests, nicht nur Coverage
- Edge Cases abdecken

### 4. Performance
- Parallele Test-Ausführung
- Schnelle Unit-Tests
- Separate E2E-Tests

## Troubleshooting

### Häufige Probleme

1. **Import-Fehler**: Stelle sicher, dass alle Pfade korrekt sind
2. **Mock-Probleme**: Überprüfe Mock-Setup in `setup.ts`
3. **Coverage-Probleme**: Überprüfe `vitest.config.ts` Konfiguration
4. **E2E-Probleme**: Stelle sicher, dass die App läuft

### Debug-Tipps

```bash
# Tests mit Debug-Output
npm run test -- --reporter=verbose

# Einzelnen Test ausführen
npm run test -- --run NotificationSystem.test.ts

# Coverage für spezifische Datei
npm run test:coverage -- --reporter=text --reporter=html
```

## Erweiterung

### Neue Tests hinzufügen

1. **Komponenten-Test**: Erstelle `tests/components/ComponentName.test.ts`
2. **Store-Test**: Erstelle `tests/stores/storeName.test.ts`
3. **API-Test**: Erstelle `tests/api/endpoint.test.ts`
4. **Feature**: Erstelle `tests/features/feature-name.feature`

### Neue Utilities

Erweitere `tests/utils/` mit neuen Helper-Funktionen für spezifische Test-Szenarien.

## CI/CD Integration

```yaml
# GitHub Actions Beispiel
- name: Run Tests
  run: |
    npm run test:run
    npm run test:coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

Dieses Test-Setup bietet eine solide Grundlage für qualitativ hochwertige Tests mit modernen Tools und BDD-Praktiken.

