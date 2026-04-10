# User Testing

Testing surface, required testing skills/tools, resource cost classification per surface.

**What belongs here:** Validation surface discovery, testing tools, resource costs, isolation strategies.

---

## Validation Surface

This mission focuses on code quality improvements rather than user-facing features. Validation is primarily automated through:

### Backend Testing (Vitest)
- **Surface:** server/**/*.test.ts
- **Tool:** vitest
- **Coverage:** Route handlers, business logic, error handling

### Frontend Testing (Jest)
- **Surface:** src/**/*.test.{ts,tsx}
- **Tool:** jest, @testing-library/react-native
- **Coverage:** Services, components, validators

### Static Analysis
- **TypeScript:** tsc --noEmit
- **Linting:** biome check .
- **Unused exports:** knip

### Manual Testing
- **Error Boundaries:** agent-browser to verify fallback UI and reset functionality
- **Rate Limiting:** curl to verify headers and 429 responses
- **Pre-commit Hooks:** bash to verify blocking on errors

## Validation Concurrency

### Backend Tests (Vitest)
- **Resource per validator:** ~100MB RAM, 1 CPU core
- **Machine headroom:** ~8GB available
- **Max concurrent:** 5 validators (500MB total)

### Frontend Tests (Jest)
- **Resource per validator:** ~200MB RAM, 1 CPU core
- **Machine headroom:** ~8GB available
- **Max concurrent:** 3 validators (600MB total)

### Static Analysis
- **TypeScript:** Single process, ~300MB RAM
- **Biome:** Single process, ~100MB RAM
- **Knip:** Single process, ~50MB RAM

## Isolation Strategy

- Tests use mocked database connections (no real PostgreSQL required)
- Frontend tests mock SecureStore, localStorage, fetch, Platform.OS
- Each test file is independent, can run in parallel

## Test Scripts

```bash
# Backend tests
bun test

# Frontend tests
bun run test:frontend

# Specific test file
bun test server/routes/claims.test.ts
bun run test:frontend src/services/auth-client.test.ts

# Coverage
bun test --coverage
```
