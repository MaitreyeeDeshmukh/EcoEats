# EcoEats Expo Migration Design

> Archived on 2026-04-09. This document describes the earlier Worker + Supabase-client migration design and is superseded by [how-it-works.md](/Users/divkix/GitHub/EcoEats/docs/how-it-works.md) and [portable-backend-migration.md](/Users/divkix/GitHub/EcoEats/docs/portable-backend-migration.md).

**Date**: 2026-04-08  
**Status**: Approved  
**Platforms**: iOS, Android, Web  
**Timeline**: 12-18 days

## Summary

Migrate EcoEats from a React PWA (Vite + React Router) to a multi-platform Expo application supporting iOS, Android, and Web. Key changes include:

1. **TypeScript conversion** — Convert entire codebase to TypeScript
2. **Better Auth + magic link** — Replace Supabase Auth with self-hosted auth
3. **Expo Router** — File-based routing for all platforms
4. **NativeWind** — Tailwind CSS for React Native
5. **Hybrid state management** — Context for infrequent updates, Zustand for real-time
6. **Platform-native maps** — Apple Maps (iOS), Google Maps (Android), Leaflet (Web)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EcoEats Multi-Platform                    │
├─────────────────────────────────────────────────────────────┤
│  iOS App    │  Android App   │          Web App             │
│  (Expo)     │  (Expo)        │    (Expo Router Web)         │
├─────────────────────────────────────────────────────────────┤
│                    Shared Business Logic                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  Services   │  │    Hooks     │  │    Stores (Zustand) │ │
│  │  (Supabase) │  │  (useAuth,   │  │  (listings, cart)   │ │
│  │             │  │   useClaims) │  │                     │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │ Better Auth │  │   Contexts   │  │     Utilities      │ │
│  │ (Magic Link)│  │  (auth, toast│  │  (formatters, etc) │ │
│  │             │  │              │  │                     │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                     Platform Layer                           │
│  ┌───────────┐  ┌─────────────┐  ┌───────────────────────┐ │
│  │   Maps    │  │  Storage    │  │     Navigation        │ │
│  │ iOS: Apple│  │  (SecureStore│  │   (Expo Router)       │ │
│  │ Android:  │  │   + MMKV)   │  │                       │ │
│  │ Google    │  │             │  │                       │ │
│  └───────────┘  └─────────────┘  └───────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   Supabase PostgreSQL                        │
│              (listings, claims, users tables)                │
└─────────────────────────────────────────────────────────────┘
```

## Key Technical Decisions

### 1. TypeScript Conversion

**Strategy**: Convert to TypeScript first, before any component migration.

**Phase 1: Types Definition**
```typescript
// src/types/database.ts - Supabase table types
export interface Database {
  public: {
    Tables: {
      users: { Row: UserRow; Insert: UserInsert; Update: UserUpdate };
      listings: { Row: ListingRow; Insert: ListingInsert; Update: ListingUpdate };
      claims: { Row: ClaimRow; Insert: ClaimInsert; Update: ClaimUpdate };
    };
  };
}

// src/types/models.ts - Domain models
export interface Listing {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  description: string;
  foodItems: string[];
  quantity: number;
  quantityRemaining: number;
  dietaryTags: DietaryTag[];
  imageUrl: string | null;
  location: Location;
  expiresAt: Date | null;
  status: ListingStatus;
  postedAt: Date;
}

export type DietaryTag = 'vegetarian' | 'vegan' | 'halal' | 'kosher' | 'gluten-free';
export type ListingStatus = 'active' | 'claimed' | 'expired' | 'cancelled';
```

**Phase 2: Services Layer** — Pure TypeScript, no DOM dependencies. Shared across all platforms.

**Phase 3: Hooks Layer** — Minor platform adjustments (e.g., `navigator.geolocation` → `expo-location`).

**Phase 4: Components** — Convert to React Native primitives (`div` → `View`, `span` → `Text`, etc.)

### 2. Better Auth + Magic Link

**Self-hosted on Cloudflare Workers** for authentication.

**Flow:**
```
Mobile App → Better Auth Server → Supabase PostgreSQL
     │              │                    │
     │   1. Request magic link            │
     ├─────────────▶│                     │
     │              │                     │
     │   2. Email with deep link          │
     │◀─────────────│                     │
     │   (ecoeats://auth?token=xxx)       │
     │              │                     │
     │   3. Exchange token for session    │
     ├─────────────▶│                     │
     │              │   4. Create user    │
     │              ├────────────────────▶│
     │              │                     │
     │   5. Return JWT + refresh tokens   │
     │◀─────────────│                     │
     │              │                     │
     │   Store in SecureStore             │
```

**Configuration:**
```typescript
// workers/auth/index.ts (Cloudflare Workers)
import { betterAuth } from "better-auth";

export default betterAuth({
  database: {
    provider: "postgres",
    url: env.SUPABASE_DB_URL,
  },
  emailAndPassword: false,
  magicLink: {
    enabled: true,
    sendMagicLink: async ({ email, token }) => {
      await sendEmail({
        to: email,
        subject: "Sign in to EcoEats",
        body: `Click: ecoeats://auth?token=${token}`,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,
  },
});
```

**Security:**
- Tokens expire in 5 minutes
- One-time use tokens
- Rate limiting on magic link requests
- SecureStore for token storage on mobile
- HTTP-only cookies for web

### 3. Maps Implementation (Platform-Specific)

**Abstraction Layer:**
```typescript
// src/services/maps/types.ts
export interface MapProvider {
  showLocation(coords: Coordinates): void;
  addMarkers(listings: Listing[]): void;
  onMarkerSelect(callback: (listing: Listing) => void): void;
  getCurrentLocation(): Promise<Coordinates>;
}
```

**iOS**: Apple Maps via `react-native-maps` with `PROVIDER_DEFAULT`  
**Android**: Google Maps via `react-native-maps` with `PROVIDER_GOOGLE` (requires API key)  
**Web**: Keep Leaflet (`react-leaflet`) for web — works fine in browser

**Platform Selection:**
```typescript
// src/services/maps/index.ts
import { Platform } from 'react-native';

export function getMapComponent() {
  if (Platform.OS === 'ios') return MapViewIOS;
  if (Platform.OS === 'android') return MapViewAndroid;
  return MapViewWeb;
}
```

**Configuration Required:**
```json
// app.json (Expo)
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
      }
    }
  }
}
```

### 4. State Management (Hybrid)

**Zustand** for frequently-updated state (listings, cart)  
**React Context** for infrequently-updated state (auth, toast)

**Zustand Store (Listings):**
```typescript
// src/stores/listings.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface ListingsState {
  listings: Listing[];
  filters: Filters;
  loading: boolean;
  error: string | null;
  setFilters: (filters: Partial<Filters>) => void;
  clearFilters: () => void;
}

