# EcoEats — Campus Food Rescue

Multi-platform Expo application for rescuing surplus food on campus. Built with Expo Router, TypeScript, NativeWind, and Supabase.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run ios     # iOS Simulator
npm run android # Android Emulator
npm run web     # Web browser
```

## 📱 Platforms

- **iOS** - Apple Maps via react-native-maps
- **Android** - Google Maps via react-native-maps
- **Web** - Works in any browser via Expo Router Web

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 52 + Expo Router |
| Language | TypeScript (strict mode) |
| Styling | NativeWind (Tailwind CSS for RN) |
| State | Zustand + React Context |
| Auth | Better Auth (magic link) |
| Database | Supabase PostgreSQL |
| Maps | react-native-maps |
| Icons | Phosphor React Native |

## 📁 Project Structure

```
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # Root layout with providers
│   ├── (auth)/             # Auth screens (not in tab bar)
│   │   ├── login.tsx       # Magic link login
│   │   ├── onboarding.tsx  # Role selection
│   │   └── auth/callback.tsx # Deep link handler
│   ├── (tabs)/             # Tab navigation
│   │   ├── index.tsx       # Feed (home)
│   │   ├── map.tsx         # Map view
│   │   ├── post.tsx        # Create listing
│   │   ├── claims.tsx      # Your claims
│   │   ├── impact.tsx      # Impact stats
│   │   └── profile.tsx     # User profile
│   └── +not-found.tsx      # 404 page
├── src/
│   ├── components/
│   │   ├── ui/             # Generic UI (Button, Card, Input, Badge, Spinner)
│   │   └── features/       # Domain components (ListingCard)
│   ├── services/           # API layer (Supabase, auth-client)
│   ├── stores/             # Zustand stores (listings, cart)
│   ├── contexts/           # React contexts (Auth, Toast)
│   ├── types/              # TypeScript types (database, models, api)
│   └── utils/              # Utilities (formatters, validators, etc.)
├── workers/auth/           # Cloudflare Worker for Better Auth
└── assets/                 # Images and fonts
```

## 🔧 Environment Setup

Create `.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_AUTH_URL=https://auth.ecoeats.app
```

## ✅ Verification

Run all checks before committing:

```bash
# TypeScript type check
npx tsc --noEmit

# Biome linting and formatting
npx biome check .

# Find unused exports
npx knip
```

## 🔐 Authentication Flow

1. User enters email on login screen
2. Better Auth sends magic link via email
3. User clicks link → opens app via deep link (`ecoeats://auth/callback?token=xxx`)
4. App verifies token, creates session
5. User selects role (student/organizer) on first login
6. Redirected to main feed

## 📊 State Management

| Store | Purpose | Persistence |
|-------|---------|--------------|
| `useListingsStore` | Active listings with realtime | Memory only |
| `useCartStore` | Cart items | AsyncStorage |
| `AuthProvider` | Session + profile | SecureStore |
| `ToastProvider` | Notifications | Memory only |

## 🗺 Maps

Platform-specific map implementations:

- **iOS**: Apple Maps (no API key needed)
- **Android**: Google Maps (requires API key in app.json)
- **Web**: Leaflet (keep existing implementation)

## 🚢 Deployment

### Mobile (EAS Build)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for stores
eas build --platform ios
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Web

```bash
# Build web version
npx expo export --platform web

# Deploy to any static host
```

### Auth Worker (Cloudflare)

```bash
cd workers/auth
wrangler deploy
```

## 🧪 Development

### Database Schema

The app expects these Supabase tables:
- `users` - User profiles with role and impact stats
- `listings` - Food listings with location and expiry
- `claims` - Food claims with reservation system

See `workers/auth/schema.sql` for auth tables.

### Realtime

Listings and claims use Supabase Realtime for live updates:
- Automatic subscription on feed mount
- Cleanup on unmount via `useListingsSubscription()`

## 📝 Notes

- **NativeWind v4**: Uses `className` prop directly (no `styled()` wrapper)
- **Expo Router**: File-based routing with typed routes
- **SecureStore**: Tokens stored securely on device
- **Biome**: Used for linting and formatting (replaced ESLint/Prettier)

## 🚧 Remaining Implementation

The core migration from React PWA to Expo is complete. The following features still need implementation:

### High Priority

| Feature | Status | Notes |
|---------|--------|-------|
| **Map View** | Placeholder | Need platform-specific implementations (iOS: Apple Maps, Android: Google Maps, Web: Leaflet) |
| **Post Listing Form** | Placeholder | Create listing UI for organizers |
| **Claim Flow UI** | Services done | Need modal/sheet for claim confirmation and pickup |

### Medium Priority

| Feature | Status | Notes |
|---------|--------|-------|
| **Impact Dashboard** | Placeholder | Stats visualization with charts |
| **Filter Bar** | Services done | Dietary/time/radius filters in feed |
| **Profile Edit** | Services done | Update name, dietary prefs, avatar |

### Low Priority

| Feature | Status | Notes |
|---------|--------|-------|
| **useLocation hook** | Not created | GPS via expo-location |
| **useOnlineStatus hook** | Not created | Network detection via NetInfo |
| **Constants** | Hardcoded | routes.ts, categories.ts extraction |

### Testing & Deployment

| Phase | Status |
|-------|--------|
| iOS Simulator testing | ❌ Not started |
| Android Emulator testing | ❌ Not started |
| Web browser testing | ❌ Not started |
| EAS build configuration | ❌ Not started |
| App Store submission | ❌ Not started |
| Google Play submission | ❌ Not started |

### Implementation Order (Recommended)

1. **Map View** - Core feature, enables location-based discovery
2. **Claim Flow UI** - Completes the claim → pickup → rating loop
3. **Post Listing Form** - Enables organizers to create listings
4. **Impact Dashboard** - Gamification and user engagement
5. **Profile Edit** - User settings
6. **Platform Testing** - Verify on all 3 platforms
7. **Store Deployment** - App Store + Google Play

See `docs/superpowers/specs/2026-04-08-expo-migration-design.md` and `docs/superpowers/plans/2026-04-08-expo-migration.md` for full migration details.

## 📄 License

MIT
