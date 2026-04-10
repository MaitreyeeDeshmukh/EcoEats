# EcoEats — Campus Food Rescue

Multi-platform Expo application for rescuing surplus food on campus. Built with Expo Router, TypeScript, NativeWind, a first-party Hono API, Better Auth, and PostgreSQL.

## Commands

```bash
bun run api:dev # Start the API server
bun start       # Start Expo dev server
bun run ios     # Run on iOS Simulator
bun run android # Run on Android Emulator
bun run web     # Run on web browser

# Auth schema
bun run auth:migrate # Create Better Auth tables using server/auth.ts

# Verification (run all before committing)
bunx tsc --noEmit   # TypeScript check
bunx biome check .  # Linting + formatting
bunx knip           # Find unused exports
```

## Environment

Create `.env.local`:
```
EXPO_PUBLIC_SERVER_URL=http://localhost:3001
API_URL=http://localhost:3001
DATABASE_URL=postgresql://...
AUTH_SECRET=replace-with-32-plus-random-chars
RESEND_API_KEY=re_...
AUTH_FROM_EMAIL=EcoEats <noreply@ecoeats.app>
CORS_ORIGINS=http://localhost:8081,http://localhost:3000,http://localhost:3001,ecoeats://
```

## Database Setup

1. Run `bun run auth:migrate` for Better Auth tables
2. Run `server/sql/001_init_app_tables.sql` for app tables (`users`, `listings`, `claims`)

## Structure

```
app/                # Expo Router file-based routes (typed routes enabled)
  (auth)/           # Auth screens (login, onboarding, callback)
  (tabs)/           # Tab navigation (feed, map, post, claims, impact, profile)
src/
  components/
    ui/             # Generic UI (Button, Input, Badge, Spinner)
    features/       # Domain components (ListingCard)
  services/         # auth-client, typed Hono RPC client, feature API calls
  stores/           # Zustand stores with subscribeWithSelector middleware
  contexts/         # React contexts (Auth, Toast)
  types/            # TypeScript types
  utils/            # Utilities
shared/
  contracts/        # Shared Zod request/response contracts
server/             # Hono API + Better Auth + pg
  app.ts            # Routed Hono app + exported AppType
  routes/           # Users, listings, claims handlers
```

## Tech Stack

- **Framework**: Expo SDK 55 + Expo Router
- **Language**: TypeScript (strict mode)
- **Styling**: NativeWind v4 (Tailwind CSS for RN)
- **State**: Zustand + React Context
- **Backend**: Hono + pg
- **Auth**: Better Auth (magic link + bearer token)
- **Contracts**: Shared Zod schemas + Hono RPC typing
- **Database**: PostgreSQL (Supabase-hosted for now, but only as Postgres)
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
- Expo never talks directly to the database
- `shared/contracts/*` is the API source of truth for request/response shapes
- `src/services/rpc-client.ts` is the shared typed client transport layer
- Listings and claims use polling through the first-party API
- Supabase is no longer used from the frontend SDK side
