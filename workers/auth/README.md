# EcoEats Auth Worker

Cloudflare Worker for Better Auth with magic link authentication.

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set secrets:
   ```bash
   wrangler secret put SUPABASE_DB_URL
   wrangler secret put RESEND_API_KEY
   wrangler secret put BETTER_AUTH_SECRET
   ```

3. Generate BETTER_AUTH_SECRET (min 32 chars):
   ```bash
   openssl rand -base64 32
   ```

4. Run database migration:
   ```bash
   bun run migrate
   ```

5. Start dev server:
   ```bash
   bun run dev
   ```

## Environment Variables

- `BETTER_AUTH_SECRET` - Encryption secret (required, min 32 chars)
- `SUPABASE_DB_URL` - PostgreSQL connection string from Supabase
- `RESEND_API_KEY` - Resend API key for sending emails

## Endpoints

- `GET /api/auth/ok` - Health check
- `POST /api/auth/sign-in/magic-link` - Request magic link
- `GET /api/auth/magic-link/verify` - Verify magic link token

## Notes

- Schema is managed by Better Auth CLI (`npx auth migrate`)
- The provided schema.sql is for reference only
- For production, consider using Hyperdrive for PostgreSQL connection pooling
