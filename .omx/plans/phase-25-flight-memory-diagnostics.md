# Phase 25: Flight Memory Diagnostics

## Intent

Fix Travel Memory import reliability and make bad CSV/geography data diagnosable:

- Clear historical flight memory without crashing the page.
- Prevent broad city aliases from turning Kuala Lumpur into Los Angeles.
- Show whether imported CSV rows are parsed, drawable on the passport map, or blocked by unknown airports.
- Keep future trip records separate from historical passport records.

## Root Cause Notes

- `flightMemoryGeo.ts` contains a broad `la ` alias for Los Angeles.
- `Kuala Lumpur` contains `la `, so alias lookup can map it to `LAX` before the correct `KUL` alias.
- The airport database is intentionally small; unknown IATA codes can reduce country counts and route rendering.
- The current UI reports imported row count, but not unresolved airports or drawable route count.
- Clear-all had no defensive failure handling around the IndexedDB delete path.

## Implementation Slices

1. Add regression tests for Kuala Lumpur and Los Angeles alias behavior.
2. Add regression tests for passport diagnostics on unknown airports.
3. Add a Flight Memory clear-all rerender test for empty historical data.
4. Remove the unsafe `la ` alias and add diagnostics for unknown route airports.
5. Surface concise diagnostics in the Travel Memory page.
6. Wrap clear-all in defensive UI state reset and failure status.

## Verification

- `./node_modules/.bin/vitest run src/services/flightMemoryGeo.test.ts src/services/flightPassportData.test.ts src/pages/FlightMemory.test.tsx`
- `git diff --check`
- `./node_modules/.bin/tsc -b`
- `npm run lint`
- `./node_modules/.bin/vitest run`
- `npm run build`
- Commit, push, deploy to Vercel production, verify `/version.json`.

## Verification Result

2026-05-14T13:07:13+08:00

- Targeted flight memory diagnostics tests: 15 passed.
- `git diff --check`: passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run lint`: passed.
- Full `./node_modules/.bin/vitest run`: 81 passed.
- `npm run build`: passed with the existing large chunk warning.
