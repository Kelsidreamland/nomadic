# Phase 12 — Flight Memory MVP

## Goal

Simplify `旅居足跡` into a quiet MVP dashboard: fewer stats, no year timeline wall, visible import entry points, and a simple route-map preview.

## Scope

- Replace airport/destination/year stats with:
  - current-year flight segments
  - countries visited with emoji flags
  - most visited country
- Remove the year-grouped timeline from the page.
- Add CSV import as the first real bulk import path.
- Add PDF upload as a visible MVP entry with a clear "coming next" style message.
- Upgrade route preview into a simple non-live route map using known airport coordinates.

## Non-Goals

- No live flight status.
- No gate/terminal tracking.
- No full PDF batch parser in this slice.
- No country picker, no editable country metadata.

## Verification Plan

- Add unit tests for country stats and CSV parsing.
- Add page render test for the simplified MVP surface.
- Run targeted tests, TypeScript, build, and Playwright smoke.
- Commit, push, deploy production, and verify production version.

## Local Verification Evidence

- `./node_modules/.bin/vitest run src/services/flightMemoryGeo.test.ts src/services/flightMemoryImport.test.ts src/services/flightMemory.test.ts src/pages/FlightMemory.test.tsx src/services/quickInventoryAdvice.test.ts src/pages/Overview.test.tsx src/services/packingChecklist.test.ts src/pages/Items.test.tsx src/components/Layout.test.tsx`: 9 files, 26 tests passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run build`: passed, with existing Vite chunk-size warning.
- `npm run lint`: still fails on existing repo-wide errors in `src/hooks/useRetry.ts`, `src/pages/Items.tsx`, `src/pages/Luggages.tsx`, `src/pages/Outfits.tsx`, `src/services/ai.test.ts`, `src/services/ai.ts`, and `src/services/google.ts`. This slice removed its own `FlightMemory.tsx` warning.
- Playwright local preview on `127.0.0.1:4176/memory`: seeded demo flight memory data and confirmed the simplified stats, CSV/PDF import entry, route map, and manual fallback order on desktop and mobile.
