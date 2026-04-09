# EcoEats — Campus Food Rescue

Multi-platform Expo application for rescuing surplus food on campus. Built with Expo Router, TypeScript, NativeWind, and Supabase.

## Commands

```bash
bun start       # Start Expo dev server
bun run ios     # Run on iOS Simulator
bun run android # Run on Android Emulator
bun run web     # Run on web browser

# Verification (run all before committing)
bunx tsc --noEmit   # TypeScript check
bunx biome check .  # Linting + formatting
bunx knip           # Find unused exports

# Auth worker (separate package)
cd workers/auth && bun run dev     # Local dev
cd workers/auth && bun run deploy  # Deploy to Cloudflare
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
app/                # Expo Router file-based routes (typed routes enabled)
  (auth)/           # Auth screens (login, onboarding, callback)
  (tabs)/           # Tab navigation (feed, map, post, claims, impact, profile)
src/
  components/
    ui/             # Generic UI (Button, Card, Input, Badge, Spinner)
    features/       # Domain components (ListingCard)
  services/         # API layer (Supabase, auth-client)
  stores/           # Zustand stores with subscribeWithSelector middleware
  contexts/         # React contexts (Auth, Toast)
  types/            # TypeScript types
  utils/            # Utilities
workers/auth/       # Cloudflare Worker for Better Auth (separate package.json)
```

## Tech Stack

- **Framework**: Expo SDK 54 + Expo Router
- **Language**: TypeScript (strict mode)
- **Styling**: NativeWind v4 (Tailwind CSS for RN)
- **State**: Zustand + React Context
- **Auth**: Better Auth (magic link) via Cloudflare Worker
- **Database**: Supabase PostgreSQL with Realtime
- **Linting**: Biome (not ESLint/Prettier)

## Code Conventions

- Path alias: `@/*` maps to `./src/*`
- Biome formatting: tabs, 80 char line width, double quotes, trailing commas
- Zustand stores use `subscribeWithSelector` middleware for subscriptions

## Gotchas

- NativeWind v4 uses `className` directly (no `styled()` wrapper)
- Expo Router uses file-based routing with typed routes (`"typedRoutes": true`)
- Auth tokens stored in SecureStore on mobile
- Deep link scheme: `ecoeats://auth/callback?token=xxx`
- Listings store auto-subscribes to Supabase Realtime via `useListingsSubscription()`
- Auth worker is a separate package in `workers/auth/` with its own dependencies
