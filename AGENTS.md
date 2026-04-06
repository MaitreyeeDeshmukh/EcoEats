# EcoEats — Campus Food Rescue

PWA for rescuing surplus food on campus. Users browse listings, claim food, and track environmental impact.

## Commands

```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Production build
npm run lint     # ESLint check
npm run preview  # Preview production build
```

## Environment

Create `.env.local`:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

## Database Setup

1. Run `supabase/schema.sql` in Supabase SQL Editor
2. Seed: `SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx node src/scripts/seedSupabase.js`

## Structure

```
src/
  contexts/        # React contexts (use this folder, not context/)
  hooks/           # Custom hooks
  services/        # API layer
  components/
    ui/            # Generic UI components
    features/      # Domain components
    auth/          # Auth flow components
  pages/           # Route components (lazy-loaded)
  lib/supabase.js  # Supabase client (canonical)
```

## Routes

| Path | Page |
|------|------|
| /feed | Browse food listings |
| /map | Map view of listings |
| /post | Create listing (organizers) |
| /claims | Your claimed items |
| /impact | Environmental stats |
| /profile | User profile |

## Gotchas

- Two `supabase.js` files exist — use `src/lib/supabase.js`
- Two context folders exist — use `src/contexts/`
- README.md describes old food delivery concept (ignore)
- No test framework installed
- Uses npm, ESLint, Vercel (not bun, Biome, Cloudflare)
