# EcoEats

**Campus Food Rescue — rescue surplus food, reduce waste, feed people.**

**GitHub**: https://github.com/MaitreyeeDeshmukh/EcoEats

---

## What It Does

- Browse surplus food listings from campus events/cafeterias
- Claim available food before it expires
- Track your environmental impact (meals rescued, CO₂ saved)
- Full PWA — works offline, installable on mobile
- Real-time updates when new listings appear

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Supabase (Postgres, Auth, RLS, Realtime) |
| Hosting | Vercel (auto-deploy from GitHub) |
| Maps | React Leaflet + OpenStreetMap (no API key) |
| Geocoding | Nominatim API (free, no API key) |
| PWA | vite-plugin-pwa + Workbox |
| Icons | Phosphor Icons |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/MaitreyeeDeshmukh/EcoEats.git
cd EcoEats
npm install
```

### 2. Create a Supabase project

1. Go to https://supabase.com → **New project**
2. Choose a region close to you
3. Wait for provisioning to complete

### 3. Run the database schema

In Supabase Dashboard → **SQL Editor** → **New query**, paste and run the contents of:

```
supabase/schema.sql
```

This creates tables for users, listings, claims, RLS policies, indexes, and the auto-profile trigger.

### 4. Add your environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find these in: Supabase Dashboard → Project Settings → API.

### 5. Seed the database (run once)

```bash
SUPABASE_URL=https://your-project-id.supabase.co \
SUPABASE_SERVICE_KEY=your-service-role-key \
node src/scripts/seedSupabase.js
```

The service role key bypasses RLS and is safe to use locally. Find it in:
Supabase Dashboard → Project Settings → API → **service_role** key.

### 6. Run locally

```bash
npm run dev
```

App runs at http://localhost:5173

### 7. Deploy to Vercel

1. Push this repo to GitHub
2. Go to https://vercel.com → **Add New Project** → import the GitHub repo
3. Add environment variables in Vercel Dashboard → Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-deploys on every push to `main`

### 8. Enable Google OAuth (optional)

In Supabase Dashboard → Authentication → Providers → Google:
1. Enable Google provider
2. Add your Google OAuth client ID and secret
3. Add `https://your-project-id.supabase.co/auth/v1/callback` as an authorized redirect URI in Google Cloud Console

---

## Pages

| Route | Page |
|---|---|
| `/` | Redirects to `/feed` |
| `/feed` | Browse food listings — search, filters |
| `/map` | Map view of active listings |
| `/post` | Create a listing (organizers only) |
| `/claims` | Your claimed items |
| `/impact` | Environmental stats — meals rescued, CO₂ saved |
| `/profile` | User profile, settings |

---

## User Roles

| Role | Permissions |
|---|---|
| `student` | Browse listings, claim food, view impact |
| `organizer` | All student permissions + create/manage listings |

---

## How Claims Work

1. Student browses active listings on `/feed` or `/map`
2. Claims available quantity (reservation valid for 15 min)
3. Picks up food at listed location before expiry
4. Host marks as picked up or no-show

---

## Project Structure

```
src/
  components/
    ui/          Button, Input, Badge, Card, Modal, Toast, Spinner, Skeleton
    features/    ListingCard, ClaimFlow, EcoBadge, ReservationTimer
    auth/        AuthFlow, Onboarding, SplashScreen, RoleSelector
    feed/        FeedView, FilterBar, ListingCard
    map/         MapView, ListingPin
    impact/      Dashboard, CounterRoll
    post/        PostForm, FoodSafetyChecklist, StepIndicator
  pages/         One file per route (lazy-loaded)
  contexts/      AuthContext, ListingsContext, ToastContext
  hooks/         useAuth, useListings, useClaims, useLocation, useOnlineStatus
  services/      auth.js, listings.js, claims.js, users.js, supabase.js
  utils/         formatters.js, validators.js, geocode.js, normalize.js
  lib/           supabase.js (canonical client)
  constants/     routes.js
supabase/
  schema.sql     Full DB schema with RLS policies
```

---

## License

MIT — built by Maitreyee Deshmukh
