# Feature Request: Gravatar Profiles API Integration for Automatic Link Creation

## Description

When setting up a new user account, optionally use the Gravatar Profiles API to automatically create initial links from the user's Gravatar profile.

## Use Case

Many users already have a Gravatar profile with links to their social media profiles, websites, etc. Instead of entering these manually, they can optionally use the Gravatar Profiles API during registration or in profile settings to automatically import these links.

## Technical Details

### Prerequisites
- Gravatar API Key is already available (in `.env` as `GRAVATAR_API_KEY`)
- User has `useGravatar` enabled
- User has a Gravatar profile with links

### Implementation

1. **During Registration:**
   - Optional: Checkbox "Import links from Gravatar profile"
   - If enabled: After successful registration, call Gravatar Profiles API
   - Import links from Gravatar profile

2. **In Profile Settings:**
   - Button "Import links from Gravatar"
   - Loads current links from Gravatar profile
   - Shows preview of links to be imported
   - User can select which ones to import

### API Endpoint

```
GET https://api.gravatar.com/v3/profiles/{hash}
Authorization: Bearer {GRAVATAR_API_KEY}
```

### Data Structure

The Gravatar Profiles API returns:
- `profileUrl` - Link to profile
- `accounts` - Array of social media accounts
- `urls` - Array of URLs/links

### Example Implementation

```typescript
// server/api/users/import-gravatar-links.post.ts
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const config = useRuntimeConfig()
  
  // Get Gravatar profile
  const hash = getGravatarHash(user.email)
  const profile = await $fetch(`https://api.gravatar.com/v3/profiles/${hash}`, {
    headers: {
      'Authorization': `Bearer ${config.gravatarApiKey}`
    }
  })
  
  // Convert Gravatar links to Linxz links
  const links = []
  // ... Conversion logic
  
  // Save links to DB
  // ...
})
```

## Benefits

- Faster onboarding experience for new users
- Less manual input required
- Users can leverage their existing Gravatar links

## Open Questions

- [ ] Should imported links be automatically activated?
- [ ] What happens with duplicates (same URL already exists)?
- [ ] Should imported links be marked as "imported from Gravatar"?
- [ ] Should there be an option to regularly synchronize links?

## Priority

Medium - Nice-to-have feature, not critical for MVP

## Labels

- `enhancement`
- `gravatar`
- `api-integration`
- `user-experience`
