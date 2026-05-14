# Phase 27: Flighty Airport Coverage

## Goal

Use the copied Flighty diagnostics to expand airport recognition and fix day-first Flighty date parsing.

## Root Cause

- Flighty exports can use city or municipality names instead of IATA codes.
- The app only recognized a small alias set, so many valid routes were imported but not drawable.
- Date strings such as `30/11/25` were parsed as month/day/year, producing invalid dates like `2025-30-11`.

## Scope

- Add airport aliases and coordinates for the copied unmapped list.
- Add exact aliases for ambiguous Flighty labels such as `MAI` and `NEW`.
- Keep `NEW` mapped to Delhi/New Delhi for this user dataset, not to broad substring matching.
- Parse day-first numeric dates only when the first number cannot be a month.

## Verification

- `./node_modules/.bin/vitest run src/services/flightMemoryGeo.test.ts src/services/flightMemoryImport.test.ts src/services/flightPassportData.test.ts`
- `git diff --check`
- `./node_modules/.bin/tsc -b`
- `npm run lint`
- `./node_modules/.bin/vitest run`
- `npm run build`

## Verification Result

2026-05-14T14:31:34+08:00

- Targeted Flighty coverage tests: 17 passed.
- `git diff --check`: passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run lint`: passed.
- Full `./node_modules/.bin/vitest run`: 83 passed.
- `npm run build`: passed with the existing large chunk warning.
