# EcoEats — Campus Food Rescue

Multi-platform Expo application for rescuing surplus food on campus. Built with Expo Router, TypeScript, NativeWind, and Supabase.

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun start

# Run on specific platform
bun run ios     # iOS Simulator
bun run android # Android Emulator
bun run web     # Web browser
```

## 📱 Platforms

- **iOS** - Apple Maps via react-native-maps
- **Android** - Google Maps via react-native-maps
- **Web** - Works in any browser via Expo Router Web

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 55 + Expo Router |
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
bunx tsc --noEmit

# Biome linting and formatting
bunx biome check .

# Find unused exports
bunx knip
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
bun install -g eas-cli

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
- **TailwindCSS version**: keep on **v3** in this repo (NativeWind Metro integration is v3-only here)
- **Expo Router**: file-based routing with typed routes
- **Biome**: linting + formatting (replaces ESLint/Prettier)

## 🔄 Dependency Upgrade Status

Dependencies were upgraded and validated using Expo's recommended flow:

1. `bun update --latest`
2. `bunx expo install --fix` (re-align to SDK-compatible native versions)
3. `bunx expo-doctor`

### Important dependency policy

For Expo apps, "latest" means **latest compatible with the current Expo SDK** for native modules.  
This repo is now on the latest SDK 55-compatible dependency set.

## ✅ What was re-verified after upgrades

- Type-check and lint pass (`bunx tsc --noEmit`, `bunx biome check .`)
- Expo doctor passes (`bunx expo-doctor`)
- Web runtime boots on `http://localhost:8081` without runtime overlay errors
- Browser automation smoke checks pass for unauth + auth-gated routes

## 🛡 Edge Cases Addressed

| Area | Edge case | Resolution |
|------|-----------|------------|
| Auth redirect guard | Route-group path mismatches caused blank/loop states | Guard now checks route groups correctly and redirects via public paths (`/login`, `/`) |
| Auth callback | Invalid token/errors could surface runtime overlay | Callback now handles errors safely and redirects with toast feedback |
| Better Auth endpoints | Legacy endpoint/method mismatch risk after dependency upgrades | Client aligned to Better Auth magic-link routes (`/sign-in/magic-link`, `GET /magic-link/verify`, `/sign-out`) |
| Web session storage | AsyncStorage-on-web instability across environments | Web auth session persistence uses `localStorage` with guarded access |
| NativeWind/Tailwind | Tailwind v4 breaks Metro in this setup | Tailwind pinned to v3 and documented |
| Expo config | Invalid app config and missing peer dependency blocked health checks | Fixed app config + installed `react-native-worklets` |
| Worker email links | Link generation could produce malformed verify URLs | Worker now uses `URL` API and encoded deep-link token |
| Worker deploy config | Wrangler build command referenced missing script | Removed invalid build config from `wrangler.toml` |

## 🧭 Detailed Plan to Finish MVP Migration

1. **Core screens completion**
   - Implement map screen (native maps + web map fallback)
   - Implement post listing creation flow (organizer-only UX + validation)
   - Implement claims flow UI (claim/pickup/no-show/rating)
   - Implement impact dashboard with real user stats
2. **Auth + backend hardening**
   - Deploy auth worker with production secrets
   - Verify trusted origins (prod + dev + app scheme)
   - Validate auth callback URLs for web and deep-link flows
   - Finalize Supabase RLS/policies for `users`, `listings`, `claims`
3. **Product parity and UX**
   - Add filter bar UI and listing details/claim CTA flow
   - Add profile editing (name/avatar/dietary)
   - Add empty/error/offline states for all primary tabs
4. **Release readiness**
   - Add `eas.json` and build profiles
   - Replace Google Maps API key placeholders
   - Run full iOS/Android/Web QA pass + regression checks
   - Prepare deployment playbook (web + worker + mobile builds)

See `docs/superpowers/specs/2026-04-08-expo-migration-design.md` and `docs/superpowers/plans/2026-04-08-expo-migration.md` for the source migration spec/plan.

## 📄 License

MIT

## ✅ MVP Ready Checklist (Bottom)

- [ ] Deploy auth worker to production (`wrangler deploy`) with all required secrets set
- [ ] Confirm Better Auth trusted origins for production web domain and app deep-link scheme
- [ ] Finalize and apply Supabase schema + RLS policies for `users`, `listings`, `claims`
- [ ] Replace `YOUR_GOOGLE_MAPS_API_KEY` placeholders in `app.json`
- [ ] Add `eas.json` with dev/preview/prod profiles and verify EAS build setup
- [ ] Implement **Map** tab (real map + markers + listing interactions)
- [ ] Implement **Post** tab (create listing form + organizer permissions)
- [ ] Implement **Claims** tab flow (pending/pickup/no-show/rating UI)
- [ ] Implement **Impact** tab (stats cards/charts from profile impact data)
- [ ] Implement feed detail/claim path from `ListingCard` tap
- [ ] Implement filter bar UI and wire to existing filter store logic
- [ ] Add profile edit UI for name/avatar/dietary preferences
- [ ] Add robust offline/error/empty states for all main screens
- [ ] Run cross-platform QA: web, iOS simulator, Android emulator
- [ ] Prepare release checklist for web deployment + App Store + Play Store
