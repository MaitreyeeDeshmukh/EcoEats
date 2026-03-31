# EcoEats

**Sustainable food delivery — order from eco-certified restaurants, see the carbon footprint of every meal.**

**GitHub**: https://github.com/MaitreyeeDeshmukh/EcoEats

---

## What It Does

- Browse and order from eco-certified restaurants in Pune
- See the CO₂ footprint of every dish before you order
- Track how much carbon you've saved compared to average delivery
- View your personal environmental impact — download a shareable card
- Full PWA — works offline, installable on mobile

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Supabase (Postgres, Auth, RLS) |
| Hosting | Vercel (auto-deploy from GitHub) |
| Maps | React Leaflet + OpenStreetMap (no API key) |
| Geocoding | Nominatim API (free, no API key) |
| PWA | vite-plugin-pwa + Workbox |
| Icons | Phosphor Icons |
| Carbon card export | html2canvas |

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
2. Choose a region close to India (e.g. Singapore)
3. Wait for provisioning to complete

### 3. Run the database schema

In Supabase Dashboard → **SQL Editor** → **New query**, paste and run the contents of:

```
supabase/schema.sql
```

This creates all tables, RLS policies, indexes, and the auto-profile trigger.

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

This seeds: **8 Pune restaurants**, **35+ menu items** with carbon data, **5 eco tips**.

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

Your live URL will be: **https://ecoeats.vercel.app** (or your custom domain)

### 8. Enable Google OAuth (optional)

In Supabase Dashboard → Authentication → Providers → Google:
1. Enable Google provider
2. Add your Google OAuth client ID and secret
3. Add `https://your-project-id.supabase.co/auth/v1/callback` as an authorized redirect URI in Google Cloud Console

---

## Pages

| Route | Page |
|---|---|
| `/` | Landing — hero, how it works, featured restaurants, impact counter |
| `/explore` | Browse restaurants — search, filters, list/map toggle |
| `/restaurant/:id` | Menu, eco badge, reviews, add to cart |
| `/cart` | Cart, address, COD payment, carbon summary |
| `/order/:id` | Order status tracker, map, carbon impact |
| `/profile` | Eco score, order history, saved addresses |
| `/impact` | Monthly CO₂ chart, vs-average comparison, shareable card |
| `/login` `/signup` | Auth with Google OAuth |

---

## Carbon Calculation

| Food type | CO₂ per dish |
|---|---|
| Plant-based | 100–300g |
| Mixed vegetarian | 300–600g |
| Meat dishes | 600–1,100g |

- **Baseline**: 2,400g CO₂ per average delivery order
- **Saved** = max(0, 2,400 − your order's total carbon)
- **Trees equivalent** = saved ÷ 21,000g (per tree per year)
- **Driving avoided** = saved ÷ 192g (CO₂ per km)

---

## Project Structure

```
src/
  components/
    ui/          Button, Input, Badge, Card, Modal, Toast, Spinner, Skeleton
    layout/      Navbar, Footer, PageWrapper, MobileDrawer
    features/    RestaurantCard, MenuItemCard, CartItem, OrderStatusTracker, EcoBadge, ReviewCard
  pages/         One file per route (lazy-loaded)
  context/       AuthContext, CartContext, ToastContext
  hooks/         useOrders, useRestaurants, useToast
  services/      auth.js, restaurants.js, menuItems.js, orders.js, reviews.js, users.js, supabase.js
  utils/         carbonCalculator.js, formatters.js, validators.js, geocode.js, normalize.js
  constants/     routes.js, categories.js
  scripts/       seedSupabase.js
supabase/
  schema.sql     Full DB schema with RLS policies
```

---

## License

MIT — built by Maitreyee Deshmukh
