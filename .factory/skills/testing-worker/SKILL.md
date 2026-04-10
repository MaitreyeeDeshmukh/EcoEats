---
name: testing-worker
description: Worker for setting up testing frameworks and writing tests
---

# Testing Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use this worker for:
- Setting up Vitest for backend testing
- Setting up Jest/React Testing Library for frontend testing
- Writing tests for backend routes (claims, listings)
- Writing tests for frontend services (auth-client, validators)
- Writing integration tests

## Required Skills

None.

## Work Procedure

### Step 1: Understand the Feature Requirements

Read the feature description carefully. Identify:
- What test framework to set up or use
- What files need tests
- What behaviors to test

### Step 2: Set Up Test Framework (if applicable)

For Vitest setup:
1. Install dependencies: `bun add -d vitest @vitest/coverage-v8`
2. Create `vitest.config.ts` with TypeScript and coverage configuration
3. Add `test` script to package.json: `"test": "vitest run"`
4. Verify with `bun test --passWithNoTests`

For Jest setup:
1. Install dependencies: `bun add -d jest @testing-library/react-native @testing-library/jest-dom @testing-library/jest-native jest-expo`
2. Create `jest.config.js` with React Native/Expo configuration
3. Create `jest.setup.ts` with @testing-library/jest-dom setup
4. Add `test:frontend` script to package.json: `"test:frontend": "jest --passWithNoTests"`
5. Configure mocks for NativeWind, Expo modules, SecureStore
6. Verify with `bun run test:frontend --passWithNoTests`

### Step 3: Write Tests First (TDD)

1. Read the source file being tested to understand implementation
2. Create the test file (e.g., `server/routes/claims.test.ts`)
3. Write failing tests for each behavior described in the feature
4. Run tests to confirm they fail for the right reasons

### Step 4: Verify Tests Pass

1. Run tests: `bun test` or `bun run test:frontend`
2. All tests must pass
3. Verify type checking: `bunx tsc --noEmit`
4. Verify linting: `bunx biome check .`

### Step 5: Document Test Coverage

In the handoff, list:
- All test files created
- Number of test cases per file
- What behaviors are covered
- Any edge cases tested

## Example Handoff

```json
{
	"salientSummary": "Set up Vitest for backend testing and wrote comprehensive tests for server/routes/claims.ts covering all CRUD operations and transaction logic.",
	"whatWasImplemented": "Created vitest.config.ts with TypeScript support and coverage reporting. Added 'test' script to package.json. Created server/routes/claims.test.ts with 29 test cases covering GET /mine, GET /listing/:listingId, POST /, POST /:id/confirm-pickup, POST /:id/no-show, and POST /:id/rating endpoints. Tests cover happy paths, error conditions, auth requirements, and transaction rollback behavior.",
	"whatWasLeftUndone": "",
	"verification": {
		"commandsRun": [
			{ "command": "bun test server/routes/claims.test.ts", "exitCode": 0, "observation": "All 29 tests passed" },
			{ "command": "bunx tsc --noEmit", "exitCode": 0, "observation": "No type errors" },
			{ "command": "bunx biome check .", "exitCode": 0, "observation": "No lint errors" }
		],
		"interactiveChecks": []
	},
	"tests": {
		"added": [
			{
				"file": "server/routes/claims.test.ts",
				"cases": [
					{ "name": "GET /claims/mine returns user claims", "verifies": "VAL-TEST-004" },
					{ "name": "POST /claims creates claim successfully", "verifies": "VAL-TEST-010" },
					{ "name": "POST /claims prevents duplicate claims", "verifies": "VAL-TEST-011" }
				]
			}
		]
	},
	"discoveredIssues": []
}
```

## When to Return to Orchestrator

- Test framework cannot be configured properly
- Dependencies fail to install
- Source code under test has bugs that prevent testing
- Requirements are ambiguous about what to test
