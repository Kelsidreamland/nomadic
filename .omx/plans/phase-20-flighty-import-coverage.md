# Phase 20: Flighty Import Coverage

Date: 2026-05-12

## Goal

Fix the remaining Flighty CSV import failure where only a small subset of flights appeared in Travel Memory and the map could stay empty.

## Scope

- Normalized common Flighty date formats to `YYYY-MM-DD`, including:
  - `Fri, Jan 5, 2024`
  - `5 Feb 2024`
  - `03/12/24`
- Kept `Start` and `Destination` support for tab-delimited Flighty exports.
- Added a collapsible imported-flight list at the bottom of Travel Memory so imported routes can be inspected without relying on the map.
- Expanded the route-map airport database with common international airport codes including `LAX`, `DXB`, `SYD`, `AMS`, `FCO`, and `MNL`.

## Verification

- `./node_modules/.bin/vitest run src/services/flightMemoryImport.test.ts --pool=threads` exit 0
- `./node_modules/.bin/vitest run src/pages/FlightMemory.test.tsx` exit 0
- `./node_modules/.bin/vitest run src/services/flightMemoryGeo.test.ts --pool=threads` exit 0
- `git diff --check` exit 0
- `./node_modules/.bin/tsc -b` exit 0
- `npm run lint` exit 0
- `./node_modules/.bin/vitest run` exit 0, 21 files / 62 tests
- `npm run build` exit 0, with existing lazy map chunk warning
