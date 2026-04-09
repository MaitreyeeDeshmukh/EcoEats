# EcoEats Deployment Guide

Complete instructions for deploying the EcoEats app — auth worker, database setup, and Expo app configuration.

---

## Prerequisites

- [ ] Supabase project created (you have: `avflzoigltitoohtwrdu`)
- [ ] Cloudflare account (for Workers)
- [ ] Resend account (for emails)
- [ ] Supabase database password
- [ ] Resend API key

---

## Architecture Overview

```
┌─────────────┐     HTTP      ┌─────────────┐     SQL      ┌─────────────┐
│  Expo App   │ ────────────► │ Auth Worker │ ───────────► │  Supabase   │
│  (Mobile)   │               │ (Cloudflare)│              │ (PostgreSQL)│
│             │               │             │              │             │
│ Supabase    │ ◄──────────── │ Better Auth │ ◄─────────── │ auth_users  │
│ Realtime    │     WS        │   + Resend  │     Email    │ auth_sessions│
└─────────────┘               └─────────────┘              └─────────────┘
```

**Two separate deployments:**
1. **Auth Worker** — Cloudflare Workers (handles magic link auth)
2. **Expo App** — TestFlight / Play Store / Web (the mobile app)

---

## Step 1: Get Supabase Database Password

### 1.1 Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select project: `avflzoigltitoohtwrdu`
3. Click **Settings** (gear icon) → **Database**

### 1.2 Find Connection String

Scroll to **Connection string** section:

**Option A: Direct Connection (Recommended for auth worker)**
```
postgresql://postgres:[YOUR-PASSWORD]@db.avflzoigltitoohtwrdu.supabase.co:5432/postgres
```

**Option B: Connection Pooler (For serverless functions with many connections)**
```
postgresql://postgres.avflzoigltitoohtwrdu:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Use Option A (direct connection) for the auth worker.**

### 1.3 Get Your Password

If you don't remember your database password:

1. In Supabase Dashboard → Settings → Database
2. Click **Reset database password** (if needed)
3. Copy the new password immediately (shown once)

### 1.4 Construct Full Connection String

Replace `[YOUR-PASSWORD]` with your actual password:

```
postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.avflzoigltitoohtwrdu.supabase.co:5432/postgres
```

**Example** (password is `MySecretPass123`):
```
postgresql://postgres:MySecretPass123@db.avflzoigltitoohtwrdu.supabase.co:5432/postgres
```

---

## Step 2: Get Resend API Key

### 2.1 Create Resend Account

1. Go to https://resend.com
2. Sign up for free account
3. Verify your email

### 2.2 Get API Key

1. Go to https://resend.com/api-keys
2. Click **Create API Key**
3. Name it: `EcoEats Auth`
4. Select scope: **Sending access**
5. Click **Add**
6. **Copy the key immediately** (shown once)

**Format:** `re_xxxxxxxxxxxxxxxxxxxxxxxx`

### 2.3 Verify Your Domain (Optional but Recommended)

For production, verify your sending domain:

1. Go to https://resend.com/domains
2. Add domain: `ecoeats.app`
3. Add DNS records shown
4. Wait for verification

**Without domain verification:**
- You can only send emails to yourself (the account email)
- Perfect for development/testing

---

## Step 3: Configure Auth Worker

### 3.1 Navigate to Worker Directory

```bash
cd workers/auth
```

### 3.2 Create `.dev.vars` File

This file stores secrets for local development. **Never commit this file to git.**

```bash
# Create .dev.vars
cat > .dev.vars << 'EOF'
SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.avflzoigltitoohtwrdu.supabase.co:5432/postgres
BETTER_AUTH_SECRET=
RESEND_API_KEY=re_your_key_here
EOF
```

### 3.3 Generate BETTER_AUTH_SECRET

Run this command to generate a secure secret:

```bash
# Generate and append to .dev.vars
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" >> .dev.vars
```

**Or manually:**
```bash
openssl rand -base64 32
# Output: kJ7hR9sN2mP4vL8wQ1xC5yB3zA6dF0gH...
# Copy this to BETTER_AUTH_SECRET in .dev.vars
```

### 3.4 Verify `.dev.vars` Contents

```bash
cat .dev.vars
```

Should look like:
```bash
SUPABASE_DB_URL=postgresql://postgres:MySecretPass123@db.avflzoigltitoohtwrdu.supabase.co:5432/postgres
BETTER_AUTH_SECRET=kJ7hR9sN2mP4vL8wQ1xC5yB3zA6dF0gH...
RESEND_API_KEY=re_abc123def456ghi789...
```

---

## Step 4: Run Database Migrations

Better Auth needs to create its tables in Supabase.

### 4.1 Install Dependencies

```bash
cd workers/auth
bun install
```

### 4.2 Run Migration

```bash
bun run migrate
```

This creates these tables in your Supabase database:
- `auth_users` — User accounts
- `auth_sessions` — Active sessions
- `auth_verification_tokens` — Magic link tokens

### 4.3 Verify Tables Created

1. Open Supabase Dashboard
2. Go to **Table Editor**
3. Look for tables starting with `auth_`

**Alternative:** Check via SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'auth_%';
```

