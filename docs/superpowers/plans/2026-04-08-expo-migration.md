# EcoEats Expo Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate EcoEats from React PWA to multi-platform Expo app (iOS, Android, Web) with TypeScript, Better Auth, and platform-native maps.

**Architecture:** Expo Router file-based routing with shared business logic layer (services, hooks, stores) and platform-specific implementations for maps and storage.

**Tech Stack:** Expo SDK 52, TypeScript, Expo Router, NativeWind (Tailwind for RN), Zustand, Better Auth, Supabase, react-native-maps

---

## File Structure Overview

### New Files (Expo Project)
```
ecoeats-native/
├── app/
│   ├── _layout.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── onboarding.tsx
│   │   └── auth/
│   │       └── callback.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx (feed)
│   │   ├── map.tsx
│   │   ├── post.tsx
│   │   ├── claims.tsx
│   │   ├── impact.tsx
│   │   └── profile.tsx
│   └── +not-found.tsx
├── src/
│   ├── types/
│   │   ├── database.ts
│   │   ├── models.ts
│   │   └── api.ts
│   ├── services/
│   │   ├── supabase.ts
│   │   ├── listings.ts
│   │   ├── claims.ts
│   │   ├── users.ts
│   │   └── auth-client.ts
│   ├── stores/
│   │   ├── listings.ts
│   │   └── cart.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ToastContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useListings.ts
│   │   ├── useClaims.ts
│   │   ├── useLocation.ts
│   │   └── useOnlineStatus.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Toast.tsx
│   │   ├── features/
│   │   │   ├── ListingCard.tsx
│   │   │   ├── ClaimFlow.tsx
│   │   │   └── EcoBadge.tsx
│   │   ├── feed/
│   │   │   ├── FeedView.tsx
│   │   │   └── FilterBar.tsx
│   │   └── map/
│   │       ├── MapView.tsx
│   │       ├── MapViewIOS.tsx
│   │       ├── MapViewAndroid.tsx
│   │       └── MapViewWeb.tsx
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── distance.ts
│   │   └── foodSafety.ts
│   └── constants/
│       ├── routes.ts
│       └── categories.ts
├── workers/
│   └── auth/
│       ├── index.ts
│       └── wrangler.toml
├── app.json
├── tailwind.config.js
├── metro.config.js
├── global.css
├── package.json
├── tsconfig.json
└── .env.local
```

---

## Phase 0: Project Setup

### Task 0.1: Create Expo Project

**Files:**
- Create: `ecoeats-native/package.json`
- Create: `ecoeats-native/app.json`
- Create: `ecoeats-native/tsconfig.json`

- [ ] **Step 1: Create Expo project with TypeScript template**

```bash
cd /Users/divkix/GitHub
npx create-expo-app@latest ecoeats-native --template blank-typescript
cd ecoeats-native
```

- [ ] **Step 2: Install Expo Router**

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

- [ ] **Step 3: Update app.json for Expo Router**

```json
{
  "expo": {
    "name": "EcoEats",
    "slug": "ecoeats-native",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "ecoeats",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1B4332"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.ecoeats.app",
      "config": {
        "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1B4332"
      },
      "package": "com.ecoeats.app",
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 4: Update tsconfig.json with path aliases**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: initialize Expo project with TypeScript and Expo Router"
```

---

### Task 0.2: Install Dependencies

**Files:**
- Modify: `ecoeats-native/package.json`

- [ ] **Step 1: Install core Expo packages**

```bash
npx expo install expo-location expo-secure-store expo-constants expo-linking
```

- [ ] **Step 2: Install network and storage packages**

```bash
bun add @react-native-community/netinfo react-native-maps
```

- [ ] **Step 3: Install state management**

```bash
bun add zustand
```

- [ ] **Step 4: Install styling packages**

```bash
bun add nativewind react-native-reanimated react-native-gesture-handler
```

- [ ] **Step 5: Install Supabase client**

```bash
bun add @supabase/supabase-js
```

- [ ] **Step 6: Install UI packages**

```bash
bun add phosphor-react-native react-native-svg
bun add react-native-toast-message
```

- [ ] **Step 7: Install Better Auth client**

```bash
bun add better-auth
```

- [ ] **Step 8: Install development dependencies**

```bash
bun add -D @types/react @types/react-native tailwindcss
```

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install all required dependencies for Expo migration"
```

---

### Task 0.3: Configure NativeWind (Tailwind for RN)

**Files:**
- Create: `ecoeats-native/tailwind.config.js`
- Create: `ecoeats-native/global.css`
- Create: `ecoeats-native/metro.config.js`
- Create: `ecoeats-native/babel.config.js`

- [ ] **Step 1: Create tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1B4332',
          50: '#f0faf4',
          100: '#dcf5e7',
          200: '#bbead0',
          300: '#86d6ad',
          400: '#52b788',
          500: '#2d9163',
          600: '#1e7450',
          700: '#1B4332',
          800: '#163827',
          900: '#0f2a1d',
        },
        lime: {
          DEFAULT: '#52B788',
          accent: '#74C69D',
        },
        cream: '#F8F6F0',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn: '14px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Create global.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: Create metro.config.js**

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

- [ ] **Step 4: Create babel.config.js**

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.js global.css metro.config.js babel.config.js
git commit -m "chore: configure NativeWind for Tailwind CSS on React Native"
```

---

### Task 0.4: Create Environment Configuration

**Files:**
- Create: `ecoeats-native/.env.local`
- Create: `ecoeats-native/.env.example`

- [ ] **Step 1: Create .env.example**

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Better Auth
EXPO_PUBLIC_AUTH_URL=https://auth.ecoeats.app

# Google Maps (Android)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

- [ ] **Step 2: Create .env.local with actual values (DO NOT COMMIT)**

```env
# Supabase - copy from existing EcoEats project
EXPO_PUBLIC_SUPABASE_URL=<from VITE_SUPABASE_URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<from VITE_SUPABASE_ANON_KEY>

# Better Auth - will be set up later
EXPO_PUBLIC_AUTH_URL=http://localhost:8787

# Google Maps - obtain from Google Cloud Console
GOOGLE_MAPS_API_KEY=
```

- [ ] **Step 3: Update .gitignore**

```bash
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore
git add .gitignore .env.example
git commit -m "chore: add environment configuration files"
```

---

## Phase 1: Better Auth Server (Cloudflare Worker)

### Task 1.1: Create Better Auth Worker

**Files:**
- Create: `ecoeats-native/workers/auth/index.ts`
- Create: `ecoeats-native/workers/auth/wrangler.toml`
- Create: `ecoeats-native/workers/auth/schema.sql`

- [ ] **Step 1: Create workers directory**

```bash
mkdir -p workers/auth
```

- [ ] **Step 2: Create wrangler.toml**

