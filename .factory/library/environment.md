# Environment

Environment variables, external dependencies, and setup notes.

**What belongs here:** Required env vars, external API keys/services, dependency quirks, platform-specific notes.
**What does NOT belong here:** Service ports/commands (use `.factory/services.yaml`).

---

## Required Environment Variables

### Local Development (.env.local)

See `.env.example` for required environment variables. Key variables include database URL, auth configuration, and email settings.

### Cloudflare Worker (.dev.vars)

Required variables: Same as local development, with API_URL pointing to the Worker URL (http://localhost:8787).

## External Services

- **PostgreSQL:** Required for data storage. Connection via DATABASE_URL.
- **Better Auth:** Magic link authentication, runs within Hono backend.
- **Resend:** Email delivery for magic links.

## Platform Notes

- **Mobile:** Uses SecureStore for token storage, deep link scheme `ecoeats://`
- **Web:** Uses localStorage for token storage
- **Server-side rendering:** Must handle undefined window gracefully

## Database Setup

1. Run `bun run auth:migrate` for Better Auth tables
2. Run `server/sql/001_init_app_tables.sql` for app tables (users, listings, claims)
