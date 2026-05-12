# Phase 23: Dashboard Flight Guardrails

## Intent

Fix the user-reported issue where Dashboard interactions can make old flight data appear again:

- Remove the old Dashboard "weight vs limit" card that should no longer be part of the current flow.
- Make the companion-ticket action explicit and guarded instead of silently doing nothing or saving stale form data.
- Prevent Dashboard future-trip flows from saving historical flights back into IndexedDB.

## Root Cause Notes

- `Dashboard.tsx` still renders a standalone `overview.weightVsLimit` card even though that responsibility moved to luggage cards in Overview.
- `handleSaveAdditionalTicket` saves whatever is in `flightData` if destination/date exist. If stale or historical form data remains, it can write old routes back into `flights`.
- The companion button remains enabled even when required flight fields are blank, which looks like a broken/no-op action.

## Implementation Slices

1. Add Dashboard regression tests for removing the old weight card, disabling companion until required fields exist, and rejecting historical companion tickets.
2. Add Dashboard date guard helpers based on the same "today" value used for upcoming trip selection.
3. Disable the companion button until the visible form has enough valid future-trip data.
4. Remove the Dashboard weight-vs-limit section and unused calculations/imports.

## Verification

- `./node_modules/.bin/vitest run src/pages/Dashboard.test.tsx`
- `git diff --check`
- `./node_modules/.bin/tsc -b`
- `npm run lint`
- `./node_modules/.bin/vitest run`
- `npm run build`
- Commit, push, deploy to Vercel production, verify `/version.json`.

## Verification Result

2026-05-12T19:17:01+08:00

- Dashboard regression tests: 4 passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- Full `./node_modules/.bin/vitest run`: 75 passed.
- `npm run build`: passed with the existing large chunk warning.
