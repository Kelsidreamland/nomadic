# Phase 22: Overview And Memory Interaction Fixes

## Intent

Fix the user-reported production issues from mobile testing:

- Overview luggage allowance fields cannot be typed into reliably and do not have an explicit save action.
- Overview item transfer relies too heavily on drag/drop precision, especially on mobile.
- Flight Memory imported segments cannot be deleted when CSV/PDF imports leave stale or incorrect data.
- Flight Passport airport labels become unreadable for dense travel history and should be removed entirely.

## Root Cause Notes

- The allowance input writes to IndexedDB on every change while its value is computed from liveQuery data, so re-renders can overwrite draft typing.
- Drag/drop has a valid luggage-level drop target, but the visible affordance is unclear on mobile and there is no direct fallback move action.
- The imported flight list is read-only; no segment or flight delete action is wired to `db.flights`.
- `FlightRouteMap` renders airport text as a custom overlay on top of ECharts, creating dense label collisions.

## Implementation Slices

1. Add regression tests for allowance draft/save, direct item move, flight memory delete, and no airport label overlay.
2. Update Overview with local allowance draft state, explicit save button, and direct move controls on item cards.
3. Update Flight Memory imported list with a concise delete action and matching DB calls.
4. Remove the Flight Passport airport label overlay while keeping route lines and airport dots.

## Verification

- `./node_modules/.bin/vitest run src/pages/Overview.test.tsx src/pages/FlightMemory.test.tsx src/components/FlightRouteMap.test.tsx`
- `git diff --check`
- `./node_modules/.bin/tsc -b`
- `npm run lint`
- `./node_modules/.bin/vitest run`
- `npm run build`
- Commit, push, deploy to Vercel production, verify `/version.json`.

## Verification Result

2026-05-12T18:49:19+08:00

- Targeted regression tests: 13 passed.
- `git diff --check`: passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run lint`: passed.
- Full `./node_modules/.bin/vitest run`: 72 passed.
- `npm run build`: passed with the existing large chunk warning.