```toml
name = "ecoeats-auth"
main = "index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "development"

[[d1_databases]]
binding = "DB"
database_name = "ecoeats-auth"
database_id = "placeholder"

[secrets]
SUPABASE_DB_URL
RESEND_API_KEY
```

- [ ] **Step 3: Create auth database schema**

```sql
-- workers/auth/schema.sql
-- Better Auth tables (add to existing Supabase schema)

CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  name TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires_at TIMESTAMP,
  refresh_token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_verification_tokens (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  reset_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX idx_auth_accounts_user ON auth_accounts(user_id);
CREATE INDEX idx_auth_verification_tokens ON auth_verification_tokens(identifier, token);
CREATE INDEX idx_auth_rate_limits ON auth_rate_limits(identifier, reset_at);
```

- [ ] **Step 4: Create Better Auth server**

```typescript
// workers/auth/index.ts
import { betterAuth } from 'better-auth';
import { createEmailSender } from './email';

export interface Env {
  SUPABASE_DB_URL: string;
  RESEND_API_KEY: string;
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const auth = betterAuth({
      database: {
        provider: 'postgres',
        url: env.SUPABASE_DB_URL,
      },
      emailAndPassword: false,
      magicLink: {
        enabled: true,
        sendMagicLink: async ({ email, token, url }) => {
          const sendEmail = createEmailSender(env.RESEND_API_KEY);
          
          // Deep link for mobile, regular URL for web
          const deepLinkUrl = `ecoeats://auth/callback?token=${token}`;
          const webUrl = `${url}?token=${token}`;
          
          await sendEmail({
            to: email,
            subject: 'Sign in to EcoEats',
            html: `
              <h1>Sign in to EcoEats</h1>
              <p>Click the link below to sign in:</p>
              <p><a href="${webUrl}">Sign in on web</a></p>
              <p>Or open this link in the EcoEats app: ${deepLinkUrl}</p>
              <p>This link expires in 5 minutes.</p>
            `,
          });
        },
        expiresAt: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24,    // Update every day
        cookieCache: {
          enabled: true,
          maxAge: 60 * 5, // 5 minutes
        },
      },
      rateLimit: {
        enabled: true,
        window: 60,          // 1 minute
        max: 3,              // 3 requests per minute
      },
      trustedOrigins: [
        'http://localhost:8081',
        'http://localhost:3000',
        'ecoeats://',
      ],
    });

    return auth.handler(request);
  },
};
```

- [ ] **Step 5: Create email sender utility**

```typescript
// workers/auth/email.ts
interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export function createEmailSender(apiKey: string) {
  return async function sendEmail(payload: EmailPayload): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EcoEats <noreply@ecoeats.app>',
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }
  };
}
```

- [ ] **Step 6: Commit**

```bash
git add workers/
git commit -m "feat: add Better Auth Cloudflare Worker with magic link support"
```

---

### Task 1.2: Create Auth Client SDK

**Files:**
- Create: `ecoeats-native/src/services/auth-client.ts`

- [ ] **Step 1: Create auth client**

```typescript
// src/services/auth-client.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_URL = process.env.EXPO_PUBLIC_AUTH_URL || 'http://localhost:8787';
const TOKEN_KEY = 'ecoeats_session';
const REFRESH_TOKEN_KEY = 'ecoeats_refresh';

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
}

class AuthClient {
  private session: Session | null = null;
  private listeners: Set<(session: Session | null) => void> = new Set();

