---
name: cleanup-worker
description: Worker for code cleanup tasks - removing dead code, consolidating types, extracting helpers
---

# Cleanup Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use this worker for:
- Removing redundant comments and obsolete code
- Consolidating duplicate types
- Extracting duplicated test helpers
- Removing unused exports
- Improving type assertions

## Required Skills

None.

## Work Procedure

### Step 1: Understand the Cleanup Task

Read the feature description carefully. Identify:
- Which files to modify
- What changes to make (removals, consolidations, extractions)
- Validation requirements

### Step 2: Baseline Validation

Run validation commands to establish baseline:
```bash
bunx tsc --noEmit
bunx biome check .
bunx knip
bun run test
```

Record results. If already failing, note what failures are pre-existing.

### Step 3: Implement Changes

For comment removal:
1. Read the target file
2. Remove the specific comment line
3. Write the file

For type consolidation:
1. Identify the source type (zod schema)
2. Update target file to use `z.infer<typeof schema>`
3. Remove duplicate type definition
4. Update any imports

For test helper extraction:
1. Create or open server/test/helpers.ts
2. Move helper function to helpers.ts
3. Export the function
4. Update original file to import from helpers.ts
5. Repeat for all duplicate helpers

For unused export removal:
1. Verify the export is truly unused (check imports)
2. Remove the export/function
3. Run knip to verify

### Step 4: Validate After Each File Change

After modifying each file or small group of files:
1. Run type check: `bunx tsc --noEmit`
2. Run lint: `bunx biome check .`
3. If tests affected: `bun run test`

If validation fails:
- Fix the issue if straightforward
- Or revert the change and report
- Never stack more changes on a broken tree

### Step 5: Final Validation

After all changes:
1. Run full validation suite:
   ```bash
   bunx tsc --noEmit
   bunx biome check .
   bunx knip
   bun run test
   ```
2. Verify no new failures introduced

### Step 6: Commit Changes

Commit with conventional format:
```
chore: code cleanup <description>

- Item 1
- Item 2
```

## Handoff Format

```json
{
  "salientSummary": "Removed redundant path comments from 29 files and consolidated duplicate types.",
  "whatWasImplemented": "List specific changes made.",
  "whatWasLeftUndone": "Any items skipped and why.",
  "verification": {
    "commandsRun": [
      { "command": "bunx tsc --noEmit", "exitCode": 0, "observation": "No errors" },
      { "command": "bunx biome check .", "exitCode": 0, "observation": "No new warnings" }
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Validation fails and cannot be fixed within the pass
- Changes conflict with existing patterns
- Requirements are ambiguous
- Cleanup reveals deeper architectural issues
