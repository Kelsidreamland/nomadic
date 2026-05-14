# Phase 26: Flight Memory Copy Diagnostics

## Goal

Let users copy unmapped flight diagnostics and quickly see which imported flight rows cannot be drawn on the passport map.

## Architecture

- Extend `flightPassportData` diagnostics with per-segment unresolved details.
- Keep diagnostics read-only; do not add flight editing in this slice.
- Render a lightweight expandable text block and highlight unresolved rows in the imported flight list.

## Tasks

1. Add failing service tests for `diagnostics.unresolvedSegments`.
2. Add failing UI tests for expanding/copying diagnostics and highlighted imported rows.
3. Implement per-segment diagnostics in `src/services/flightPassportData.ts`.
4. Render copyable diagnostics and unresolved labels in `src/pages/FlightMemory.tsx`.
5. Add Traditional Chinese and English strings.
6. Verify targeted tests, typecheck, lint, full tests, build, commit, push, deploy.

## Verification

- `./node_modules/.bin/vitest run src/services/flightPassportData.test.ts src/pages/FlightMemory.test.tsx`
- `git diff --check`
- `./node_modules/.bin/tsc -b`
- `npm run lint`
- `./node_modules/.bin/vitest run`
- `npm run build`

## Verification Result

2026-05-14T14:20:46+08:00

- Targeted diagnostics tests: 9 passed.
- `git diff --check`: passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run lint`: passed.
- Full `./node_modules/.bin/vitest run`: 81 passed.
- `npm run build`: passed with the existing large chunk warning.