---

## Step 5: Configure Row Level Security (RLS) — CRITICAL

**⚠️ Without RLS policies, your database is completely exposed. Anyone with your anon key can read/write all data.**

### 5.1 Why RLS is Required

```
┌─────────────────────────────────────────────────────────────────────┐
│                HOW SUPABASE SECURITY WORKS                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  The anon key (sb_publishable_xxx) is PUBLIC by design:             │
│  • It's bundled in your app code                                     │
│  • Anyone can extract it from the APK/IPA                           │
│  • It grants access to your database                                │
│                                                                      │
│  Row Level Security (RLS) is the ONLY thing protecting your data:   │
│  • Policies restrict what each user can access                      │
│  • auth.uid() returns the current user's ID                         │
│  • Policies like "student_id = auth.uid()" enforce ownership        │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ WITHOUT RLS:                                                │    │
│  │   curl "https://xxx.supabase.co/rest/v1/users" \            │    │
│  │     -H "apikey: sb_publishable_xxx"                          │    │
│  │   → Returns ALL users' data! ❌                             │    │
│  │                                                              │    │
│  │ WITH RLS:                                                   │    │
│  │   Same request → Returns only your data ✅                  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Apply RLS Policies (via Migration)

**Option A: Apply via Supabase CLI (Recommended)**

```bash
# 1. Link your project (first time only)
supabase link --project-ref avflzoigltitoohtwrdu

# 2. Push migrations to remote database
supabase db push
```

This applies all migrations from `supabase/migrations/` to your remote database.

**Option B: Apply manually (if CLI fails)**

1. Open Supabase Dashboard → **SQL Editor**
2. Create new query
3. Paste the contents of `supabase/migrations/20260409153559_enable_rls_policies.sql`
4. Click **Run**

**Option C: One-liner via psql**

```bash
# Requires psql installed
psql "postgresql://postgres:[PASSWORD]@db.avflzoigltitoohtwrdu.supabase.co:5432/postgres" \
  -f supabase/migrations/20260409153559_enable_rls_policies.sql
```

### 5.3 Verify RLS is Enabled

In Supabase SQL Editor:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

**Expected output:**
```
tablename    | rowsecurity 
-------------+-------------
users        | t
listings     | t
claims       | t
auth_users   | t
auth_sessions| t
```

All should show `t` (true).

### 5.4 Test RLS is Working

1. **Get your anon key** from `.env.local`
2. **Try to access data without authentication:**

```bash
# Should fail or return empty
curl "https://avflzoigltitoohtwrdu.supabase.co/rest/v1/users" \
  -H "apikey: YOUR_ANON_KEY"

