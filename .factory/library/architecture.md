# Architecture

How the EcoEats system works: components, relationships, data flows, invariants.

**What belongs here:** High-level system architecture, component relationships, data flows, invariants.
**What does NOT belong here:** Implementation details, code snippets.

---

## System Overview

EcoEats is a campus food rescue app built with Expo (React Native + Web) frontend and Hono backend, using Better Auth for authentication and PostgreSQL for data storage.

## Components

### Frontend (Expo)

- **app/**: Expo Router screens organized by navigation groups
  - `(auth)`: Login, auth callback screens
  - `(tabs)`: Main app tabs (home, listings, profile)
- **src/services/**: API client services (auth, claims, listings, users)
- **src/contexts/**: React contexts (AuthContext, ToastContext)
- **src/stores/**: Zustand stores for client state
- **src/components/**: Reusable UI components
- **src/utils/**: Utilities (validators, helpers)
- **src/constants/**: App constants (polling intervals, limits)

### Backend (Hono)

- **server/routes/**: API route handlers (users, listings, claims)
- **server/auth-core.ts**: Better Auth configuration
- **server/config.ts**: Runtime configuration
- **server/errors.ts**: Typed error classes

### Shared

- **shared/contracts/**: Zod schemas for API request/response validation

### Worker (Cloudflare)

- **worker/**: Cloudflare Worker entrypoint for production deployment

## Data Flow

1. **Authentication:**
   - User requests magic link → Better Auth sends email via Resend
   - User clicks link → Better Auth verifies → Session created
   - Session stored in SecureStore (mobile) / localStorage (web)
   - Bearer token passed in Authorization header for API requests

2. **Listings:**
   - Frontend polls `/api/listings` every 20 seconds
   - Backend auto-expires stale listings before returning
   - CRUD operations restricted to listing owner (host_id)

3. **Claims:**
   - Claim creation uses database transaction (BEGIN/COMMIT/ROLLBACK)
   - Reservation expires after 20 minutes
   - Quantity management: claim decrements, no-show restores

## Invariants

- **Listing ownership:** Only host_id can modify a listing
- **Claim ownership:** Only student_id can rate their claim
- **Host verification:** Only listing host can confirm pickup/mark no-show
- **Quantity consistency:** Claims and listings maintain quantity_remaining integrity
- **Status transitions:** Listings move through active → claimed/expired/cancelled

## Constants

### Frontend (src/constants/app.ts)
- POLL_INTERVAL_CLAIMS_MS = 15000
- POLL_INTERVAL_LISTINGS_MS = 20000
- MAX_QUANTITY = 100
- MIN_QUANTITY = 1

### Backend (server/constants.ts)
- RESERVATION_MINUTES = 20
- DEFAULT_EXPIRY_MINUTES = 90
- MAX_LISTINGS_QUERY = 50
- MAX_CLAIMS_QUERY = 20
- DEFAULT_PORT = 3001

## Error Handling

- Frontend throws typed errors: ValidationError, AuthError, NetworkError
- Backend throws typed errors: NotFoundError, ConflictError, ValidationError, UnauthorizedError
- Error handler middleware converts typed errors to appropriate HTTP responses
