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
  - Route preview renders at least one visible route when endpoints are entered.
- `/memory` mobile:
  - No horizontal overflow.
  - Bottom navigation remains four items.
  - Route preview and timeline do not overlap.

## Acceptance Criteria

- Historical flights do not disrupt packing workflows.
- The feature reads as "旅居足跡 / personal memory", not "flight tracking".
- The first version remains useful without CSV import, AI batch import, poster export, or monetization.
- Production `version.json` matches the deployed commit.

## 2026-05-06 Slice 1 Evidence

- `./node_modules/.bin/vitest run src/services/flightMemory.test.ts src/components/Layout.test.tsx`: 2 files, 6 tests passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run build`: passed, with existing Vite chunk-size warning.
- Playwright local smoke on `http://127.0.0.1:5175/memory`: empty state rendered; manual TPE to NRT memory flight saved; route preview and timeline rendered.
- Playwright local smoke on `/`: Dashboard showed the quiet `旅居足跡` entry and did not treat the saved historical flight as upcoming.
- Playwright local smoke on `/overview`: historical flight did not appear as upcoming; quiet `旅居足跡` entry rendered.
- Playwright mobile smoke at `390x844` on `/memory`: bottom navigation remained four items.
- Production `https://nomadic-rust.vercel.app/version.json?ts=202605060046`: returned `a745cc1`.
- Production Playwright smoke on `https://nomadic-rust.vercel.app/memory?ts=202605060046`: `/memory` rendered with header version `va745cc1`.
