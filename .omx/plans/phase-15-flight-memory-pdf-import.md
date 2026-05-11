# Phase 15 — Flight Memory PDF Import

## Scope

- Turn the visible Flight Memory PDF/image upload entry into a usable MVP import flow.
- Reuse the existing ticket AI parser instead of adding live flight tracking or a new aviation feature surface.
- Keep CSV as the bulk-history path and manual entry as the fallback for missing records.

## Implementation Notes

- `/memory` now accepts one or more PDF/image files from the upload control.
- Each supported file is read as a data URL, parsed with `analyzeTicketWithAI`, normalized into a `Flight`, and saved through `db.flights.bulkPut`.
- Unsupported, failed, or incomplete files are counted as skipped and shown in the import status.
- Parsed airport strings are reduced to IATA codes when possible so the passport map can place labels cleanly.

## Verification Evidence

- Red test first: `./node_modules/.bin/vitest run src/pages/FlightMemory.test.tsx` failed because the PDF upload only showed the old coming-soon status and never called the AI parser.
- `./node_modules/.bin/vitest run src/pages/FlightMemory.test.tsx`: 1 file, 2 tests passed.
- `./node_modules/.bin/vitest run src/pages/FlightMemory.test.tsx src/services/flightMemoryImport.test.ts src/services/flightMemory.test.ts src/services/flightMemoryGeo.test.ts src/services/flightPassportData.test.ts src/components/FlightRouteMap.test.tsx src/services/ai.test.ts`: 7 files, 18 tests passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run build`: passed, with existing Vite chunk-size warning.
- `npm run lint`: still blocked by existing repo-wide lint debt in `useRetry`, `Items`, `Luggages`, `Outfits`, `ai`, and `google`; this slice did not add lint errors in `FlightMemory`, `flightMemoryImport`, or `i18n`.
