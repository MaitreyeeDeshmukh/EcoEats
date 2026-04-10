# Deployment Guide

This app deploys as two separate systems:

1. the Expo frontend
2. the EcoEats API backend on Cloudflare Workers

The database stays outside Cloudflare and can be any PostgreSQL provider.

## Production Topology

```text
Expo app / web build
  -> https://api.ecoeats.app
  -> Cloudflare Worker
  -> Hyperdrive
  -> PostgreSQL
  -> Resend
```

## One-Time Backend Setup

### 1. Create a Hyperdrive config

Create a Hyperdrive configuration that points at your PostgreSQL database.

That database can be:

- Supabase Postgres
- Neon
- AWS RDS
- Railway Postgres
- local/self-hosted Postgres reachable from the internet

Then replace the placeholder id in [wrangler.jsonc](/Users/divkix/GitHub/EcoEats/wrangler.jsonc).

### 2. Set Worker secrets

Run once:

```bash
wrangler secret put AUTH_SECRET
wrangler secret put RESEND_API_KEY
```

### 3. Set Worker vars

Update [wrangler.jsonc](/Users/divkix/GitHub/EcoEats/wrangler.jsonc):

- `API_URL`
- `AUTH_FROM_EMAIL`
- `CORS_ORIGINS`

Recommended production values:

```text
API_URL=https://api.ecoeats.app
AUTH_FROM_EMAIL=EcoEats <noreply@ecoeats.app>
CORS_ORIGINS=https://app.ecoeats.app,ecoeats://
```

## Database Setup

Run Better Auth migrations against the same Postgres database the Worker will use:

```bash
DATABASE_URL=postgresql://... bun run auth:migrate
```

Then apply the app schema:

```bash
psql "postgresql://..." -f server/sql/001_init_app_tables.sql
```

This is why the database is still portable:

- Better Auth migrations use a normal Postgres connection string
- app schema is normal SQL
- Hyperdrive is only the Worker-to-Postgres transport layer

## Backend Deploy Options

### Option A: direct CLI deploy

```bash
bun run api:worker:deploy
```

### Option B: git push deploy

This repo includes [.github/workflows/deploy-api.yml](/Users/divkix/GitHub/EcoEats/.github/workflows/deploy-api.yml).

Set these GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Then pushing to `main` deploys the Worker automatically.

## Local Backend Development

### Fast local backend

```bash
bun run api:dev
```

Use `.env.local` and `DATABASE_URL`.

### Cloudflare runtime locally

```bash
cp .dev.vars.example .dev.vars
export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="postgresql://..."
bun run api:worker:dev
```

Then point Expo at:

```text
EXPO_PUBLIC_SERVER_URL=http://localhost:8787
```

## Expo and EAS

### Required Expo env

Set this for local builds and cloud builds:

```text
EXPO_PUBLIC_SERVER_URL=https://api.ecoeats.app
```

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

The build profiles live in [eas.json](/Users/divkix/GitHub/EcoEats/eas.json).

## Deploy Checklist

```text
1. Create Hyperdrive
2. Replace the Hyperdrive id in wrangler.jsonc
3. Set AUTH_SECRET and RESEND_API_KEY as Worker secrets
4. Run Better Auth migrations against Postgres
5. Apply server/sql/001_init_app_tables.sql
6. Set EXPO_PUBLIC_SERVER_URL in EAS
7. Add CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID to GitHub
8. Push to main
```

## Verification

Run before shipping:

```bash
bunx wrangler types
bunx tsc --noEmit
bunx biome check .
bunx knip
bunx wrangler deploy --dry-run
```

Then verify in production:

1. `GET /health` returns `200`
2. magic-link email sends
3. login works on web and native deep links
4. `/api/users/me` succeeds with bearer auth
5. listings load
6. claim creation works transactionally