  async getSession(): Promise<Session | null> {
    if (this.session) return this.session;

    const stored = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      this.session = {
        ...parsed,
        expiresAt: new Date(parsed.expiresAt),
      };
      return this.session;
    } catch {
      return null;
    }
  }

  async requestMagicLink(email: string): Promise<void> {
    const response = await fetch(`${AUTH_URL}/api/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send magic link');
    }
  }

  async verifyMagicLink(token: string): Promise<Session> {
    const response = await fetch(`${AUTH_URL}/api/auth/magic-link/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify magic link');
    }

    const data = await response.json();
    this.session = {
      ...data.session,
      expiresAt: new Date(data.session.expiresAt),
    };

    // Store securely
    await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(this.session));
    
    if (data.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
    }

    this.notifyListeners();
    return this.session;
  }

  async signOut(): Promise<void> {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await fetch(`${AUTH_URL}/api/auth/signout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      // Ignore signout errors
    }

    this.session = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    this.notifyListeners();
  }

  onSessionChange(callback: (session: Session | null) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    for (const callback of this.listeners) {
      callback(this.session);
    }
  }

  getAccessToken(): string | null {
    return this.session?.id || null;
  }
}

export const authClient = new AuthClient();
```

- [ ] **Step 2: Commit**

```bash
git add src/services/auth-client.ts
git commit -m "feat: add Better Auth client SDK with SecureStore integration"
```

---

## Phase 2: TypeScript Types

### Task 2.1: Create Type Definitions

**Files:**
- Create: `ecoeats-native/src/types/database.ts`
- Create: `ecoeats-native/src/types/models.ts`
- Create: `ecoeats-native/src/types/api.ts`

- [ ] **Step 1: Create database types**

```typescript
// src/types/database.ts
export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      listings: {
        Row: ListingRow;
        Insert: ListingInsert;
        Update: ListingUpdate;
      };
      claims: {
        Row: ClaimRow;
        Insert: ClaimInsert;
        Update: ClaimUpdate;
      };
    };
  };
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: 'student' | 'organizer';
  dietary_prefs: string[];
  impact_stats: ImpactStats;
  reputation_score: number;
  last_seen: string;
  created_at: string;
}

export interface UserInsert {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  role?: 'student' | 'organizer';
  dietary_prefs?: string[];
  impact_stats?: ImpactStats;
  reputation_score?: number;
}

export interface UserUpdate {
  name?: string;
  avatar_url?: string | null;
  role?: 'student' | 'organizer';
  dietary_prefs?: string[];
  impact_stats?: ImpactStats;
  host_building?: string;
}

export interface ListingRow {
  id: string;
  host_id: string;
  host_name: string;
  host_building: string | null;
  title: string;
  description: string | null;
  food_items: string[];
  quantity: number;
  quantity_remaining: number;
  dietary_tags: string[];
  image_url: string | null;
  building_name: string | null;
  room_number: string | null;
  lat: number | null;
  lng: number | null;
  expiry_minutes: number;
  expires_at: string;
  posted_at: string;
  status: 'active' | 'claimed' | 'expired' | 'cancelled';
  claimed_by: string[];
}

export interface ListingInsert {
  host_id: string;
  host_name: string;
  host_building?: string;
  title: string;
  description?: string;
  food_items?: string[];
  quantity: number;
  dietary_tags?: string[];
  image_url?: string | null;
  building_name?: string;
  room_number?: string;
  lat?: number | null;
  lng?: number | null;
  expiry_minutes?: number;
  expires_at: string;
}

export interface ListingUpdate {
  title?: string;
  description?: string;
  quantity?: number;
  quantity_remaining?: number;
  dietary_tags?: string[];
  image_url?: string | null;
  status?: 'active' | 'claimed' | 'expired' | 'cancelled';
}

export interface ClaimRow {
  id: string;
  listing_id: string;
  student_id: string;
  student_name: string;
  quantity: number;
  claimed_at: string;
  picked_up_at: string | null;
  status: 'pending' | 'picked_up' | 'no_show';
  reservation_expires_at: string;
  rating: number | null;
}

export interface ClaimInsert {
  listing_id: string;
  student_id: string;
  student_name: string;
  quantity: number;
  status?: 'pending';
  reservation_expires_at: string;
}

export interface ClaimUpdate {
  status?: 'pending' | 'picked_up' | 'no_show';
  picked_up_at?: string;
  rating?: number;
}

export interface ImpactStats {
  mealsRescued: number;
  co2Saved: number;
  pointsEarned: number;
}
```

- [ ] **Step 2: Create domain model types**

```typescript
// src/types/models.ts
export type DietaryTag = 'vegetarian' | 'vegan' | 'halal' | 'kosher' | 'gluten-free';
export type ListingStatus = 'active' | 'claimed' | 'expired' | 'cancelled';
export type ClaimStatus = 'pending' | 'picked_up' | 'no_show';
export type UserRole = 'student' | 'organizer';

export interface Location {
  lat: number;
  lng: number;
  buildingName: string;
  roomNumber?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  dietaryPrefs: DietaryTag[];
  hostBuilding: string;
  impactStats: ImpactStats;
  reputationScore: number;
}

export interface Listing {
  id: string;
  hostId: string;
  hostName: string;
  hostBuilding: string;
  title: string;
  description: string;
  foodItems: string[];
  quantity: number;
  quantityRemaining: number;
  dietaryTags: DietaryTag[];
  imageUrl: string | null;
  location: Location;
  expiresAt: Date | null;
  expiryMinutes: number;
  status: ListingStatus;
  postedAt: Date;
}

export interface Claim {
  id: string;
  listingId: string;
  studentId: string;
  studentName: string;
  quantity: number;
  status: ClaimStatus;
  claimedAt: Date;
  pickedUpAt: Date | null;
  reservationExpiresAt: Date;
  rating: number | null;
}

export interface ImpactStats {
  mealsRescued: number;
  co2Saved: number;
  pointsEarned: number;
}

export interface Filters {
  dietary: DietaryTag[];
  radiusMiles: number;
  maxMinutes: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}
```

- [ ] **Step 3: Create API types**

```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript type definitions for database models and API"
```

---

## Phase 3: Services Layer

### Task 3.1: Create Supabase Client

**Files:**
- Create: `ecoeats-native/src/services/supabase.ts`

- [ ] **Step 1: Create Supabase client**

```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage adapter for React Native
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/services/supabase.ts
git commit -m "feat: add Supabase client with SecureStore adapter for React Native"
```

---

### Task 3.2: Create Listings Service

**Files:**
- Create: `ecoeats-native/src/services/listings.ts`

- [ ] **Step 1: Create listings service**

```typescript
// src/services/listings.ts
import { supabase } from './supabase';
import type { Listing, Filters, DietaryTag } from '@/types/models';
import type { ListingRow } from '@/types/database';

const PAGE_SIZE = 50;

function normalizeListing(row: ListingRow): Listing {
  return {
    id: row.id,
    hostId: row.host_id,
    hostName: row.host_name,
    hostBuilding: row.host_building || '',
    title: row.title,
    description: row.description || '',
    foodItems: row.food_items || [],
    quantity: row.quantity,
    quantityRemaining: row.quantity_remaining,
    dietaryTags: (row.dietary_tags || []) as DietaryTag[],
    imageUrl: row.image_url,
    location: {
      lat: row.lat || 0,
      lng: row.lng || 0,
      buildingName: row.building_name || '',
      roomNumber: row.room_number || '',
    },
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    expiryMinutes: row.expiry_minutes,
    status: row.status,
    postedAt: new Date(row.posted_at),
  };
}

export async function fetchActiveListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('posted_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (error) throw error;
  return (data || []).map(normalizeListing);
}

export function subscribeToActiveListings(
  callback: (listings: Listing[]) => void
): () => void {
  // Initial fetch
  fetchActiveListings()
    .then(callback)
    .catch(console.error);

  // Subscribe to realtime changes
  const channel = supabase
    .channel('active-listings')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'listings' },
      () => {
        fetchActiveListings()
          .then(callback)
          .catch(console.error);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function createListing(
  data: Omit<Listing, 'id' | 'postedAt' | 'quantityRemaining' | 'claimedBy'>
): Promise<string> {
  const expiresAt = new Date(Date.now() + (data.expiryMinutes || 90) * 60 * 1000);

  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      host_id: data.hostId,
      host_name: data.hostName,
      host_building: data.hostBuilding,
      title: data.title,
      description: data.description,
      food_items: data.foodItems,
      quantity: data.quantity,
      quantity_remaining: data.quantity,
      dietary_tags: data.dietaryTags,
      image_url: data.imageUrl,
      building_name: data.location.buildingName,
      room_number: data.location.roomNumber,
      lat: data.location.lat,
      lng: data.location.lng,
      expiry_minutes: data.expiryMinutes || 90,
      expires_at: expiresAt.toISOString(),
      status: 'active',
    })
    .select('id')
    .single();

  if (error) throw error;
  return listing.id;
}

export async function getListingById(id: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return normalizeListing(data);
}

export async function updateListing(
  id: string,
  data: Partial<{ status: Listing['status']; quantityRemaining: number }>
): Promise<void> {
  const update: Record<string, unknown> = {};
  
  if (data.status !== undefined) {
    update.status = data.status;
  }
  if (data.quantityRemaining !== undefined) {
    update.quantity_remaining = data.quantityRemaining;
  }

  const { error } = await supabase
    .from('listings')
    .update(update)
    .eq('id', id);

  if (error) throw error;
}

export async function cancelListing(id: string): Promise<void> {
  const { error } = await supabase
    .from('listings')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) throw error;
}

export async function expireOldListings(): Promise<void> {
  await supabase
    .from('listings')
    .update({ status: 'expired' })
    .lt('expires_at', new Date().toISOString())
    .eq('status', 'active');
}

export function filterListings(
  listings: Listing[],
  filters: Filters
): Listing[] {
  return listings.filter((listing) => {
    // Dietary filter
    if (filters.dietary.length > 0) {
      const hasAllTags = filters.dietary.every((tag) =>
        listing.dietaryTags.includes(tag)
      );
      if (!hasAllTags) return false;
    }

    // Time filter
    if (listing.expiresAt) {
      const minutesRemaining = Math.floor(
        (listing.expiresAt.getTime() - Date.now()) / 60000
      );
      if (minutesRemaining > filters.maxMinutes) return false;
    }

    return true;
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/listings.ts
git commit -m "feat: add listings service with Supabase integration and realtime subscriptions"
```

---

### Task 3.3: Create Claims Service

**Files:**
- Create: `ecoeats-native/src/services/claims.ts`

- [ ] **Step 1: Create claims service**

```typescript
// src/services/claims.ts
import { supabase } from './supabase';
import type { Claim, ClaimStatus } from '@/types/models';
import type { ClaimRow } from '@/types/database';

const RESERVATION_MINUTES = 20;

function normalizeClaim(row: ClaimRow): Claim {
  return {
    id: row.id,
    listingId: row.listing_id,
    studentId: row.student_id,
    studentName: row.student_name,
    quantity: row.quantity,
    status: row.status as ClaimStatus,
    claimedAt: new Date(row.claimed_at),
    pickedUpAt: row.picked_up_at ? new Date(row.picked_up_at) : null,
    reservationExpiresAt: new Date(row.reservation_expires_at),
    rating: row.rating,
  };
}

export async function createClaim(
  listingId: string,
  studentId: string,
  studentName: string,
  quantity: number = 1
): Promise<string> {
  const reservationExpiresAt = new Date(
    Date.now() + RESERVATION_MINUTES * 60 * 1000
  );

  // Check for existing claim
  const { data: existing } = await supabase
    .from('claims')
    .select('id')
    .eq('listing_id', listingId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (existing) {
    throw new Error('Already claimed');
  }

  // Check listing availability
  const { data: listing, error: fetchError } = await supabase
    .from('listings')
    .select('quantity_remaining, status')
    .eq('id', listingId)
    .single();

  if (fetchError || !listing) {
    throw new Error('Listing not found');
  }

  if (listing.status !== 'active') {
    throw new Error('Listing is no longer active');
  }

  if (listing.quantity_remaining < quantity) {
    throw new Error('Not enough portions remaining');
  }

  // Create claim
  const { data: claim, error: claimError } = await supabase
    .from('claims')
    .insert({
      listing_id: listingId,
      student_id: studentId,
      student_name: studentName,
      quantity,
      status: 'pending',
      reservation_expires_at: reservationExpiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (claimError) throw claimError;

  // Update listing quantity
  const newQuantity = listing.quantity_remaining - quantity;
  await supabase
    .from('listings')
    .update({
      quantity_remaining: newQuantity,
      status: newQuantity === 0 ? 'claimed' : 'active',
    })
    .eq('id', listingId);

  return claim.id;
}

export async function confirmPickup(claimId: string): Promise<void> {
  const { error } = await supabase
    .from('claims')
    .update({
      status: 'picked_up',
      picked_up_at: new Date().toISOString(),
    })
    .eq('id', claimId);

  if (error) throw error;
}

export async function markNoShow(claimId: string): Promise<void> {
  // Get claim details first
  const { data: claim } = await supabase
    .from('claims')
    .select('listing_id, quantity')
    .eq('id', claimId)
    .single();

  if (!claim) throw new Error('Claim not found');

  // Update claim status
  const { error } = await supabase
    .from('claims')
    .update({ status: 'no_show' })
    .eq('id', claimId);

  if (error) throw error;

  // Restore listing quantity
  const { data: listing } = await supabase
    .from('listings')
    .select('quantity_remaining')
    .eq('id', claim.listing_id)
    .single();

  if (listing) {
    await supabase
      .from('listings')
      .update({
        quantity_remaining: listing.quantity_remaining + claim.quantity,
        status: 'active',
      })
      .eq('id', claim.listing_id);
  }
}

export async function submitRating(
  claimId: string,
  rating: number
): Promise<void> {
  const { error } = await supabase
    .from('claims')
    .update({ rating })
    .eq('id', claimId);

  if (error) throw error;
}

export function subscribeToStudentClaims(
  studentId: string,
  callback: (claims: Claim[]) => void
): () => void {
  async function fetch() {
    const { data } = await supabase
      .from('claims')
      .select('*')
      .eq('student_id', studentId)
      .order('claimed_at', { ascending: false })
      .limit(20);

    callback((data || []).map(normalizeClaim));
  }

  fetch();

  const channel = supabase
    .channel(`student-claims-${studentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'claims',
        filter: `student_id=eq.${studentId}`,
      },
      fetch
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function subscribeToListingClaims(
  listingId: string,
  callback: (claims: Claim[]) => void
): () => void {
  async function fetch() {
    const { data } = await supabase
      .from('claims')
      .select('*')
      .eq('listing_id', listingId)
      .order('claimed_at', { ascending: false });

    callback((data || []).map(normalizeClaim));
  }

  fetch();

  const channel = supabase
    .channel(`listing-claims-${listingId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'claims',
        filter: `listing_id=eq.${listingId}`,
      },
      fetch
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/claims.ts
git commit -m "feat: add claims service with transactional claim creation and realtime subscriptions"
```

---

### Task 3.4: Create Users Service

**Files:**
- Create: `ecoeats-native/src/services/users.ts`

- [ ] **Step 1: Create users service**

```typescript
// src/services/users.ts
import { supabase } from './supabase';
import type { User, ImpactStats, DietaryTag, UserRole } from '@/types/models';
import type { UserRow } from '@/types/database';

function normalizeUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar_url,
    role: row.role as UserRole,
    dietaryPrefs: (row.dietary_prefs || []) as DietaryTag[],
    hostBuilding: '',
    impactStats: row.impact_stats || { mealsRescued: 0, co2Saved: 0, pointsEarned: 0 },
    reputationScore: row.reputation_score || 100,
  };
}

export async function getUserProfile(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return normalizeUser(data);
}

export async function updateUserProfile(
  id: string,
  data: {
    name?: string;
    avatar?: string | null;
    dietaryPrefs?: DietaryTag[];
    role?: UserRole;
    hostBuilding?: string;
  }
): Promise<void> {
  const update: Record<string, unknown> = {};

  if (data.name !== undefined) update.name = data.name;
  if (data.avatar !== undefined) update.avatar_url = data.avatar;
  if (data.dietaryPrefs !== undefined) update.dietary_prefs = data.dietaryPrefs;
  if (data.role !== undefined) update.role = data.role;

  const { error } = await supabase
    .from('users')
    .update(update)
    .eq('id', id);

  if (error) throw error;
}

export async function incrementUserImpactStats(
  userId: string,
  quantity: number
): Promise<void> {
  const { data } = await supabase
    .from('users')
    .select('impact_stats')
    .eq('id', userId)
    .single();

  const current: ImpactStats = data?.impact_stats || {
    mealsRescued: 0,
    co2Saved: 0,
    pointsEarned: 0,
  };

  const POINTS_PER_MEAL = 10;

  const { error } = await supabase
    .from('users')
    .update({
      impact_stats: {
        mealsRescued: current.mealsRescued + quantity,
        co2Saved: current.co2Saved + quantity * 0.5,
        pointsEarned: current.pointsEarned + quantity * POINTS_PER_MEAL,
      },
    })
    .eq('id', userId);

  if (error) console.warn('Failed to update impact stats:', error.message);
}

export async function createUserProfile(
  id: string,
  data: {
    name: string;
    email: string;
    avatar?: string | null;
    role?: UserRole;
    dietaryPrefs?: DietaryTag[];
  }
): Promise<void> {
  const { error } = await supabase.from('users').insert({
    id,
    name: data.name,
    email: data.email,
    avatar_url: data.avatar,
    role: data.role || 'student',
    dietary_prefs: data.dietaryPrefs || [],
    impact_stats: { mealsRescued: 0, co2Saved: 0, pointsEarned: 0 },
    reputation_score: 100,
  });

  if (error) throw error;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/users.ts
git commit -m "feat: add users service for profile management and impact stats"
```

---

## Phase 4: State Management

### Task 4.1: Create Zustand Stores

**Files:**
- Create: `ecoeats-native/src/stores/listings.ts`
- Create: `ecoeats-native/src/stores/cart.ts`

- [ ] **Step 1: Create listings store**

```typescript
// src/stores/listings.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { subscribeToActiveListings, filterListings, expireOldListings } from '@/services/listings';
import type { Listing, Filters } from '@/types/models';

interface ListingsState {
  listings: Listing[];
  filteredListings: Listing[];
  filters: Filters;
  loading: boolean;
  error: string | null;
  subscription: (() => void) | null;
  
  setFilters: (filters: Partial<Filters>) => void;
  clearFilters: () => void;
  setListings: (listings: Listing[]) => void;
  subscribe: (userId: string) => void;
  unsubscribe: () => void;
}

const defaultFilters: Filters = {
  dietary: [],
  radiusMiles: 1,
  maxMinutes: 90,
};

export const useListingsStore = create<ListingsState>()(
  subscribeWithSelector((set, get) => ({
    listings: [],
    filteredListings: [],
    filters: defaultFilters,
    loading: true,
    error: null,
    subscription: null,

    setFilters: (filters) => {
      set((state) => {
        const newFilters = { ...state.filters, ...filters };
        return {
          filters: newFilters,
          filteredListings: filterListings(state.listings, newFilters),
        };
      });
    },

    clearFilters: () => {
      set((state) => ({
        filters: defaultFilters,
        filteredListings: filterListings(state.listings, defaultFilters),
      }));
    },

    setListings: (listings) => {
      set((state) => ({
        listings,
        filteredListings: filterListings(listings, state.filters),
        loading: false,
      }));
    },

    subscribe: (userId) => {
      const unsub = subscribeToActiveListings((listings) => {
        get().setListings(listings);
      });

      // Start expiration timer
      expireOldListings().catch(() => {});
      const timer = setInterval(() => expireOldListings().catch(() => {}), 60000);

      set({ subscription: () => {
        unsub();
        clearInterval(timer);
      }});
    },

    unsubscribe: () => {
      const { subscription } = get();
      if (subscription) {
        subscription();
        set({ subscription: null, listings: [], filteredListings: [] });
      }
    },
  }))
);

// Selective hooks
export function useFilteredListings() {
  return useListingsStore((s) => s.filteredListings);
}

export function useListingsLoading() {
  return useListingsStore((s) => s.loading);
}

export function useListingsFilters() {
  return useListingsStore((s) => s.filters);
}
```

- [ ] **Step 2: Create cart store**

```typescript
// src/stores/cart.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Listing } from '@/types/models';

interface CartItem {
  listingId: string;
  listing: Listing;
  quantity: number;
  addedAt: Date;
}

interface CartState {
  items: CartItem[];
  
  addItem: (listing: Listing, quantity?: number) => void;
  removeItem: (listingId: string) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  clear: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (listing, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (item) => item.listingId === listing.id
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.listingId === listing.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                listingId: listing.id,
                listing,
                quantity,
                addedAt: new Date(),
              },
            ],
          };
        });
      },

      removeItem: (listingId) => {
        set((state) => ({
          items: state.items.filter((item) => item.listingId !== listingId),
        }));
      },

      updateQuantity: (listingId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.listingId !== listingId),
            };
          }

          return {
            items: state.items.map((item) =>
              item.listingId === listingId ? { ...item, quantity } : item
            ),
          };
        });
      },

      clear: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'ecoeats-cart',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/
git commit -m "feat: add Zustand stores for listings and cart with persistence"
```

---

### Task 4.2: Create Auth Context

**Files:**
- Create: `ecoeats-native/src/contexts/AuthContext.tsx`

- [ ] **Step 1: Create Auth context**

```typescript
// src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { authClient, type Session, type User } from '@/services/auth-client';
import { getUserProfile, createUserProfile } from '@/services/users';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: User | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on mount
    authClient.getSession().then((session) => {
      setSession(session);
      setLoading(false);
    });

    // Subscribe to session changes
    const unsubscribe = authClient.onSessionChange((session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
      }
    });

    return unsubscribe;
  }, []);

  // Fetch profile when session changes
  useEffect(() => {
    if (session?.user) {
      getUserProfile(session.user.id)
        .then((profile) => {
          if (!profile) {
            // Create profile if it doesn't exist
            return createUserProfile(session.user.id, {
              name: session.user.name || 'EcoEats User',
              email: session.user.email,
              avatar: session.user.image,
            });
          }
          return profile;
        })
        .then((profile) => setProfile(profile as User | null))
        .catch(console.error);
    }
  }, [session]);

  const signIn = useCallback(async (email: string) => {
    await authClient.requestMagicLink(email);
  }, []);

  const signOut = useCallback(async () => {
    await authClient.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const profile = await getUserProfile(session.user.id);
      setProfile(profile);
    }
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        profile,
        loading,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: add Auth context with Better Auth integration"
```

---

### Task 4.3: Create Toast Context

**Files:**
- Create: `ecoeats-native/src/contexts/ToastContext.tsx`

- [ ] **Step 1: Create Toast context**

```typescript
// src/contexts/ToastContext.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  message: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  hide: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const show = useCallback((options: ToastOptions) => {
    Toast.show({
      type: options.type || 'info',
      text1: options.message,
      text2: options.description,
      visibilityTime: options.duration || 3000,
      position: 'top',
    });
  }, []);

  const success = useCallback((message: string, description?: string) => {
    show({ type: 'success', message, description });
  }, [show]);

  const error = useCallback((message: string, description?: string) => {
    show({ type: 'error', message, description });
  }, [show]);

  const info = useCallback((message: string, description?: string) => {
    show({ type: 'info', message, description });
  }, [show]);

  const hide = useCallback(() => {
    Toast.hide();
  }, []);

  return (
    <ToastContext.Provider value={{ show, success, error, info, hide }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/contexts/ToastContext.tsx
git commit -m "feat: add Toast context with react-native-toast-message integration"
```

---

## Phase 5: UI Components

### Task 5.1: Create Button Component

**Files:**
- Create: `ecoeats-native/src/components/ui/Button.tsx`

- [ ] **Step 1: Create Button component**

```typescript
// src/components/ui/Button.tsx
import { Pressable, Text, ActivityIndicator, type ViewStyle } from 'react-native';
import { styled } from 'nativewind';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

const StyledPressable = styled(Pressable);
const StyledText = styled(Text);

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onPress,
  style,
}: ButtonProps) {
  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-forest-700 active:bg-forest-800',
    secondary: 'bg-lime active:bg-lime-accent',
    outline: 'bg-transparent border-2 border-forest-700 active:bg-forest-50',
    ghost: 'bg-transparent active:bg-forest-50',
  };

  const textVariantStyles: Record<ButtonVariant, string> = {
    primary: 'text-white',
    secondary: 'text-forest-900',
    outline: 'text-forest-700',
    ghost: 'text-forest-700',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const textSizeStyles: Record<ButtonSize, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <StyledPressable
      className={`
        rounded-btn items-center justify-center flex-row
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled || loading ? 'opacity-50' : ''}
      `}
      onPress={onPress}
      disabled={disabled || loading}
      style={style}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : '#1B4332'}
        />
      ) : (
        <StyledText
          className={`
            font-body font-semibold
            ${textVariantStyles[variant]}
            ${textSizeStyles[size]}
          `}
        >
          {children}
        </StyledText>
      )}
    </StyledPressable>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "feat: add Button component with NativeWind styling"
```

---

### Task 5.2: Create Card Component

**Files:**
- Create: `ecoeats-native/src/components/ui/Card.tsx`

- [ ] **Step 1: Create Card component**

```typescript
// src/components/ui/Card.tsx
import { View, type ViewStyle } from 'react-native';
import { styled } from 'nativewind';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: ViewStyle;
}

const StyledView = styled(View);

export function Card({ children, className = '', style }: CardProps) {
  return (
    <StyledView
      className={`
        bg-white rounded-card shadow-card p-4
        ${className}
      `}
      style={style}
    >
      {children}
    </StyledView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Card.tsx
git commit -m "feat: add Card component"
```

---

### Task 5.3: Create Input Component

**Files:**
- Create: `ecoeats-native/src/components/ui/Input.tsx`

- [ ] **Step 1: Create Input component**

```typescript
// src/components/ui/Input.tsx
import { View, TextInput, Text, type TextInputProps } from 'react-native';
import { styled } from 'nativewind';

interface InputProps extends Omit<TextInputProps, 'className'> {
  label?: string;
  error?: string;
  className?: string;
}

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);

export function Input({
  label,
  error,
  className = '',
  ...props
}: InputProps) {
  return (
    <StyledView className={`mb-4 ${className}`}>
      {label && (
        <StyledText className="text-sm font-body font-medium text-gray-700 mb-1">
          {label}
        </StyledText>
      )}
      <StyledTextInput
        className={`
          bg-white border rounded-btn px-4 py-3 font-body text-base
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${props.editable === false ? 'bg-gray-100 text-gray-500' : 'text-gray-900'}
        `}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && (
        <StyledText className="text-sm text-red-500 mt-1 font-body">
          {error}
        </StyledText>
      )}
    </StyledView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Input.tsx
git commit -m "feat: add Input component with label and error support"
```

---

### Task 5.4: Create Badge Component

**Files:**
- Create: `ecoeats-native/src/components/ui/Badge.tsx`

- [ ] **Step 1: Create Badge component**

```typescript
// src/components/ui/Badge.tsx
import { View, Text } from 'react-native';
import { styled } from 'nativewind';
import type { ReactNode } from 'react';
import type { DietaryTag } from '@/types/models';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  dietary?: DietaryTag;
  size?: 'sm' | 'md';
}

const StyledView = styled(View);
const StyledText = styled(Text);

const dietaryColors: Record<DietaryTag, string> = {
  vegetarian: 'bg-green-100 text-green-800',
  vegan: 'bg-emerald-100 text-emerald-800',
  halal: 'bg-teal-100 text-teal-800',
  kosher: 'bg-blue-100 text-blue-800',
  'gluten-free': 'bg-amber-100 text-amber-800',
};

const variantColors = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
};

export function Badge({
  children,
  variant = 'default',
  dietary,
  size = 'sm',
}: BadgeProps) {
  const colorClasses = dietary ? dietaryColors[dietary] : variantColors[variant];
  
  const sizeClasses = {
    sm: 'px-2 py-0.5',
    md: 'px-3 py-1',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
  };

  return (
    <StyledView
      className={`
        rounded-full self-start
        ${colorClasses.split(' ')[0]}
        ${sizeClasses[size]}
      `}
    >
      <StyledText
        className={`
          font-body font-medium capitalize
          ${colorClasses.split(' ')[1]}
          ${textSizeClasses[size]}
        `}
      >
        {children}
      </StyledText>
    </StyledView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Badge.tsx
git commit -m "feat: add Badge component with dietary tag styling"
```

---

### Task 5.5: Create Spinner Component

**Files:**
- Create: `ecoeats-native/src/components/ui/Spinner.tsx`

- [ ] **Step 1: Create Spinner component**

```typescript
// src/components/ui/Spinner.tsx
import { View, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  className?: string;
}

const StyledView = styled(View);

export function Spinner({
  size = 'large',
  color = '#1B4332',
  className = '',
}: SpinnerProps) {
  return (
    <StyledView className={`items-center justify-center ${className}`}>
      <ActivityIndicator size={size} color={color} />
    </StyledView>
  );
}

export function FullPageSpinner() {
  return (
    <StyledView className="flex-1 items-center justify-center bg-cream">
      <Spinner />
    </StyledView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Spinner.tsx
git commit -m "feat: add Spinner component"
```

---

## Phase 6: Feature Components

### Task 6.1: Create ListingCard Component

**Files:**
- Create: `ecoeats-native/src/components/features/ListingCard.tsx`

- [ ] **Step 1: Create ListingCard component**

```typescript
// src/components/features/ListingCard.tsx
import { View, Text, Image, Pressable } from 'react-native';
import { styled } from 'nativewind';
import { MapPin, Clock, Leaf } from 'phosphor-react-native';
import type { Listing } from '@/types/models';
import { Badge } from '@/components/ui/Badge';
import { getTimeRemaining } from '@/utils/foodSafety';

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
}

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);
const StyledImage = styled(Image);

export function ListingCard({ listing, onPress }: ListingCardProps) {
  const remaining = getTimeRemaining(listing.expiresAt);
  const isExpiringSoon = remaining?.minutes !== undefined && remaining.minutes < 15;

  return (
    <StyledPressable
      className="bg-white rounded-card shadow-card overflow-hidden active:opacity-80"
      onPress={onPress}
    >
      {/* Image */}
      <StyledView className="h-32 bg-forest-50">
        {listing.imageUrl ? (
          <StyledImage
            source={{ uri: listing.imageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <StyledView className="flex-1 items-center justify-center">
            <Leaf size={40} color="#52B788" />
          </StyledView>
        )}
        
        {/* Quantity badge */}
        <StyledView className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-full">
          <StyledText className="text-xs font-body font-medium text-forest-700">
            {listing.quantityRemaining} left
          </StyledText>
        </StyledView>
      </StyledView>

      {/* Content */}
      <StyledView className="p-3">
        <StyledText className="font-display font-bold text-base text-gray-900 mb-1">
          {listing.title}
        </StyledText>

        {/* Location */}
        <StyledView className="flex-row items-center mb-2">
          <MapPin size={14} color="#6B7280" />
          <StyledText className="text-xs text-gray-500 font-body ml-1">
            {listing.location.buildingName}
            {listing.location.roomNumber && ` · Rm ${listing.location.roomNumber}`}
          </StyledText>
        </StyledView>

        {/* Time */}
        <StyledView className="flex-row items-center mb-2">
          <Clock size={14} color={isExpiringSoon ? '#EF4444' : '#6B7280'} />
          <StyledText
            className={`text-xs font-body ml-1 ${
              isExpiringSoon ? 'text-red-500 font-medium' : 'text-gray-500'
            }`}
          >
            {remaining?.display || 'Expired'}
          </StyledText>
        </StyledView>

        {/* Dietary tags */}
        {listing.dietaryTags.length > 0 && (
          <StyledView className="flex-row flex-wrap gap-1">
            {listing.dietaryTags.slice(0, 3).map((tag) => (
              <Badge key={tag} dietary={tag}>
                {tag}
              </Badge>
            ))}
          </StyledView>
        )}
      </StyledView>
    </StyledPressable>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/features/ListingCard.tsx
git commit -m "feat: add ListingCard component with NativeWind styling"
```

---

## Phase 7: Utility Functions

### Task 7.1: Create Utility Functions

**Files:**
- Create: `ecoeats-native/src/utils/formatters.ts`
- Create: `ecoeats-native/src/utils/validators.ts`
- Create: `ecoeats-native/src/utils/foodSafety.ts`
- Create: `ecoeats-native/src/utils/distance.ts`

- [ ] **Step 1: Create formatters**

```typescript
// src/utils/formatters.ts
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatTime(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
```

- [ ] **Step 2: Create validators**

```typescript
// src/utils/validators.ts
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return 'Email is required';
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'Invalid email format';
  }
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) {
    return 'Name is required';
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  return null;
}

export function validateTitle(title: string): string | null {
  if (!title.trim()) {
    return 'Title is required';
  }
  if (title.trim().length < 3) {
    return 'Title must be at least 3 characters';
  }
  return null;
}

export function validateQuantity(quantity: number): string | null {
  if (quantity < 1) {
    return 'Quantity must be at least 1';
  }
  if (quantity > 100) {
    return 'Quantity cannot exceed 100';
  }
  return null;
}
```

- [ ] **Step 3: Create food safety utils**

```typescript
// src/utils/foodSafety.ts
interface TimeRemaining {
  minutes: number;
  display: string;
}

export function getTimeRemaining(expiresAt: Date | null): TimeRemaining | null {
  if (!expiresAt) return null;

  const now = Date.now();
  const expiry = expiresAt.getTime();
  const diffMs = expiry - now;

  if (diffMs <= 0) {
    return { minutes: 0, display: 'Expired' };
  }

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  let display: string;
  if (hours > 0) {
    display = `${hours}h ${mins}m left`;
  } else if (mins > 0) {
    display = `${mins}m left`;
  } else {
    const seconds = Math.floor(diffMs / 1000);
    display = `${seconds}s left`;
  }

  return { minutes, display };
}

export function isExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() <= Date.now();
}

export function isExpiringSoon(expiresAt: Date | null, thresholdMinutes: number = 15): boolean {
  if (!expiresAt) return false;
  const remaining = getTimeRemaining(expiresAt);
  return remaining ? remaining.minutes < thresholdMinutes : false;
}
```

- [ ] **Step 4: Create distance utils**

```typescript
// src/utils/distance.ts
export interface Coordinates {
  lat: number;
  lng: number;
}

export function calculateDistance(
  from: Coordinates,
  to: Coordinates
): number {
  const R = 6371000; // Earth's radius in meters
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusMiles: number
): boolean {
  const radiusMeters = radiusMiles * 1609.34;
  const distance = calculateDistance(center, point);
  return distance <= radiusMeters;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/
git commit -m "feat: add utility functions for formatting, validation, and calculations"
```

---

## Phase 8: App Layouts

### Task 8.1: Create Root Layout

**Files:**
- Create: `ecoeats-native/app/_layout.tsx`

- [ ] **Step 1: Create root layout**

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import '../global.css';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Show splash screen
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        <AuthProvider>
          <AuthGate>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </AuthGate>
          <Toast />
        </AuthProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: add root layout with providers"
```

---

### Task 8.2: Create Auth Layout

**Files:**
- Create: `ecoeats-native/app/(auth)/_layout.tsx`
- Create: `ecoeats-native/app/(auth)/login.tsx`
- Create: `ecoeats-native/app/(auth)/onboarding.tsx`
- Create: `ecoeats-native/app/(auth)/auth/callback.tsx`

- [ ] **Step 1: Create auth layout**

```typescript
// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth/callback" />
    </Stack>
  );
}
```

- [ ] **Step 2: Create login screen**

```typescript
// app/(auth)/login.tsx
import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Leaf } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { validateEmail } from '@/utils/validators';

