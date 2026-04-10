---
name: backend-worker
description: Worker for backend routes, constants, error classes, rate limiting, and Husky setup
---

# Backend Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use this worker for:
- Creating backend error classes (NotFoundError, ConflictError, etc.)
- Refactoring routes to use typed errors
- Creating backend constants (reservation minutes, query limits)
- Adding error handler middleware
- Implementing rate limiting with @hono/rate-limiter
- Setting up Husky with lint-staged pre-commit hooks
- Adding JSDoc comments to backend files

## Required Skills

None.

## Work Procedure

### Step 1: Understand the Feature Requirements

Read the feature description carefully. Identify:
- What files to create/modify
- What error classes or constants to create
- What existing routes to refactor

### Step 2: Implement Changes

For error classes:
1. Create server/errors.ts if it doesn't exist
2. Create classes extending native Error with name and statusCode properties
3. Use proper HTTP status codes (404, 409, 400, 401)

For error handler middleware:
1. Add global error handler to server/app.ts
2. Catch typed errors and return appropriate status codes
3. Handle unknown errors with 500

For route refactoring:
1. Replace generic `throw new Error('message')` with typed errors
2. Ensure all error conditions are covered
3. Update existing tests to expect new error types

For constants:
1. Create server/constants.ts if it doesn't exist
2. Export constants with clear names (SCREAMING_SNAKE_CASE)
3. Update source files to import and use constants
4. Remove any hardcoded magic numbers

For rate limiting:
1. Install: `bun add @hono/rate-limiter`
2. Import and configure in server/app.ts
3. Apply before route handlers
4. Consider excluding /health endpoint

For Husky setup:
1. Install: `bun add -d husky lint-staged`
2. Initialize: `bunx husky init`
3. Edit .husky/pre-commit to run lint-staged
4. Add lint-staged config to package.json

For JSDoc:
1. Add `/** */` comment blocks before exports
2. Document purpose, parameters, and return values

### Step 3: Write/Update Tests

1. Update existing tests if refactoring routes
2. Write tests for error classes
3. Write tests for error handler middleware
4. All tests must pass

### Step 4: Verify Changes

1. Type check: `bunx tsc --noEmit`
2. Lint: `bunx biome check .`
3. Run tests: `bun test`
4. Verify rate limiting manually if applicable

### Step 5: Document Changes

In the handoff, list:
- Files created/modified
- What error classes/constants were created
- What routes were refactored
- Test coverage if applicable

## Example Handoff

```json
{
	"salientSummary": "Created server/errors.ts with typed error classes and refactored claims and listings routes to use typed errors instead of generic Error instances.",
	"whatWasImplemented": "Created server/errors.ts with NotFoundError (404), ConflictError (409), ValidationError (400), and UnauthorizedError (401) classes. Refactored server/routes/claims.ts to throw NotFoundError for missing claims/listings, ConflictError for duplicate claims and inactive listings, ValidationError for insufficient quantity. Refactored server/routes/listings.ts to throw NotFoundError for missing listings. Created server/errors.test.ts with 8 test cases. Updated existing route tests to expect typed errors.",
	"whatWasLeftUndone": "",
	"verification": {
		"commandsRun": [
			{ "command": "bun test server/routes/", "exitCode": 0, "observation": "All route tests passed with updated assertions" },
			{ "command": "bunx tsc --noEmit", "exitCode": 0, "observation": "No type errors" },
			{ "command": "bunx biome check .", "exitCode": 0, "observation": "No lint errors" }
		],
		"interactiveChecks": []
	},
	"tests": {
		"added": [
			{
				"file": "server/errors.test.ts",
				"cases": [
					{ "name": "NotFoundError has statusCode 404", "verifies": "VAL-ERR-009" },
					{ "name": "ConflictError has statusCode 409", "verifies": "VAL-ERR-010" }
				]
			}
		]
	},
	"discoveredIssues": []
}
```

## When to Return to Orchestrator

- Routes have dependencies that prevent refactoring
- Rate limiting middleware conflicts with existing middleware
- Husky setup fails due to git configuration
- Existing tests fail after refactoring and cannot be fixed
- Requirements are ambiguous