# Should fail (can't insert without auth)
curl -X POST "https://avflzoigltitoohtwrdu.supabase.co/rest/v1/claims" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"listing_id":"xxx","student_id":"someone-else"}'
```

**If these succeed, RLS is NOT configured correctly.**

---

## Step 6: Test Auth Worker Locally

### 6.1 Start Development Server

```bash
cd workers/auth
bun run dev
```

**Output:**
```
 ⛅️ wrangler 4.81.1
───────────────────

 ⎔ Starting local server...
[wrangler:info] Ready on http://localhost:8787
```

### 6.2 Test Health Endpoint

Open new terminal:
```bash
curl http://localhost:8787/health
```

**Expected response:**
```json
{"status":"ok","timestamp":"2026-04-09T22:25:42.455Z","environment":"development"}
```

### 6.3 Test Magic Link Request

```bash
curl -X POST http://localhost:8787/auth/sign-in/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

**Expected:**
```json
{"success":true}
```

**Check your email** for the magic link.

### 6.4 Stop Development Server

Press `Ctrl+C` in the terminal running `bun run dev`.

---

## Step 7: Deploy Auth Worker to Cloudflare

### 7.1 Login to Cloudflare

```bash
bunx wrangler login
```

This opens your browser to authorize Wrangler with Cloudflare.

### 7.2 Deploy to Staging (Optional)

```bash
bun run deploy:staging
```

Deploys to `https://ecoeats-auth-staging.YOUR-SUBDOMAIN.workers.dev`

### 7.3 Deploy to Production

```bash
bun run deploy:prod
```

**Output:**
```
✨ Successfully published your Worker to
   https://ecoeats-auth.YOUR-SUBDOMAIN.workers.dev
```

**Copy this URL** — you'll need it for the Expo app config.

### 7.4 Set Production Secrets

Secrets in `.dev.vars` are for local development only. For production, set them via Wrangler:

```bash
cd workers/auth

# Set each secret
bunx wrangler secret put SUPABASE_DB_URL --env production
# Paste: postgresql://postgres:YOUR_PASSWORD@db.avflzoigltitoohtwrdu.supabase.co:5432/postgres

bunx wrangler secret put RESEND_API_KEY --env production
# Paste: re_abc123def456...

bunx wrangler secret put BETTER_AUTH_SECRET --env production
# Paste: kJ7hR9sN2mP4vL8wQ1xC5yB3zA6dF0gH...
```

### 7.5 Verify Production Deployment

```bash
curl https://ecoeats-auth.YOUR-SUBDOMAIN.workers.dev/health
```

**Expected:**
```json
{"status":"ok","timestamp":"...","environment":"production"}
```

---

## Step 8: Configure Custom Domain (Optional)

### 8.1 Add Custom Domain

If you own `ecoeats.app`, you can use `auth.ecoeats.app`:

1. Go to Cloudflare Dashboard → Workers → ecoeats-auth
2. Click **Settings** → **Domains & Routes**
3. Click **Add Custom Domain**
4. Enter: `auth.ecoeats.app`
5. Click **Add Domain**

### 8.2 Update wrangler.toml

Already configured in `wrangler.toml`:
```toml
[env.production]
routes = [{ pattern = "auth.ecoeats.app/*", custom_domain = true }]
```

### 8.3 Verify Custom Domain

```bash
curl https://auth.ecoeats.app/health
```

---

## Step 9: Configure Expo App

### 9.1 Create `.env.local` in Project Root

```bash
# In project root (not workers/auth)
cd ../..  # if you're in workers/auth

cat > .env.local << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=https://avflzoigltitoohtwrdu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_fxj4ti7I4BCivoJ4f-TcNw_rSOlxAId
EXPO_PUBLIC_AUTH_URL=https://your-worker-url.workers.dev
EOF
```

**Replace `your-worker-url`** with your actual worker URL from Step 6.

### 9.2 Verify Environment Variables

