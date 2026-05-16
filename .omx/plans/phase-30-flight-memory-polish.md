# Phase 30: Flight Memory Import and Passport Polish

## Goal

Fix the latest Travel Memory issues found in mobile testing:

- Flighty CSV imports should not hide future-dated memory rows after the data store split.
- Skipped CSV rows must be visible and copyable instead of making the passport look fully successful.
- Passport scope controls should live inside the Flight Passport card.
- Dense Asia-heavy maps need thinner routes and smaller glowing points.
- Clearing all flight memories should not throw the app into the global error page.

## Root Cause Notes

- `FlightMemory.tsx` still used `getFlightMemoryEntries`, which filters out future-dated rows. After `flight_memories` became independent from Overview trips, this can hide imported Flighty rows and produce misleading `84 / 84` diagnostics.
- CSV parser errors were only summarized as a count in import status, so skipped rows were hard to inspect.
- The scope segmented control was rendered as a separate card above the passport instead of inside the passport container.
- ECharts cleanup had no explicit defensive disposal path when route count drops to zero.

## Implementation Tasks

1. Add an all-record Travel Memory entry selector for the dedicated `flight_memories` store.
2. Improve CSV skipped-row diagnostics and surface them in the Travel Memory page.
3. Move passport scope controls into the Flight Passport card.
4. Reduce route/effect/airport marker sizes for dense maps.
5. Harden Flight Route Map cleanup and wrap it in a local fallback boundary.
6. Add regression tests and run full verification.

## Verification

- `./node_modules/.bin/vitest run src/services/flightMemory.test.ts src/services/flightMemoryImport.test.ts src/pages/FlightMemory.test.tsx src/components/FlightRouteMap.test.tsx`
- `git diff --check`
- `./node_modules/.bin/tsc -b`
- `npm run lint`
- `./node_modules/.bin/vitest run`
- `npm run build`

## Verification Result

2026-05-16T11:57:12+08:00

- Targeted Travel Memory and Flight Passport tests: 27 passed.
- Follow-up FlightRouteMap and page tests after ECharts cleanup fix: 11 passed.
- Playwright local preview smoke: added one memory flight, confirmed scope controls render inside Flight Passport, cleared all flights, no error page, browser console had 0 errors.
- `git diff --check`: passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run lint`: passed.
- Full `./node_modules/.bin/vitest run`: 89 passed.
- `npm run build`: passed with the existing large chunk warning.
