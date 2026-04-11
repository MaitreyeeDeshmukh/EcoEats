# EcoEats

Campus food rescue app built with Expo, Hono, Better Auth, and PostgreSQL.

## Summary

This repo is split into three portable parts:

1. Expo frontend for iOS, Android, and web
2. Hono backend for auth and business logic
3. PostgreSQL database hosted anywhere

Current production path:

```text
Expo app
  -> typed Hono RPC client
  -> Cloudflare Worker API
  -> Hyperdrive
  -> PostgreSQL
  -> Resend
```

What matters:

- Expo is only the client UI layer.
- The backend owns auth, validation, and all database access.
- Better Auth runs inside the backend, not as a separate service.
- PostgreSQL can live on Supabase, Neon, RDS, Railway, or your own server.
- The frontend never talks directly to Supabase or Postgres.

## How It Works

### Auth

```text
User enters email
  -> Expo login screen
  -> /api/auth/sign-in/magic-link
  -> Better Auth
  -> Postgres session records
  -> Resend sends email
  -> user clicks magic link
  -> Expo callback screen
  -> /api/auth/magic-link/verify
  -> bearer token stored locally
```

### Data flow

```text
Expo screen
  -> src/services/rpc-client.ts
  -> Hono route
  -> shared/contracts validation
  -> Postgres query or transaction
  -> typed JSON response
  -> Zustand / React state
  -> UI rerender
```

### Type sync

```text
shared/contracts/*
  -> Zod schemas define API contracts
  -> backend validates requests and responses
  -> Hono exports AppType
  -> Expo client infers route input/output types
```

This is how frontend/backend drift is reduced.

## Local Development

1. Install dependencies:

```bash
bun install
```

2. Create env files:

```bash
cp .env.example .env.local
cp .dev.vars.example .dev.vars
```

3. Fill in:

- `DATABASE_URL`
- `AUTH_SECRET`
- `RESEND_API_KEY`

4. Create Better Auth tables:

```bash
bun run auth:migrate
```

5. Create app tables with [001_init_app_tables.sql](/Users/divkix/GitHub/EcoEats/server/sql/001_init_app_tables.sql)

6. Start one backend mode:

```bash
bun run api:dev
```

or

```bash
export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="postgresql://..."
bun run api:worker:dev
```

7. Start Expo:

```bash
bun start
```

If you use the Worker locally, set:

```text
EXPO_PUBLIC_SERVER_URL=http://localhost:8787
```

## Commands

```bash
# Backend
bun run api
bun run api:dev
bun run api:worker:dev
bun run api:worker:deploy
bun run api:worker:types
bun run api:worker:check
bun run auth:migrate

# Expo
bun start
bun run ios
bun run android
bun run web

# EAS builds
bun run eas:build:ios
bun run eas:build:android
bun run eas:build:local:ios
bun run eas:build:local:android

# EAS submit
bun run eas:submit:ios
bun run eas:submit:android

# Testing
bun run test              # Backend tests (Vitest)
bun run test:frontend     # Frontend tests (Jest)

# Verification
bunx tsc --noEmit
bunx biome check .
bunx knip
```

## Environment

Frontend:

- `EXPO_PUBLIC_SERVER_URL`: public API URL used by Expo

Node/Bun backend and migrations:

- `API_URL`
- `DATABASE_URL`
- `AUTH_SECRET`
- `RESEND_API_KEY`
- `AUTH_FROM_EMAIL`
- `CORS_ORIGINS`

Cloudflare Worker:

- `API_URL`
- `AUTH_FROM_EMAIL`
- `CORS_ORIGINS`
- `AUTH_SECRET` as a Worker secret
- `RESEND_API_KEY` as a Worker secret
- `HYPERDRIVE` binding for the Postgres connection

## Deploy Backend

The backend is ready for Cloudflare Workers.

### One-time setup

