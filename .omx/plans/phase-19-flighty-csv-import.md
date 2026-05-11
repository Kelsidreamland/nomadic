# Phase 19: Flighty CSV Import

Date: 2026-05-12

## Goal

Make Travel Footprint CSV import accept Flighty exports whose headers include `Date`, `Start`, and `Destination`.

## Scope

- Added a regression test for Flighty tab-delimited exports.
- Mapped `Start` to departure airport.
- Normalized airport values like `Taipei (TPE)` and `Tokyo Narita (NRT)` to IATA codes for map routing.
- Preserved existing CSV formats, including comma, semicolon, and Chinese headers.

## Verification

- `./node_modules/.bin/vitest run src/services/flightMemoryImport.test.ts --pool=threads` exit 0
- `git diff --check` exit 0
- `./node_modules/.bin/tsc -b` exit 0
- `npm run lint` exit 0
- `./node_modules/.bin/vitest run` exit 0, 21 files / 60 tests
- `npm run build` exit 0, with existing lazy map chunk warning
