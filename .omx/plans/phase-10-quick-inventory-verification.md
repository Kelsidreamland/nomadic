# Phase 10 — Quick Count And Detailed Record Verification

## Scope

- Add the onboarding item-entry fork: `快速清點` and `詳細記錄`.
- Add `快速清點` to the Items page with manual quantity templates.
- Store quick-count entries as one item record with `quantity`, `inventoryMode: quick`, and `outfitEligible: false`.
- Keep quick-count entries out of outfit planning.
- Count quick quantities in luggage totals, overview totals, and packing progress.

## Verification Evidence

- `./node_modules/.bin/vitest run src/services/quickInventory.test.ts src/services/outfitEligibility.test.ts src/services/packingChecklist.test.ts src/pages/Items.test.tsx src/pages/Overview.test.tsx src/services/flightMemory.test.ts src/components/Layout.test.tsx`: 7 files, 17 tests passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run build`: passed, with existing Vite chunk-size warning.
- Playwright local smoke on `/`: onboarding reaches the `快速清點` / `詳細記錄` fork after creating luggage.
- Playwright local smoke on `/items?mode=quick`: quick-count templates render; adding `襪子 × 7` creates one quick-count item and displays total quantity.
- Playwright mobile smoke at `390x844` on `/items?mode=quick`: quick-count panel renders without the bottom nav changing.

## 2026-05-10 Quick Category Refinement

- Added simple category tags before quick-count templates: `衣物`, `盥洗`, `科技`, `證件`, `其他`.
- Default quick-count view opens on `衣物` so the phone screen no longer shows every travel essential at once.
- `證件` reveals `護照` only after that tag is selected, keeping the first screen shorter.
- Updated quick-count onboarding/page copy so the text describes the grouped flow instead of listing hidden examples.

Verification:

- `./node_modules/.bin/vitest run src/services/quickInventory.test.ts src/pages/Items.test.tsx`: 2 files, 6 tests passed.
- `./node_modules/.bin/vitest run src/services/quickInventory.test.ts src/services/outfitEligibility.test.ts src/services/packingChecklist.test.ts src/pages/Items.test.tsx src/pages/Overview.test.tsx src/services/flightMemory.test.ts src/components/Layout.test.tsx`: 7 files, 20 tests passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run build`: passed, with existing Vite chunk-size warning.
- `npm run lint`: still blocked by existing repo-wide lint debt in `useRetry`, `Items`, `Luggages`, `Outfits`, `ai`, and `google`; this slice did not add a new lint pattern.
- Playwright local mobile smoke at `390x844` on `/items?mode=quick`: default `衣物` tag shows clothing templates; selecting `證件` switches the list to `護照`.
