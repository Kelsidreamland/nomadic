# Phase 9 — Flight Memory Verification Map

## Required Automated Checks

- `./node_modules/.bin/vitest run src/services/flightMemory.test.ts`
- `./node_modules/.bin/tsc -b`
- `npm run build`

## Required Browser Smoke Checks

- `/` Dashboard:
  - Existing upcoming trip still shows the nearest future flight, not historical memory flights.
  - Quiet Memory entry is visible but not dominant.
- `/overview`:
  - Packing summary still reads the same upcoming flight.
- `/memory` desktop:
  - Empty state works.
  - Manual past-flight creation works.
  - Timeline renders saved flights.
  - Map renders at least one visible route when endpoints resolve.
- `/memory` mobile:
  - No horizontal overflow.
  - Bottom navigation remains four items.
  - Map and timeline do not overlap.

## Acceptance Criteria

- Historical flights do not disrupt packing workflows.
- The feature reads as "旅居足跡 / personal memory", not "flight tracking".
- The first version remains useful without CSV import, AI batch import, poster export, or monetization.
- Production `version.json` matches the deployed commit.
