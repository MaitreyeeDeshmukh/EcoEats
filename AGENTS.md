# EcoEats — Campus Food Rescue

Multi-platform Expo application for rescuing surplus food on campus. Built with Expo Router, TypeScript, NativeWind, and Supabase.

## Commands

```bash
npm start       # Start Expo dev server
npm run ios     # Run on iOS Simulator
npm run android # Run on Android Emulator
npm run web     # Run on web browser

# Verification
npx tsc --noEmit # TypeScript check
npx biome check . # Linting + formatting
npx knip         # Find unused exports
```

## Environment

Create `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
EXPO_PUBLIC_AUTH_URL=https://auth.ecoeats.app
```

## Database Setup

1. Run `workers/auth/schema.sql` in Supabase SQL Editor for auth tables
2. Main app tables (users, listings, claims) should already exist

## Structure

```
app/                # Expo Router file-based routes
  (auth)/           # Auth screens (login, onboarding, callback)
  (tabs)/           # Tab navigation (feed, map, post, claims, impact, profile)
src/
  components/
    ui/             # Generic UI (Button, Card, Input, Badge, Spinner)
    features/       # Domain components (ListingCard)
  services/         # API layer (Supabase, auth-client)
  stores/           # Zustand stores (listings, cart)
  contexts/         # React contexts (Auth, Toast)
  types/            # TypeScript types
  utils/            # Utilities
workers/auth/       # Cloudflare Worker for Better Auth
```

## Routes

| Path | Screen |
|------|--------|
| /login | Magic link login |
| /onboarding | Role selection |
| /auth/callback | Deep link handler |
| / | Feed (home) |
| /map | Map view |
| /post | Create listing (organizers) |
| /claims | Your claimed items |
| /impact | Environmental stats |
| /profile | User profile |

## Tech Stack

- **Framework**: Expo SDK 52 + Expo Router
- **Language**: TypeScript (strict mode)
- **Styling**: NativeWind (Tailwind CSS for RN)
- **State**: Zustand + React Context
- **Auth**: Better Auth (magic link)
- **Database**: Supabase PostgreSQL
- **Linting**: Biome (not ESLint/Prettier)

## Gotchas

- NativeWind v4 uses `className` directly (no `styled()` wrapper)
- Expo Router uses file-based routing (routes defined by file structure)
- Auth tokens stored in SecureStore on mobile
- Deep link scheme: `ecoeats://auth/callback?token=xxx`
