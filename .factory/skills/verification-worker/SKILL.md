---
name: verification-worker
description: Worker for final verification and cross-area validation
---

# Verification Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use this worker for:
- Running full verification suite (tsc, biome, knip, tests)
- Validating cross-area assertions
- Confirming constants are used consistently
- Confirming error types are consistent across layers
- Final quality gate before mission completion

## Required Skills

None.

## Work Procedure

### Step 1: Run Verification Commands

Execute all verification commands in sequence:

1. **Type Check:**
   ```bash
   bunx tsc --noEmit
   ```
   Must exit with code 0, no type errors.

2. **Lint:**
   ```bash
   bunx biome check .
   ```
   Must exit with code 0, no lint errors or warnings.

3. **Unused Exports:**
   ```bash
   bunx knip
   ```
   Must exit with code 0, no unused exports.

4. **Backend Tests:**
   ```bash
   bun test
   ```
   All tests must pass.

5. **Frontend Tests:**
   ```bash
   bun run test:frontend
   ```
   All tests must pass.

### Step 2: Validate Cross-Area Consistency

1. **Constants Consistency:**
   - Verify frontend constants match magic numbers they replace
   - Verify backend constants match magic numbers they replace
   - Run grep commands from validation contract

2. **Error Type Consistency:**
   - Verify frontend error classes are used in frontend services
   - Verify backend error classes are used in routes
   - Verify error handler middleware catches all typed errors

3. **Type/Schema Consistency:**
   - Verify Zod schemas match TypeScript types
   - Verify status enums are consistent across layers

### Step 3: Manual Checks (if needed)

- Start dev server: `bun run api`
- Verify rate limiting works: `curl -I http://localhost:3001/health`
- Test pre-commit hook: stage a file and attempt commit

### Step 4: Document Results

In the handoff, provide:
- Exit codes for all verification commands
- Any issues discovered
- Evidence of cross-area consistency

## Example Handoff

```json
{
	"salientSummary": "Completed full verification suite. All TypeScript compilation, linting, knip, and tests pass. Constants and error types are consistent across layers.",
	"whatWasImplemented": "Ran full verification: tsc --noEmit (0 errors), biome check . (0 issues), knip (0 unused exports), bun test (all pass), bun run test:frontend (all pass). Validated constants are imported and used correctly in all source files. Validated error classes are thrown and caught correctly across backend and frontend.",
	"whatWasLeftUndone": "",
	"verification": {
		"commandsRun": [
			{ "command": "bunx tsc --noEmit", "exitCode": 0, "observation": "No type errors across entire codebase" },
			{ "command": "bunx biome check .", "exitCode": 0, "observation": "No lint errors or warnings" },
			{ "command": "bunx knip", "exitCode": 0, "observation": "No unused exports" },
			{ "command": "bun test", "exitCode": 0, "observation": "All backend tests passed" },
			{ "command": "bun run test:frontend", "exitCode": 0, "observation": "All frontend tests passed" }
		],
		"interactiveChecks": []
	},
	"tests": {
		"added": []
	},
	"discoveredIssues": []
}
```

## When to Return to Orchestrator

- Any verification command fails
- Cross-area inconsistencies are found
- Tests fail that cannot be attributed to a specific feature
