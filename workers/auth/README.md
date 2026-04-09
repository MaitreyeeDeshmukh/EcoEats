# EcoEats Auth Worker

Cloudflare Worker for Better Auth with magic link authentication, powered by Hono.

## Stack

- **Hono** — Lightweight web framework for edge runtimes
- **Better Auth** — TypeScript authentication library
- **Resend** — Email delivery service

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Create `.dev.vars` for local development:
   ```bash
   echo "SUPABASE_DB_URL=postgresql://..." > .dev.vars
   echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" >> .dev.vars
   echo "RESEND_API_KEY=re_..." >> .dev.vars
   ```

3. Run database migration:
   ```bash
   bun run migrate
   ```

4. Start dev server:
   ```bash
   bun run dev
   ```

## Deployment

```bash
# Deploy to staging
bun run deploy:staging

# Deploy to production
bun run deploy:prod
```

Set secrets for each environment:
```bash
bunx wrangler secret put SUPABASE_DB_URL --env production
bunx wrangler secret put RESEND_API_KEY --env production
bunx wrangler secret put BETTER_AUTH_SECRET --env production
```

## Endpoints

- `GET /health` — Health check with environment info
- `GET|POST /auth/*` — All Better Auth routes
- `POST /auth/sign-in/magic-link` — Request magic link
- `GET /auth/magic-link/verify` — Verify magic link token

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BETTER_AUTH_SECRET` | Yes | Encryption secret (min 32 chars) |
| `SUPABASE_DB_URL` | Yes | PostgreSQL connection string |
| `RESEND_API_KEY` | Yes | Resend API key for emails |
| `ENVIRONMENT` | No | `development`, `staging`, or `production` |

## Architecture

```
Expo App → Hono Router → Better Auth → Supabase PostgreSQL
                     ↓
                 Resend (email)
```

The auth instance is created per-request and stored on Hono context to avoid connection issues.
