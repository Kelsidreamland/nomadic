# Phase 18: Route Lazy Loading

Date: 2026-05-12

## Goal

Improve first-load performance for mobile and desktop browsers by avoiding eager loading of every page module.

## Scope

- Converted top-level app routes to `React.lazy` with a lightweight route fallback.
- Split the Flight Memory map into a nested lazy chunk so the route shell can render before ECharts/map code loads.
- Kept the map fallback dimensioned to avoid layout jump.

## Verification

- `git diff --check` exit 0
- `./node_modules/.bin/tsc -b` exit 0
- `npm run lint` exit 0
- `./node_modules/.bin/vitest run` exit 0, 21 files / 59 tests
- `npm run build` exit 0

## Build Notes

- Initial `index` JS chunk is about 317KB after route splitting, down from about 1.5MB before this slice.
- The map renderer remains a large lazy chunk because ECharts/world-map rendering is intentionally isolated there.
