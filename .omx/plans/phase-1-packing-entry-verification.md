# Phase 1 Packing Entry Verification

Date: 2026-05-05

## Scope

- Move packing checklist generation to a small secondary action at the bottom of Overview.
- Generate the checklist view by routing to `Overview` with `?packing=1`.
- Auto-expand luggages that currently contain items.
- Show round check controls on item cards only in packing mode.
- Fix luggage name editing and default new luggage season from the active seasonal filter.
- Adjust bottom nav icons so Items uses a general inventory icon and Outfits uses a shirt icon.

## Files

- `src/pages/Items.tsx`
- `src/pages/Overview.tsx`
- `src/pages/Luggages.tsx`
- `src/components/Layout.tsx`
- `src/services/packingChecklist.ts`
- `src/services/packingChecklist.test.ts`
- `src/services/luggageForm.ts`
- `src/services/luggageForm.test.ts`
- `src/i18n.ts`

## Verification

- `./node_modules/.bin/tsc -b`
- `./node_modules/.bin/vitest run src/services/packingChecklist.test.ts src/services/luggageForm.test.ts src/services/imageSticker.test.ts src/services/appVersion.test.ts src/services/ai.test.ts`
- `npm run build`
- Playwright mobile smoke check: Overview bottom `幫我生成打包清單` -> Overview `?packing=1` with item check controls.
- Playwright mobile smoke check: Luggages winter filter -> New Luggage defaults to winter season.

## Notes

- This keeps checklist generation out of primary navigation and places it as a quiet repacking-session action at the bottom of Overview.
