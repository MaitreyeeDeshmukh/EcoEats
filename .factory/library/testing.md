# Testing

Testing conventions, patterns, and environment setup.

**What belongs here:** Test configuration, patterns, and utilities that workers need to know about.

---

## Test Environment Variables

### Database-Dependent Tests

Tests that require a PostgreSQL database use these environment variables:

- **DB_URL**: PostgreSQL connection string for the test database
- **DB_SKIP**: Set to "true" to skip database-dependent tests

When `DB_URL` is not set or `DB_SKIP=true`, database-dependent tests are automatically skipped using the `itIf` pattern.

Example:
```bash
# Run tests with database
DB_URL=postgresql://localhost:5432/ecoeats_test bun test

# Run tests without database (skips DB-dependent tests)
bun test
```

---

## Conditional Test Pattern

Use the `itIf` helper for tests that require external resources (database, API):

```typescript
import { isDbAvailable } from "../test";

function itIf(condition: boolean, name: string, fn: () => Promise<void>) {
  if (condition) {
    it(name, fn);
  } else {
    it.skip(name, fn);
  }
}

describe("My tests", () => {
  itIf(isDbAvailable, "should query database", async () => {
    // Database test
  });
});
```

The `isDbAvailable` constant is `true` when both `DB_URL` is set and `DB_SKIP` is not "true".

---

## Jest Frontend Testing

### SecureStore Mock Pattern

Frontend tests that interact with `expo-secure-store` should use the global mock:

```typescript
// In test file
beforeEach(() => {
  global.secureStoreMock = {
    ecoeats_session: JSON.stringify({ id: "test-session", ... }),
    ecoeats_auth_token: "test-token"
  };
});
```

The mock is defined in `jest.setup.ts` and uses an in-memory object for storage during tests.

### Platform Mocking

Mock `Platform.OS` for platform-specific tests:

```typescript
import { Platform } from "react-native";

beforeEach(() => {
  (Platform as any).OS = "ios"; // or "android" or "web"
});
```

---

## Database Row Schemas

PostgreSQL returns timestamp columns as `Date` objects, but the Zod schemas expect strings. Use the union + transform pattern:

```typescript
export const listingRowSchema = z.object({
  expires_at: z.union([z.string(), z.date()]).transform(v => v.toString()),
  posted_at: z.union([z.string(), z.date()]).transform(v => v.toString()),
  // ...
});
```

This pattern is already applied in `shared/contracts/database.ts`.

---

## PostgreSQL Interval Construction

When constructing SQL intervals with numeric parameters, use `make_interval()`:

```sql
-- WRONG: String concatenation fails with numeric parameters
NOW() + ($15 || ' minutes')::interval

-- CORRECT: Type-safe interval construction
NOW() + make_interval(mins => $15)
```

---

## SSR Testing Pattern (Server-Side Rendering)

To test code that guards against `typeof window === "undefined"`, use this pattern in Jest:

```typescript
describe("SSR window undefined", () => {
  let originalWindow: Window | undefined;

  beforeEach(() => {
    originalWindow = global.window;
    // @ts-expect-error - delete window to simulate SSR
    delete global.window;
    // Mock localStorage to verify it's NOT accessed
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it("returns null from getItem when window is undefined", () => {
    // Test SSR behavior
  });
});
```

This pattern allows testing code that checks `typeof window === "undefined"` in a jsdom environment.

---

## Test Scripts

| Script | Description |
|--------|-------------|
| `bun test` | Run Vitest backend tests |
| `bun run test:watch` | Run Vitest in watch mode |
| `bun run test:coverage` | Run Vitest with coverage report |
| `bun run test:frontend` | Run Jest frontend tests |