```bash
cat .env.local
```

Should contain:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://avflzoigltitoohtwrdu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
EXPO_PUBLIC_AUTH_URL=https://ecoeats-auth.YOUR-SUBDOMAIN.workers.dev
# OR if custom domain:
# EXPO_PUBLIC_AUTH_URL=https://auth.ecoeats.app
```

---

## Step 10: Run Expo App

### 10.1 Install Dependencies

```bash
# In project root
bun install
```

### 10.2 Start Development Server

```bash
bun start
```

**Output:**
```
╔═══════════════════════════════════════════════╗
║                                               ║
║   Expo SDK 54                                 ║
║   ╭────────────────╮                          ║
║   │  ▎ ▏▏▏▏▏▏ ▎   │  native ▎▏▏▏▏▏▏▏▏▎    ║
║   ╰─▏▏▏▏▏▏▏▏▏▏▏▏──╯  runtime ▏▏▏▏▏▏▏▏▏▏    ║
║   Metro waiting on http://localhost:8081      ║
║   Scan the QR code above with Expo Go         ║
║                                               ║
╚═══════════════════════════════════════════════╝
```

### 10.3 Test on Device/Simulator

**iOS Simulator:**
```bash
# Press 'i' in terminal, or:
bun run ios
```

**Android Emulator:**
```bash
# Press 'a' in terminal, or:
bun run android
```

**Physical Device:**
1. Install **Expo Go** from App Store / Play Store
2. Scan QR code with camera

**Web Browser:**
```bash
# Press 'w' in terminal, or:
bun run web
```

---

## Step 11: Test Complete Auth Flow

### 11.1 Open Login Screen

App should open to login screen (no session yet).

### 11.2 Enter Your Email

Use your real email address (or the one associated with Resend account).

### 11.3 Check Email

You should receive:
```
Subject: Sign in to EcoEats

Sign in to EcoEats
Click the link below to sign in:
Sign in on web

Or open this link in the EcoEats app: ecoeats://auth/callback?token=xxx

This link expires in 5 minutes.
```

### 11.4 Click Magic Link

**On Mobile:**
- Tap the deep link (`ecoeats://auth/callback?token=xxx`)
- App opens automatically
- You're logged in!

**On Web:**
- Click "Sign in on web" link
- Browser redirects to app

### 11.5 Verify Session

After login, you should see the feed screen with listings.

Check SecureStore/session:
```bash
# The session is stored in:
# - Mobile: expo-secure-store (encrypted)
# - Web: localStorage key "ecoeats_session"
```

---

## Step 12: Deploy Expo App (Production)

### 12.1 Configure EAS (Expo Application Services)

```bash
# Install EAS CLI
bun add -g eas-cli

# Login to Expo account
eas login

# Configure project
eas build:configure
```

### 12.2 Build for iOS

```bash
eas build --platform ios
```

### 12.3 Build for Android

```bash
eas build --platform android
```

### 12.4 Submit to App Stores

```bash
# iOS App Store
eas submit --platform ios --latest

# Google Play Store
eas submit --platform android --latest
```

**See `workers/auth/README.md` for more EAS details.**

---

## Troubleshooting

### Issue: "Cannot connect to database"

**Symptoms:** Auth worker fails to start or migrate.

**Solution:**
1. Verify `SUPABASE_DB_URL` is correct
2. Check database password is right
3. Ensure using port `5432` (direct connection)
4. Test connection manually:
   ```bash
   # Install psql (PostgreSQL client)
   psql "postgresql://postgres:PASSWORD@db.avflzoigltitoohtwrdu.supabase.co:5432/postgres"
   ```

---

### Issue: "Email not received"

**Symptoms:** Magic link request succeeds, but no email.

**Solution:**
1. Check spam folder
2. If using Resend free tier, you can only send to your account email
3. Verify `RESEND_API_KEY` is correct
4. Check Resend dashboard for email logs: https://resend.com/emails