export const useListingsStore = create<ListingsState>()(
  subscribeWithSelector((set, get) => ({
    listings: [],
    filters: { dietary: [], radiusMiles: 1, maxMinutes: 90 },
    loading: true,
    error: null,
    setFilters: (filters) => set((state) => ({ 
      filters: { ...state.filters, ...filters } 
    })),
    clearFilters: () => set({ 
      filters: { dietary: [], radiusMiles: 1, maxMinutes: 90 } 
    }),
  }))
);

// Selective subscription - only re-renders when filtered listings change
export function useFilteredListings() {
  const listings = useListingsStore((s) => s.listings);
  const filters = useListingsStore((s) => s.filters);
  
  return useMemo(() => {
    return listings.filter((l) => {
      if (filters.dietary.length === 0) return true;
      return filters.dietary.every((tag) => l.dietaryTags.includes(tag));
    });
  }, [listings, filters]);
}
```

**React Context (Auth):**
```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@better-auth/core';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authClient.onSessionChange((session) => {
      setSession(session);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string) => {
    await authClient.signIn.magicLink({ email });
  };

  const signOut = async () => {
    await authClient.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext)!;
```

**Migration Mapping:**

| Current | New | Rationale |
|---------|-----|-----------|
| `ListingsContext` | `useListingsStore` (Zustand) | Real-time updates cause re-renders |
| `CartContext` | `useCartStore` (Zustand) | Cart updates frequently |
| `AuthContext` | `AuthContext` (Context) | Updates infrequently (login/logout only) |
| `ToastContext` | `ToastContext` (Context) | Updates infrequently (show/dismiss) |

## Project Structure

```
ecoeats-native/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx               # Root layout (providers)
│   ├── (auth)/                   # Auth group (not in tab bar)
│   │   ├── _layout.tsx
│   │   ├── login.tsx             # /login
│   │   ├── auth/callback.tsx     # /auth/callback (deep link)
│   │   └── onboarding.tsx        # /onboarding
│   ├── (tabs)/                   # Tab navigation group
│   │   ├── _layout.tsx           # Tab bar layout
│   │   ├── feed.tsx              # /feed (Home)
│   │   ├── map.tsx               # /map
│   │   ├── post.tsx              # /post
│   │   ├── claims.tsx            # /claims
│   │   ├── impact.tsx            # /impact
│   │   └── profile.tsx           # /profile
│   └── +not-found.tsx            # 404 page
├── src/
│   ├── components/
│   │   ├── ui/                   # Generic UI (Button, Card, etc.)
│   │   ├── features/             # Domain components
│   │   ├── feed/                 # Feed-specific
│   │   ├── map/                  # Map-specific (platform implementations)
│   │   ├── claim/
│   │   └── impact/
│   ├── services/
│   │   ├── supabase.ts           # Supabase client
│   │   ├── listings.ts           # Listing operations
│   │   ├── claims.ts             # Claim operations
│   │   ├── users.ts              # User profile
│   │   └── auth.ts               # Better Auth client
│   ├── stores/
│   │   ├── listings.ts           # Zustand store
│   │   └── cart.ts               # Zustand store
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ToastContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useListings.ts
│   │   ├── useClaims.ts
│   │   ├── useLocation.ts        # expo-location
│   │   └── useOnlineStatus.ts    # @react-native-community/netinfo
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── distance.ts
│   ├── types/
│   │   ├── database.ts           # Supabase table types
│   │   ├── models.ts             # Domain models
│   │   └── api.ts                # API response types
│   └── constants/
│       ├── routes.ts
│       └── categories.ts
├── workers/                      # Cloudflare Workers
│   └── auth/
│       └── index.ts              # Better Auth server
├── app.json                      # Expo config
├── tailwind.config.js            # NativeWind config
├── metro.config.js               # Metro bundler
├── package.json
├── tsconfig.json
└── .env.local
```

## Migration Phases

### Phase 0: Preparation (1-2 days)

1. Create Expo project with TypeScript + Expo Router
2. Install dependencies:
   - `expo-location`, `expo-secure-store`
   - `@react-native-community/netinfo`
   - `react-native-maps`
   - `zustand`
   - `nativewind`
   - `@supabase/supabase-js`
   - `phosphor-react-native`, `react-native-svg`
3. Configure NativeWind (Tailwind for RN)
4. Set up tsconfig paths (`@/*` → `./src/*`)

### Phase 1: Better Auth Server (2-3 days)

1. Create Cloudflare Worker for Better Auth
2. Configure magic link email sending (Resend/Postmark)
3. Set up database tables (extend existing Supabase schema)
4. Create auth client SDK for mobile/web
5. Configure deep links (`ecoeats://auth/callback`)

### Phase 2: TypeScript Types + Services (2-3 days)

1. Generate Supabase types: `npx supabase gen types typescript --project-id xxx > src/types/database.ts`
2. Convert services layer to TypeScript (pure TS, no DOM)
3. Update auth service for Better Auth

### Phase 3: State Management (1 day)

1. Create Zustand stores (`listings`, `cart`)
2. Convert contexts (`AuthContext`, `ToastContext`)

### Phase 4: UI Components (3-4 days)

1. Convert generic UI components:
   - `Button` → React Native Pressable + NativeWind
   - `Card` → View + NativeWind
   - `Input` → TextInput + NativeWind
   - `Badge` → View + Text
   - `Toast` → react-native-toast-message
2. Convert feature components:
   - `ListingCard` → React Native Image + Text
   - `ClaimFlow` → Modal/Sheet
   - `FilterBar` → ScrollView + TouchableOpacity
3. Create platform-specific components:
   - Maps (iOS/Android/Web)
   - Location service (`expo-location`)

### Phase 5: Pages/Screens (2-3 days)

1. Create route files in `app/(tabs)/`:
   - `feed.tsx`, `map.tsx`, `post.tsx`, `claims.tsx`, `impact.tsx`, `profile.tsx`
2. Create auth screens in `app/(auth)/`:
   - `login.tsx`, `onboarding.tsx`, `auth/callback.tsx`
3. Create layouts:
   - `app/_layout.tsx` (root providers)
   - `app/(tabs)/_layout.tsx` (tab bar)
   - `app/(auth)/_layout.tsx` (auth flow)

### Phase 6: Testing + Polish (2-3 days)

1. Test on all platforms (iOS Simulator, Android Emulator, Web)
2. Platform-specific polish:
   - iOS: SF Symbols, Haptic feedback
   - Android: Material Design ripples
   - Web: Keyboard navigation, SEO
3. Performance optimization:
   - List virtualization (FlashList)
   - Image optimization
   - Bundle size reduction

### Phase 7: Deployment (1-2 days)

1. Build native apps:
   - `eas build --platform ios`
   - `eas build --platform android`
2. Submit to stores:
   - App Store (iOS)
   - Google Play (Android)
3. Deploy web:
   - Vercel or Cloudflare Pages
4. Deploy Better Auth worker:
   - Cloudflare Workers

---

**Total Estimate: 12-18 days**

## Dependencies

### Core
| Package | Purpose |
|---------|---------|
| `expo` | Core Expo SDK |
| `expo-router` | File-based routing |
| `expo-location` | GPS/location services |
| `expo-secure-store` | Secure token storage |
| `@react-native-community/netinfo` | Network status |

### Maps
| Package | Purpose |
|---------|---------|
| `react-native-maps` | Native maps component |

### State
| Package | Purpose |
|---------|---------|
| `zustand` | State management |

### Styling
| Package | Purpose |
|---------|---------|
| `nativewind` | Tailwind CSS for React Native |

### Backend
| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Supabase client (works everywhere) |
| `better-auth` | Self-hosted authentication |

### UI
| Package | Purpose |
|---------|---------|
| `phosphor-react-native` | Icons |
| `react-native-svg` | SVG support |
| `react-native-toast-message` | Toast notifications |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Deep link configuration issues | Test early on physical devices; use universal links |
| Google Maps API key required | Apply early; have fallback to OSM if rejected |
| NativeWind compatibility | Test complex layouts early; keep fallback to inline styles |
| Better Auth email deliverability | Use reputable provider (Resend, Postmark); implement fallback |
| Web SEO with Expo Router | Configure SSR properly; add meta tags, sitemap |

## Success Criteria

1. ✅ All three platforms (iOS, Android, Web) deployable
2. ✅ Magic link authentication working on all platforms
3. ✅ Real-time listings update without performance issues
4. ✅ Maps functional on all platforms
5. ✅ Full TypeScript coverage with strict mode
6. ✅ No runtime errors on any platform
7. ✅ Parity with current PWA features
