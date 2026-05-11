# Phase 17: Lint And Type Cleanup

Date: 2026-05-12

## Goal

Clear the accumulated lint/type debt so future product work can rely on clean verification.

## Scope

- Removed remaining `any` usage from retry, luggage form, item/outfit pages, Google integrations, AI services, and AI tests.
- Added typed normalization at AI boundaries for item recognition and smart packing insights.
- Stabilized the Flight Memory PDF import test by waiting for asynchronous FileReader-driven side effects.

## Verification

- `git diff --check` exit 0
- `./node_modules/.bin/tsc -b` exit 0
- `npm run lint` exit 0
- `./node_modules/.bin/vitest run` exit 0, 21 files / 59 tests
- `npm run build` exit 0, with existing Vite large chunk warning