---

### Issue: "CORS error in app"

**Symptoms:** Expo app can't call auth worker.

**Solution:**
1. Verify `EXPO_PUBLIC_AUTH_URL` in `.env.local`
2. Check CORS configuration in `workers/auth/index.ts`
3. Ensure origin includes `ecoeats://` scheme
4. Test with curl first:
   ```bash
   curl -X OPTIONS https://your-worker-url.workers.dev/auth/sign-in/magic-link \
     -H "Origin: ecoeats://" \
     -H "Access-Control-Request-Method: POST"
   ```

---

### Issue: "Deep link doesn't open app"

**Symptoms:** Clicking magic link opens browser, not app.

**Solution:**
1. Verify deep link scheme in `app.json`:
   ```json
   {
     "expo": {
       "scheme": "ecoeats"
     }
   }
   ```
2. On iOS, you need to build with `eas build` for deep links to work
3. Expo Go has limited deep link support — use development build for testing

---

### Issue: "Session not persisting"

**Symptoms:** App asks to login again after restart.

**Solution:**
1. Check SecureStore permissions on mobile
2. Verify `BETTER_AUTH_SECRET` is set in production
3. Check session expiry (7 days default)
4. Clear app data and try fresh login

---

## Environment Variables Summary

### Expo App (`.env.local` in project root)

| Variable | Required | Example |
|----------|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | `https://xxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | `sb_publishable_...` |
| `EXPO_PUBLIC_AUTH_URL` | Yes | `https://auth.ecoeats.app` |

### Auth Worker (`.dev.vars` in `workers/auth/`)

| Variable | Required | Example |
|----------|----------|---------|
| `SUPABASE_DB_URL` | Yes | `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres` |
| `RESEND_API_KEY` | Yes | `re_abc123...` |
| `BETTER_AUTH_SECRET` | Yes | `kJ7hR9sN2m...` (32+ chars) |
| `ENVIRONMENT` | No | Set automatically via wrangler.toml |

---

## Quick Reference Commands

```bash
# Auth Worker
cd workers/auth
bun install                    # Install dependencies
bun run dev                    # Start dev server
bun run migrate                # Run DB migrations
bun run deploy:staging         # Deploy to staging
bun run deploy:prod            # Deploy to production
bunx wrangler secret put XXX   # Set production secret

# Expo App
bun install                    # Install dependencies
bun start                      # Start dev server
bun run ios                    # Run on iOS Simulator
bun run android                # Run on Android Emulator
bun run web                    # Run in browser

# EAS Build
eas build --platform ios       # Build iOS
eas build --platform android   # Build Android
eas submit --platform ios      # Submit to App Store
```

---

## Security Checklist

- [ ] `.dev.vars` is in `.gitignore` (never committed)
- [ ] `.env.local` is in `.gitignore` (never committed)
- [ ] Production secrets set via `wrangler secret put`
- [ ] Database password is strong (30+ chars)
- [ ] `BETTER_AUTH_SECRET` is 32+ characters
- [ ] CORS origin restricts to your domains only
- [ ] Database uses Row Level Security (RLS) policies
- [ ] API keys are rotateable (you can regenerate if leaked)

---

## Next Steps After Deployment

1. **Monitor auth worker:** Cloudflare Dashboard → Workers → ecoeats-auth → Logs
2. **Monitor emails:** Resend Dashboard → Emails
3. **Monitor database:** Supabase Dashboard → Logs → Postgres
4. **Set up analytics:** Configure Umami/PostHog for app usage tracking
5. **Configure alerts:** Set up error tracking (Sentry/Bugsnag)

---

## Support

- **Expo Docs:** https://docs.expo.dev
- **Better Auth Docs:** https://better-auth.com
- **Supabase Docs:** https://supabase.com/docs
- **Cloudflare Workers Docs:** https://developers.cloudflare.com/workers
- **Resend Docs:** https://resend.com/docs
