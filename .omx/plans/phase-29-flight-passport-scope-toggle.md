# Phase 29: Flight Passport Scope Toggle

## Goal

Add `ALL` and current-year views for Flight Passport so heavy travel histories can render a lighter yearly map while keeping the lifetime overview.

## Design

- Add a two-option segmented control on Travel Memory: `ALL` and current year.
- The selected scope controls the passport map, drawable route diagnostics, and unresolved diagnostics.
- Imported flight list remains all records for management and deletion.
- Other year views are intentionally not implemented in this slice.

## Verification

- `./node_modules/.bin/vitest run src/pages/FlightMemory.test.tsx`
- `git diff --check`
- `./node_modules/.bin/tsc -b`
- `npm run lint`
- `./node_modules/.bin/vitest run`
- `npm run build`

## Verification Result

2026-05-14T17:56:01+08:00

- Targeted Flight Memory page tests: 8 passed.
- `git diff --check`: passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run lint`: passed.
- Full `./node_modules/.bin/vitest run`: 86 passed.
- `npm run build`: passed with the existing large chunk warning.
