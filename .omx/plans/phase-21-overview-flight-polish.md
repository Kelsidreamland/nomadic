# Phase 21: Overview And Flight Polish

Date: 2026-05-12

## Goal

Fix the latest mobile testing feedback around outfit stats, Flighty imports, overview luggage management, and future-trip flight forms.

## Scope

- Excluded sleepwear and swimwear from outfit planning stats even when old records were explicitly marked eligible.
- Made `getUpcomingFlight` and travel-memory history parse non-ISO Flighty dates so old CSV imports no longer pollute Overview's future flight card.
- Added city aliases for route rendering when Flighty exports omit IATA codes.
- Added seat number support on flight records, CSV imports, ticket AI prompts, and the manual flight form.
- Replaced the manual passenger-count field with a less prominent companion-ticket action.
- Moved luggage allowance display into each Overview luggage card and added editable per-luggage allowance overrides.
- Made unassigned Overview items expandable so loose items can be inspected and dragged into a luggage.

## Verification

- `git diff --check` exit 0
- `./node_modules/.bin/tsc -b` exit 0
- `npm run lint` exit 0
- `./node_modules/.bin/vitest run` exit 0, 22 files / 69 tests
- `npm run build` exit 0, with existing lazy map chunk warning
