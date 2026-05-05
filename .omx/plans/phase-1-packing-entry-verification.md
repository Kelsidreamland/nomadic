# Phase 1 Packing Entry Verification

Date: 2026-05-05

## Scope

- Restore a low-priority packing checklist entry from the Items page.
- Generate the checklist view by routing to `Overview` with `?packing=1`.
- Auto-expand luggages that currently contain items.

## Files

- `src/pages/Items.tsx`
- `src/pages/Overview.tsx`
- `src/services/packingChecklist.ts`
- `src/services/packingChecklist.test.ts`
- `src/i18n.ts`

## Verification

- `./node_modules/.bin/tsc -b`
- `./node_modules/.bin/vitest run src/services/packingChecklist.test.ts src/services/imageSticker.test.ts src/services/appVersion.test.ts src/services/ai.test.ts`
- `npm run build`
- Playwright mobile smoke check: Items -> `幫我生成打包清單` -> Overview `?packing=1` with expanded luggage sections.

## Notes

- This keeps checklist generation out of primary navigation and places it as a quiet repacking-session action inside Items.
