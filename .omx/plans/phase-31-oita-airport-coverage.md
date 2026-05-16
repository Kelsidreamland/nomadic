# Phase 31: Oita Airport Coverage

## Goal

Resolve the remaining Travel Memory unresolved route:

- `2026-10-01 OITA -> TAOYUAN (DAYUAN)`

## Root Cause

The local flight memory airport catalog did not include Oita Airport. Flighty exports the city name `OITA`, while the IATA airport code is `OIT`, so the route could not be mapped.

## Fix

- Add Oita Airport (`OIT`) to the local airport catalog.
- Add `oita` and `大分` aliases.
- Add regression coverage so Flighty city-name exports map to `OIT`.

## Verification

- `./node_modules/.bin/vitest run src/services/flightMemoryGeo.test.ts src/services/flightPassportData.test.ts`
- `git diff --check`
- `./node_modules/.bin/tsc -b`
- `npm run lint`
- `./node_modules/.bin/vitest run`
- `npm run build`

## Verification Result

2026-05-16T14:35:44+08:00

- Targeted airport/passport tests: 10 passed.
- `git diff --check`: passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run lint`: passed.
- Full `./node_modules/.bin/vitest run`: 89 passed.
- `npm run build`: passed with the existing large chunk warning.
