# Edge Architecture

This repo now has one application backend that can run in two places:

- local Node/Bun server for development and migrations
- Cloudflare Worker for production edge deployment

Both runtime modes use the same Hono app, the same Better Auth config,
the same route handlers, and the same PostgreSQL schema.

## Production Shape

```text
               +---------------------------+
               |        Expo App           |
               |   iOS / Android / Web     |
               +-------------+-------------+
                             |
                             | HTTPS
                             | Bearer token
                             v
               +---------------------------+
               |  Cloudflare Worker API    |
               | worker/index.ts           |
               +-------------+-------------+
                             |
             +---------------+---------------+
             |                               |
             v                               v
   +--------------------+         +----------------------+
   | Better Auth        |         | Route handlers       |
   | magic links        |         | users/listings/claims|
   | sessions/bearer    |         | validation + logic   |
   +----------+---------+         +----------+-----------+
              |                               |
              +---------------+---------------+
                              |
                              | via Hyperdrive
                              v
                    +--------------------+
                    | PostgreSQL         |
                    | auth + app tables  |
                    +--------------------+
                              |
                              v
                    +--------------------+
                    | Resend             |
                    | magic-link email   |
                    +--------------------+
```

## Repo Shape

```text
app/ + src/          Expo frontend
shared/contracts/    Shared Zod API contracts
server/              Runtime-agnostic Hono backend
worker/              Cloudflare Worker entrypoint
server/sql/          App schema SQL
```

## Why This Is Portable

```text
Expo app
  -> only knows EXPO_PUBLIC_SERVER_URL

Worker / Node server
  -> only knows standard Postgres connection details

Postgres host
  -> can be Supabase, Neon, RDS, Railway, local Postgres, or anything else
```

The lock-in boundary moved:

- before: the client knew vendor-specific Supabase APIs
- now: the client only knows your API
- result: swapping database hosts is mostly infra and env work

## Request Flow

### Sign in

```text
User enters email
  -> Expo login screen
  -> POST /api/auth/sign-in/magic-link
  -> Better Auth
  -> session + token records in Postgres
  -> email sent with Resend
  -> user clicks link
  -> Expo callback screen
  -> GET /api/auth/magic-link/verify
  -> Better Auth returns session + bearer token
  -> app stores token locally
```

### Fetch listings

```text
Feed screen
  -> typed Hono RPC client
  -> GET /api/listings
  -> Hono route validates request
  -> route queries Postgres
  -> typed JSON response returns
  -> Zustand store updates
  -> UI rerenders
```

### Claim a listing

```text
User taps claim
  -> typed Hono RPC client
  -> POST /api/claims
  -> auth middleware checks bearer token
  -> claim route opens SQL transaction
  -> listing row is locked
  -> quantity is updated
  -> claim row is inserted
  -> transaction commits
  -> app refreshes claims/feed
```

## Type Safety

```text
shared/contracts/*
   |
   +--> validates backend requests and responses
   |
   +--> informs exported Hono AppType
   |
   v
src/services/rpc-client.ts
   |
   v
Expo services infer route inputs and outputs
```

That is how drift is reduced:

- Zod schemas define the contract
- Hono validates the contract
- Expo consumes the contract through typed RPC calls

## Local Development Modes

### Option A: fastest local backend

```text
Expo app -> bun run api:dev -> Postgres
```

Use this when you want simple local iteration and Better Auth migrations.

### Option B: Cloudflare runtime locally

```text
Expo app -> wrangler dev -> same Hono app -> Hyperdrive/Postgres
```

Use this when you want to test the Worker deployment path.

## Deployment Modes

### Mobile and web frontend

```text
EAS Build
  -> iOS binary
  -> Android binary

Expo export / EAS Hosting
  -> web build
```

### Backend

```text
git push main
  -> GitHub Actions
  -> wrangler deploy
  -> Cloudflare Worker updates globally
```

## Migration Checklist

```text
1. Create a Hyperdrive config that points to your Postgres database
2. Put the Hyperdrive id into wrangler.jsonc
3. Set Worker secrets: AUTH_SECRET and RESEND_API_KEY
4. Run Better Auth migrations against the database
5. Run server/sql/001_init_app_tables.sql
6. Set EXPO_PUBLIC_SERVER_URL for EAS builds
7. Push to main to deploy the Worker
```