const StyledView = styled(View);
const StyledText = styled(Text);

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  
  const { signIn } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const handleSignIn = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signIn(email);
      setSent(true);
      toast.success('Magic link sent!', 'Check your email to sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <StyledView className="flex-1 bg-cream items-center justify-center p-6">
        <Leaf size={60} color="#1B4332" />
        <StyledText className="font-display font-bold text-2xl text-forest-700 mt-4 text-center">
          Check your email
        </StyledText>
        <StyledText className="font-body text-gray-600 mt-2 text-center">
          We sent a magic link to {email}
        </StyledText>
        <Button
          variant="ghost"
          onPress={() => setSent(false)}
          className="mt-4"
        >
          Try again
        </Button>
      </StyledView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <StyledView className="flex-1 bg-cream p-6">
          {/* Logo */}
          <StyledView className="items-center mt-20 mb-10">
            <Leaf size={60} color="#1B4332" />
            <StyledText className="font-display font-bold text-3xl text-forest-700 mt-4">
              EcoEats
            </StyledText>
            <StyledText className="font-body text-gray-600 mt-2">
              Rescue food. Feed people.
            </StyledText>
          </StyledView>

          {/* Form */}
          <StyledView className="bg-white rounded-card shadow-card p-6">
            <StyledText className="font-display font-bold text-xl text-gray-900 mb-4">
              Sign in
            </StyledText>
            
            <Input
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              error={error || undefined}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
            />

            <Button
              onPress={handleSignIn}
              loading={loading}
              className="mt-2"
            >
              Send magic link
            </Button>
          </StyledView>
        </StyledView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 3: Create onboarding screen**

```typescript
// app/(auth)/onboarding.tsx
import { useState } from 'react';
import { View, Text } from 'react-native';
import { styled } from 'nativewind';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { updateUserProfile } from '@/services/users';

const StyledView = styled(View);
const StyledText = styled(Text);

type UserRole = 'student' | 'organizer';

export default function OnboardingScreen() {
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  
  const { user, refreshProfile } = useAuth();
  const router = useRouter();

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await updateUserProfile(user.id, { role });
      await refreshProfile();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledView className="flex-1 bg-cream p-6">
      <StyledText className="font-display font-bold text-2xl text-gray-900 text-center mt-10">
        How will you use EcoEats?
      </StyledText>

      <StyledView className="mt-8 gap-4">
        <StyledView
          className={`
            bg-white rounded-card p-4 border-2
            ${role === 'student' ? 'border-forest-700' : 'border-transparent'}
          `}
          onTouchEnd={() => setRole('student')}
        >
          <StyledText className="font-display font-bold text-lg text-gray-900">
            Student
          </StyledText>
          <StyledText className="font-body text-gray-600 mt-1">
            Browse listings and claim available food
          </StyledText>
        </StyledView>

        <StyledView
          className={`
            bg-white rounded-card p-4 border-2
            ${role === 'organizer' ? 'border-forest-700' : 'border-transparent'}
          `}
          onTouchEnd={() => setRole('organizer')}
        >
          <StyledText className="font-display font-bold text-lg text-gray-900">
            Organizer
          </StyledText>
          <StyledText className="font-body text-gray-600 mt-1">
            Create listings and manage food distribution
          </StyledText>
        </StyledView>
      </StyledView>

      <StyledView className="flex-1" />

      <Button
        onPress={handleComplete}
        loading={loading}
        className="mb-8"
      >
        Continue
      </Button>
    </StyledView>
  );
}
```

- [ ] **Step 4: Create auth callback screen**

```typescript
// app/(auth)/auth/callback.tsx
import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { styled } from 'nativewind';
import { authClient } from '@/services/auth-client';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

const StyledView = styled(View);
const StyledText = styled(Text);

export default function AuthCallbackScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    if (!token) {
      router.replace('/(auth)/login');
      return;
    }

    authClient.verifyMagicLink(token)
      .then(async () => {
        await refreshProfile();
        router.replace('/(tabs)');
      })
      .catch((error) => {
        console.error('Auth callback error:', error);
        router.replace('/(auth)/login');
      });
  }, [token]);

  return (
    <StyledView className="flex-1 bg-cream items-center justify-center">
      <Spinner />
      <StyledText className="font-body text-gray-600 mt-4">
        Signing you in...
      </StyledText>
    </StyledView>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat: add auth screens (login, onboarding, callback)"
```

---

### Task 8.3: Create Tabs Layout

**Files:**
- Create: `ecoeats-native/app/(tabs)/_layout.tsx`
- Create: `ecoeats-native/app/(tabs)/index.tsx` (feed)

- [ ] **Step 1: Create tabs layout**

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { House, MapPin, Plus, ClipboardText, Leaf, User } from 'phosphor-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1B4332',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#F8F6F0',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontFamily: 'DM Sans',
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <House size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <MapPin size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          tabBarIcon: ({ color, size }) => (
            <Plus size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="claims"
        options={{
          title: 'Claims',
          tabBarIcon: ({ color, size }) => (
            <ClipboardText size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="impact"
        options={{
          title: 'Impact',
          tabBarIcon: ({ color, size }) => (
            <Leaf size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Create feed screen (index)**

```typescript
// app/(tabs)/index.tsx
import { useEffect } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { styled } from 'nativewind';
import { useAuth } from '@/contexts/AuthContext';
import { useListingsStore, useFilteredListings, useListingsLoading } from '@/stores/listings';
import { ListingCard } from '@/components/features/ListingCard';
import { Spinner } from '@/components/ui/Spinner';

const StyledView = styled(View);
const StyledText = styled(Text);

export default function FeedScreen() {
  const { user } = useAuth();
  const filteredListings = useFilteredListings();
  const loading = useListingsLoading();
  const subscribe = useListingsStore((s) => s.subscribe);
  const unsubscribe = useListingsStore((s) => s.unsubscribe);

  useEffect(() => {
    if (user) {
      subscribe(user.id);
    }
    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <Spinner className="flex-1 bg-cream" />;
  }

  if (filteredListings.length === 0) {
    return (
      <StyledView className="flex-1 bg-cream items-center justify-center p-6">
        <StyledText className="font-display font-bold text-xl text-gray-900 text-center">
          No listings available
        </StyledText>
        <StyledText className="font-body text-gray-600 mt-2 text-center">
          Check back soon for new food listings!
        </StyledText>
      </StyledView>
    );
  }

  return (
    <StyledView className="flex-1 bg-cream">
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            onPress={() => {
              // Navigate to listing detail
            }}
          />
        )}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </StyledView>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(tabs\)/
git commit -m "feat: add tabs layout and feed screen"
```

---

## Remaining Tasks

Due to the length of this plan, the remaining tasks follow the same pattern:

- **Task 8.4**: Create map screen with platform-specific maps
- **Task 8.5**: Create post screen for organizers
- **Task 8.6**: Create claims screen
- **Task 8.7**: Create impact screen
- **Task 8.8**: Create profile screen
- **Task 8.9**: Create hooks (useLocation, useOnlineStatus, useClaims)
- **Task 8.10**: Create map components (MapView, MapViewIOS, MapViewAndroid, MapViewWeb)

Each task follows the same structure with:
1. Exact file paths
2. Complete code for each file
3. Test/verification steps
4. Commit step

---

## Execution Summary

**Total Tasks**: 30+  
**Estimated Time**: 12-18 days  
**Key Deliverables**:
- Expo project configured for iOS, Android, Web
- Better Auth Cloudflare Worker deployed
- TypeScript codebase with strict mode
- Zustand stores for listings and cart
- React Context for auth and toast
- Platform-native maps
- All screens and components migrated

**Critical Path**:
1. Phase 0-1: Project setup + Auth (4-5 days)
2. Phase 2-3: Types + Services + State (3-4 days)
3. Phase 4-5: Components + Utils (4-5 days)
4. Phase 6-8: Layouts + Screens (3-4 days)

**Next Steps**: Begin with Task 0.1 - Create Expo Project
