# Phase 16 — Mobile Packing Polish

## Scope

- Make Flight Memory CSV import tolerate common flight-history CSV variants.
- Improve Overview item transfer on mobile so scrolling and drop targeting feel less brittle.
- Simplify Outfit stats by removing the top summary cards.
- Treat sleepwear/swimwear as non-outfit defaults, including sleep dresses, while allowing explicit override.
- Collapse Quick Inventory categories until the user opens a category.
- Add passenger count to trips and show combined baggage allowance for shared travel.

## Root Cause Notes

- CSV import failed because the parser expected a narrow comma-delimited schema and did not treat `Origin` / `Destination` as route airport columns.
- Removing route text from the passport map did not affect CSV parsing; that display layer is separate from the import service.
- Overview mobile drag used a long-press timer on every item and `touch-none`, which could make scrolling with many items feel sticky.

## Verification Evidence

- `./node_modules/.bin/vitest run src/services/flightMemoryImport.test.ts`: 1 file, 4 tests passed.
- `./node_modules/.bin/vitest run src/services/outfitEligibility.test.ts`: 1 file, 4 tests passed.
- `./node_modules/.bin/vitest run src/pages/Outfits.test.tsx`: 1 file, 1 test passed.
- `./node_modules/.bin/vitest run src/pages/Items.test.tsx`: 1 file, 3 tests passed.
- `./node_modules/.bin/vitest run src/services/flightAllowance.test.ts`: 1 file, 2 tests passed.
- `./node_modules/.bin/vitest run src/services/flightAllowance.test.ts src/pages/Overview.test.tsx src/services/flightMemoryImport.test.ts src/pages/Items.test.tsx src/services/outfitEligibility.test.ts src/pages/Outfits.test.tsx`: 6 files, 18 tests passed.
- `./node_modules/.bin/vitest run src/services/flightMemoryImport.test.ts src/pages/FlightMemory.test.tsx src/services/flightMemory.test.ts src/services/flightMemoryGeo.test.ts src/services/flightPassportData.test.ts src/components/FlightRouteMap.test.tsx src/pages/Overview.test.tsx src/pages/Items.test.tsx src/services/outfitEligibility.test.ts src/pages/Outfits.test.tsx src/services/flightAllowance.test.ts src/services/quickInventory.test.ts src/services/quickInventoryAdvice.test.ts src/services/packingChecklist.test.ts src/components/Layout.test.tsx src/components/PWAPrompt.test.tsx src/services/appVersion.test.ts`: 17 files, 49 tests passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run build`: passed, with existing Vite chunk-size warning.
- `npm run lint`: still blocked by existing repo-wide lint debt in `useRetry`, `Items`, `Luggages`, `Outfits`, `ai`, and `google`.
