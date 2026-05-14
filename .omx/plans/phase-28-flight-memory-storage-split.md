# Phase 28: Flight Memory Storage Split

## Goal

Separate Travel Memory passport data from upcoming trip data so CSV imports cannot appear in Overview as future flights.

## Root Cause

`flights` currently powers both Overview upcoming trips and Travel Memory. CSV imports write to `flights`, and Travel Memory clear only deletes past-dated rows. If a CSV row is parsed as future-dated or genuinely contains a future date, Overview can show it as the next trip. Deleting one row reveals the next imported row.

## Design

- Keep `flights` for Overview, Dashboard, luggage allowances, and future trip planning.
- Add `flight_memories` for Travel Memory, Flighty CSV/PDF imports, manual memory entries, and passport map generation.
- Move existing `rawEmailId === "csv-import"` and `rawEmailId === "pdf-import"` rows out of `flights` during Dexie upgrade.
- Defensively exclude memory import rows from `getUpcomingFlight` even if old data remains in `flights`.

## Implementation Tasks

1. Add tests proving `getUpcomingFlight` ignores `csv-import` and `pdf-import`.
2. Add UI tests proving Travel Memory reads/writes/deletes `db.flight_memories`, not `db.flights`.
3. Add Dexie `flight_memories` table and migration.
4. Update `FlightMemory.tsx` to use `db.flight_memories`.
5. Verify all tests and build.

## Verification

- `./node_modules/.bin/vitest run src/services/flightMemory.test.ts src/pages/FlightMemory.test.tsx`
- `git diff --check`
- `./node_modules/.bin/tsc -b`
- `npm run lint`
- `./node_modules/.bin/vitest run`
- `npm run build`

## Verification Result

2026-05-14T17:05:38+08:00

- Targeted storage split tests: 15 passed.
- `git diff --check`: passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run lint`: passed.
- Full `./node_modules/.bin/vitest run`: 85 passed.
- `npm run build`: passed with the existing large chunk warning.
