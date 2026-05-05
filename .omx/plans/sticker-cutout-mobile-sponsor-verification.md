# Sticker Cutout And Mobile Sponsor Verification

Date: 2026-05-05

## Scope

- Replace sticker background controls with local manual cutout editing.
- Add mobile Sponsor / VIP header CTA while keeping desktop CTA unchanged.

## Verification

- `./node_modules/.bin/vitest run src/services/imageSticker.test.ts`
  - Passed after red-green cycle.
- `./node_modules/.bin/vitest run src/components/Layout.test.tsx`
  - Passed after red-green cycle.
- `./node_modules/.bin/vitest run src/services/imageSticker.test.ts src/components/Layout.test.tsx src/services/packingChecklist.test.ts src/services/luggageForm.test.ts src/services/appVersion.test.ts`
  - Passed: 5 files, 9 tests.
- `./node_modules/.bin/tsc -b`
  - Passed.
- `npm run build`
  - Passed with existing large chunk warning.
- Playwright local preview smoke at `http://127.0.0.1:4175/items`
  - Mobile width 390px: one visible Sponsor / VIP header link.
  - Image upload fallback opened the item confirmation card.
  - New image editor rendered title, cutout hint, default cutout, clear cutout, and apply sticker controls.
  - Default cutout plus apply closed the editor and produced a PNG preview.

## Notes

Local `vite preview` does not serve `/api/analyze`, so the upload smoke logged the existing AI fallback 404. The item UI recovered into manual editing as expected.