1. Create a Hyperdrive config pointing at your Postgres database
2. Replace the placeholder Hyperdrive id in [wrangler.jsonc](/Users/divkix/GitHub/EcoEats/wrangler.jsonc#L1)
3. Set Worker secrets:

```bash
wrangler secret put AUTH_SECRET
wrangler secret put RESEND_API_KEY
```

4. Run DB setup against the same Postgres instance:

```bash
DATABASE_URL=postgresql://... bun run auth:migrate
psql "postgresql://..." -f server/sql/001_init_app_tables.sql
```

### Manual deploy

```bash
bun run api:worker:deploy
```

### Git push deploy

This repo includes [.github/workflows/deploy-api.yml](/Users/divkix/GitHub/EcoEats/.github/workflows/deploy-api.yml#L1).

Add these GitHub repo secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Then every push to `main` deploys the Worker.

## Build Apps With EAS

First-time setup if this project is not linked to EAS yet:

```bash
bunx eas-cli@latest login
bunx eas-cli@latest init
```

Set `EXPO_PUBLIC_SERVER_URL` in your EAS project environment before cloud builds.

### Cloud builds

```bash
bun run eas:build:ios
bun run eas:build:android
```

### Local builds

```bash
bun run eas:build:local:ios
bun run eas:build:local:android
```

The build profiles live in [eas.json](/Users/divkix/GitHub/EcoEats/eas.json#L1):

- `development`: dev client
- `preview`: internal distribution
- `production`: store builds

## Push To Stores

Typical flow:

1. Build production binaries with EAS
2. Verify the app in TestFlight / internal testing
3. Submit to stores with EAS Submit

### iOS

```bash
bun run eas:build:ios
bun run eas:submit:ios
```

You need:

- an Apple Developer account
- App Store Connect app configured
- iOS credentials managed through EAS or provided manually

### Android

```bash
bun run eas:build:android
bun run eas:submit:android
```

You need:

- a Google Play Console app
- a Google service account for Play submission
- Android signing credentials

Note: if Google Play API submission is not set up yet, your first release may still require Play Console setup before automated submit works cleanly.

## Project Structure

```text
app/
  (auth)/              auth screens
  (tabs)/              main app tabs
src/
  constants/           app constants (polling intervals, limits)
  contexts/            auth and toast state
  services/            typed client-side HTTP and auth wrappers
  stores/              Zustand state
  components/
    ui/                base UI components (Button, ErrorBoundary, Spinner)
  types/               frontend and domain types
  utils/
    errors.ts          typed error classes (ValidationError, AuthError, NetworkError)
shared/
  contracts/           shared Zod API contracts
server/
  app.ts               Hono app factory
  runtime.ts           runtime assembly for Node or Workers
  auth-core.ts         Better Auth factory
  constants.ts         backend constants (reservation minutes, query limits)
  errors.ts            typed HTTP error classes (NotFoundError, ConflictError, etc.)
  routes/              users/listings/claims endpoints
  test/                test setup and utilities
  sql/                 app schema
worker/
  index.ts             Cloudflare Worker entrypoint
docs/
  edge-architecture.md
  how-it-works.md
  portable-backend-migration.md
```

## Code Quality

### Testing

- **Backend**: Vitest with PostgreSQL test isolation (see `server/test/`)
- **Frontend**: Jest with React Testing Library (see `src/**/*.test.ts(x)`)

### Error Handling

- **Frontend**: `ErrorBoundary` component wraps navigation groups with fallback UI
- **Typed errors**: `ValidationError`, `AuthError`, `NetworkError` (frontend); `NotFoundError`, `ConflictError`, `UnauthorizedError` (backend)

### Pre-commit Hooks

Husky runs `lint-staged` on commit:
- `biome check --write` on staged files
- `tsc --noEmit` for type checking

### Rate Limiting

API routes are rate-limited: 100 requests per 15 minutes per IP. Health endpoint excluded.

## More Docs

- [DEPLOY.md](/Users/divkix/GitHub/EcoEats/DEPLOY.md)
- [edge-architecture.md](/Users/divkix/GitHub/EcoEats/docs/edge-architecture.md)
- [how-it-works.md](/Users/divkix/GitHub/EcoEats/docs/how-it-works.md)
