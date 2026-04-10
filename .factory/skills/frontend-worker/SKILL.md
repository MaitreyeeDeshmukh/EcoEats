---
name: frontend-worker
description: Worker for frontend components, constants, and error classes
---

# Frontend Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use this worker for:
- Creating ErrorBoundary component
- Wrapping navigation groups with error boundaries
- Creating frontend error classes (ValidationError, AuthError, NetworkError)
- Creating frontend constants (polling intervals, max quantities)
- Updating frontend services to use typed errors
- Adding JSDoc comments to frontend files

## Required Skills

None.

## Work Procedure

### Step 1: Understand the Feature Requirements

Read the feature description carefully. Identify:
- What component or file to create/modify
- What constants or error classes to create
- What existing code to update

### Step 2: Implement Changes

For components:
1. Create the component file in src/components/ui/
2. Follow existing component patterns in the codebase
3. Use NativeWind for styling (className prop)
4. Export from src/components/ui/index.ts if there's a barrel file

For constants:
1. Create src/constants/app.ts if it doesn't exist
2. Export constants with clear names (SCREAMING_SNAKE_CASE)
3. Update source files to import and use constants
4. Remove any hardcoded magic numbers

For error classes:
1. Create src/utils/errors.ts if it doesn't exist
2. Create classes extending native Error with name property
3. Update services to throw typed errors instead of generic Error

For JSDoc:
1. Add `/** */` comment blocks before exports
2. Document purpose, parameters, and return values
3. Keep comments concise but informative

### Step 3: Write Tests (if applicable)

For components:
1. Create test file with Jest/RTL
2. Test rendering, user interactions, error states

For error classes:
1. Create test file with Jest
2. Test instantiation, name property, message property

### Step 4: Verify Changes

1. Type check: `bunx tsc --noEmit`
2. Lint: `bunx biome check .`
3. Run frontend tests: `bun run test:frontend`
4. Manual verification if component: `bun start`

### Step 5: Document Changes

In the handoff, list:
- Files created/modified
- What constants/error classes were created
- What source files were updated
- Test coverage if applicable

## Example Handoff

```json
{
	"salientSummary": "Created ErrorBoundary component with fallback UI and reset functionality, wrapped navigation groups in app/_layout.tsx with error boundaries.",
	"whatWasImplemented": "Created src/components/ui/ErrorBoundary.tsx with class component catching errors, rendering fallback UI with 'Try Again' button, and logging errors to console. Updated app/_layout.tsx to wrap (auth) and (tabs) Stack.Screen components with ErrorBoundary wrappers. Created src/components/ui/ErrorBoundary.test.ts with 3 test cases.",
	"whatWasLeftUndone": "",
	"verification": {
		"commandsRun": [
			{ "command": "bunx tsc --noEmit", "exitCode": 0, "observation": "No type errors" },
			{ "command": "bunx biome check .", "exitCode": 0, "observation": "No lint errors" },
			{ "command": "bun run test:frontend --grep ErrorBoundary", "exitCode": 0, "observation": "3 tests passed" }
		],
		"interactiveChecks": [
			{ "action": "Started Expo dev server and navigated between tabs", "observed": "Navigation works without triggering error boundaries" }
		]
	},
	"tests": {
		"added": [
			{
				"file": "src/components/ui/ErrorBoundary.test.tsx",
				"cases": [
					{ "name": "renders fallback UI on error", "verifies": "VAL-ERR-001" },
					{ "name": "resets state on Try Again click", "verifies": "VAL-ERR-002" },
					{ "name": "logs errors to console", "verifies": "VAL-ERR-003" }
				]
			}
		]
	},
	"discoveredIssues": []
}
```

## When to Return to Orchestrator

- Component cannot be implemented due to missing dependencies
- Existing code patterns conflict with requirements
- Manual testing reveals unexpected behavior
- Requirements are ambiguous
