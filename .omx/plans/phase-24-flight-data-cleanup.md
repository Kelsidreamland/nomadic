# Phase 24: Flight Data Cleanup Controls

## Intent

Add user-facing cleanup controls for stale flight records stored in the browser database:

- Overview should let the user delete an incorrect/cancelled upcoming trip.
- Travel Memory should let the user clear historical imported flight records when old demo/test/import data pollutes the passport map.

## Root Cause Notes

- Production code does not seed demo flight data; demo airport codes appear in tests/placeholders only.
- Both Overview and Flight Passport render from the same local IndexedDB `flights` table.
- If old/fake records were previously added to the browser database, a deployment cannot remove them unless the UI provides explicit delete/clear actions.

## Implementation Slices

1. Add regression tests for deleting an upcoming trip from Overview.
2. Add regression tests for clearing historical Flight Memory entries without deleting future trips.
3. Add Overview delete action for the current upcoming trip group.
4. Add Flight Memory clear-all action for historical memory entries.

## Verification

- `./node_modules/.bin/vitest run src/pages/Overview.test.tsx src/pages/FlightMemory.test.tsx`
- `git diff --check`
- `./node_modules/.bin/tsc -b`
- `npm run lint`
- `./node_modules/.bin/vitest run`
- `npm run build`
- Commit, push, deploy to Vercel production, verify `/version.json`.

## Verification Result

2026-05-13T17:22:00+08:00

- Targeted cleanup tests: 14 passed.
- `git diff --check`: passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run lint`: passed.
- Full `./node_modules/.bin/vitest run`: 77 passed.
- `npm run build`: passed with the existing large chunk warning.
