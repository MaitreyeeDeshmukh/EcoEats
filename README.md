# EcoEats

Campus food rescue app built with Expo, Hono, Better Auth, and PostgreSQL.

## Architecture

```text
Expo app
  -> typed Hono RPC client
  -> Cloudflare Worker API
  -> Hyperdrive
  -> PostgreSQL
```

- Expo is only the frontend.
- Hono owns auth, validation, and business logic.
- Better Auth runs inside the backend.
- PostgreSQL can be hosted anywhere.
- Supabase can still host Postgres, but it is no longer an app dependency.

See [edge-architecture.md](/Users/divkix/GitHub/EcoEats/docs/edge-architecture.md) for the full system walkthrough and ASCII diagrams.

## Quick Start

1. Install dependencies:

```bash
bun install
```

2. Create local env files:

```bash
cp .env.example .env.local
cp .dev.vars.example .dev.vars
```

3. Fill in:

- `DATABASE_URL` in `.env.local`
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
bun run api:worker:dev
```

7. Start Expo:

```bash
bun start
```

If you use the Worker locally, point `EXPO_PUBLIC_SERVER_URL` at `http://localhost:8787`.

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

# EAS
bun run eas:build:ios
bun run eas:build:android
bun run eas:build:local:ios
bun run eas:build:local:android

# Verification
bunx tsc --noEmit
bunx biome check .
bunx knip
```

## Environment

Frontend:

- `EXPO_PUBLIC_SERVER_URL`: API base URL used by Expo

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

## Project Structure

```text
app/
  (auth)/              auth screens
  (tabs)/              main app tabs
src/
  contexts/            auth and toast state
  services/            typed client-side HTTP and auth wrappers
  stores/              Zustand state
  components/          UI and feature components
  types/               frontend and domain types
shared/
  contracts/           shared Zod API contracts
server/
  app.ts               Hono app factory
  runtime.ts           runtime assembly for Node or Workers
  auth-core.ts         Better Auth factory
  routes/              users/listings/claims endpoints
  sql/                 app schema
worker/
  index.ts             Cloudflare Worker entrypoint
docs/
  edge-architecture.md
  how-it-works.md
  portable-backend-migration.md
```

## Deployment

- Frontend builds through EAS for iOS and Android.
- Web can be exported statically.
- Backend deploys to Cloudflare Workers from `wrangler.jsonc`.
- PostgreSQL can live on Supabase, Neon, Railway, RDS, or any other compatible host.

See [DEPLOY.md](/Users/divkix/GitHub/EcoEats/DEPLOY.md) for the full deploy checklist.
