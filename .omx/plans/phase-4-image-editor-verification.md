# Phase 4 Image Editor Verification

Date: 2026-05-05

## Scope

- Add a lightweight, local image tuning flow for item photos.
- Support zoom, horizontal/vertical positioning, and white/soft/transparent sticker backgrounds.
- Keep AI detection upload fast by making image cleanup an optional edit step after capture.

## Files

- `src/pages/Items.tsx`
- `src/services/imageSticker.ts`
- `src/services/imageSticker.test.ts`
- `src/i18n.ts`

## Verification

- `./node_modules/.bin/tsc -b`
- `./node_modules/.bin/vitest run src/services/imageSticker.test.ts src/services/appVersion.test.ts src/services/ai.test.ts`
- `npm run build`
- Playwright mobile viewport smoke check with screenshot: `output/playwright/items-image-editor-mobile.png`

## Notes

- This does not run AI background removal. It is intentionally local canvas processing to avoid slowing down the capture flow or increasing server/API load.
