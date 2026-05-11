# Phase 13 — Overview Item Transfer

## Scope

- Let users move an item from one luggage to another directly on `總覽`.
- Keep the interaction local to Overview; no cross-page sorting or bulk move behavior in this slice.
- Support desktop drag/drop and mobile long-press pointer movement.

## Implementation Notes

- Luggage cards are drop targets with localized accessible labels.
- Item rows are draggable and expose a long-press hint.
- Dropping or long-press releasing over a different luggage updates `items.luggageId`.
- Source and destination luggage cards stay expanded after a move so the user can confirm the result.

## Verification Evidence

- Red test first: `./node_modules/.bin/vitest run src/pages/Overview.test.tsx` failed because draggable item/drop target behavior was missing.
- `./node_modules/.bin/vitest run src/pages/Overview.test.tsx`: 1 file, 3 tests passed.
- `./node_modules/.bin/vitest run src/services/quickInventory.test.ts src/services/outfitEligibility.test.ts src/services/packingChecklist.test.ts src/pages/Items.test.tsx src/pages/Overview.test.tsx src/services/flightMemory.test.ts src/components/Layout.test.tsx`: 7 files, 24 tests passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run build`: passed, with existing Vite chunk-size warning.
- `npm run lint`: still blocked by existing repo-wide lint debt in `useRetry`, `Items`, `Luggages`, `Outfits`, `ai`, and `google`.
- Playwright local mobile smoke at `390x844` on `/overview?packing=1`: seeded `手提箱`, `托運箱`, and `白色襯衫`; long-press pointer release moved `白色襯衫` from `手提箱` to `托運箱` in IndexedDB and the Overview UI updated.
