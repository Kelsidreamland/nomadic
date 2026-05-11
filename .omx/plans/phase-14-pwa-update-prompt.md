# Phase 14 — PWA Update Prompt Guard

## Scope

- Prevent the PWA update card from appearing when the service worker reports `needRefresh` but `/version.json` confirms the deployed version is the same as the current app.
- Keep install prompts and real remote-version updates unchanged.

## Implementation Notes

- `PWAPrompt` now tracks whether the remote version check has completed.
- A service-worker refresh flag is suppressed only when the remote version was fetched and equals `APP_VERSION`.
- If version fetching fails, the existing service-worker refresh behavior remains available.

## Verification Evidence

- Red test first: `./node_modules/.bin/vitest run src/components/PWAPrompt.test.tsx` failed because the update card rendered `目前版本 same-version · 最新版本 same-version`.
- Fresh resume verification on 2026-05-11:
  - `./node_modules/.bin/vitest run src/components/PWAPrompt.test.tsx src/services/appVersion.test.ts`: 2 files, 2 tests passed.
  - `./node_modules/.bin/vitest run src/components/PWAPrompt.test.tsx src/services/appVersion.test.ts src/components/Layout.test.tsx src/pages/Overview.test.tsx src/pages/Items.test.tsx src/services/quickInventory.test.ts src/services/outfitEligibility.test.ts src/services/packingChecklist.test.ts src/services/flightMemory.test.ts`: 9 files, 26 tests passed.
  - `./node_modules/.bin/tsc -b`: passed.
  - `npm run build`: passed, with existing Vite chunk-size warning.
  - `npm run lint`: still blocked by existing repo-wide lint debt in `useRetry`, `Items`, `Luggages`, `Outfits`, `ai`, and `google`.
