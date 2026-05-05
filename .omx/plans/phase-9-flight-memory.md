# Phase 9 — Flight Memory Plan

## Goal

Build a quiet "旅居足跡 / Memory" feature that turns existing and manually entered past flights into a personal route map and archive timeline. The first version is for private joy, not flight operations, social sharing, or monetization.

## Product Decisions

- Entry: add a small Dashboard or Overview entry; do not add a fifth bottom navigation item.
- Data entry: manual past-flight entry first.
- Map: SVG memory map using a lightweight React map approach, not a tile map.
- Airport data: local compact IATA airport catalog from OurAirports public-domain data.
- Non-goals: no live status, no delay alerts, no gate changes, no airport navigation, no CSV import, no AI batch import, no poster export in this phase.

## Existing Code Constraints

- `src/db/index.ts` already defines `Flight` with outbound and return metadata.
- `src/pages/Dashboard.tsx` and `src/pages/Overview.tsx` currently select the first sorted flight as the upcoming flight. Before adding past flights, this must be replaced by a selector that filters out past flights.
- Existing ticket parsing can stay unchanged in this phase.

## Slices

### Slice 1 — Flight Selectors And Memory Domain

Files likely to change:

- Create `src/services/flightMemory.ts`
- Create `src/services/flightMemory.test.ts`
- Modify `src/pages/Dashboard.tsx`
- Modify `src/pages/Overview.tsx`

Work:

- Add `getUpcomingFlight(flights, now)` so past flights never hijack the packing dashboard.
- Add `getFlightMemoryEntries(flights)` that sorts historical flights newest-to-oldest for the memory page.
- Add helpers that treat return-trip fields as a second memory segment when present.

Verification:

- Vitest: past flights are excluded from upcoming-flight selection.
- Vitest: return-trip data becomes a separate memory segment.
- Manual smoke: adding a past flight does not change Dashboard's upcoming trip card.

Done when:

- Existing packing workflow remains stable after past flights exist in the database.

### Slice 2 — Airport Catalog And Route Resolution

Files likely to change:

- Create `src/data/airports.ts`
- Extend `src/services/flightMemory.ts`
- Extend `src/services/flightMemory.test.ts`

Work:

- Add a compact local airport catalog with `iata`, `name`, `city`, `country`, `lat`, and `lon`.
- Resolve airport codes from either explicit code fields or existing `departureAirport` / `arrivalAirport` strings such as `TPE 桃園`.
- Build route objects only when both endpoints resolve.
- Keep unresolved flights visible in the timeline but omit them from the map until corrected.

Verification:

- Vitest: `TPE 桃園` resolves to `TPE`.
- Vitest: unresolved airports do not crash route building.
- Vitest: route distance and summary stats are deterministic.

Done when:

- The map layer can consume clean route objects without knowing about messy form strings.

### Slice 3 — Manual Past Flight Entry

Files likely to change:

- Modify `src/db/index.ts`
- Create or modify `src/components/FlightMemoryForm.tsx`
- Create `src/pages/FlightMemory.tsx`
- Modify `src/i18n.ts`

Work:

- Add a simple past-flight form: date, from airport code, to airport code, airline, flight number, optional note.
- Save into existing `flights` table with defaults for baggage fields so old app paths remain compatible.
- Add edit/delete for memory flights.
- Keep copy emotional and light: "記錄一段旅居足跡", not "航班管理".

Verification:

- TypeScript compile.
- Component or service tests for form normalization where practical.
- Manual smoke: create, edit, delete a past flight.

Done when:

- The user can manually add 10-20 past flights without touching the upcoming trip flow.

### Slice 4 — Memory Page And Quiet Entry

Files likely to change:

- Modify `src/App.tsx`
- Modify `src/pages/Dashboard.tsx`
- Modify `src/pages/Overview.tsx` if entry fits better there
- Create `src/pages/FlightMemory.tsx`
- Modify `src/i18n.ts`

Work:

- Add route `/memory`.
- Add a quiet Dashboard/Overview entry card.
- Show high-level stats: flight count, cities/airports, countries if available, total distance.
- Show archive timeline grouped by year.
- Empty state should invite adding the first past flight.

Verification:

- Playwright mobile and desktop smoke for `/memory`.
- Verify bottom nav remains four items.
- Verify quiet entry is discoverable but not visually dominant.

Done when:

- "足跡" feels like a personal archive inside Nomadic, not a new primary app mode.

### Slice 5 — SVG Route Map

Files likely to change:

- Create `src/components/FlightMemoryMap.tsx`
- Modify `src/pages/FlightMemory.tsx`
- Add map dependency and any local map data if needed

Work:

- Render a world map with route arcs and airport markers.
- Use brand colors and restrained Claude-style visuals.
- Add year filter only if the timeline/map becomes visually crowded; otherwise defer.
- Avoid heavy map controls, geolocation, tile providers, or API keys.

Verification:

- Playwright screenshot desktop and mobile.
- Pixel/screenshot sanity: map is not blank, routes render, text does not overlap.
- Build output checked for unacceptable bundle growth.

Done when:

- A small set of manual past flights produces an emotionally useful travel-memory map.

### Slice 6 — Final Verification And Deployment

Files likely to change:

- `.omx/plans/phase-9-flight-memory-verification.md`

Work:

- Run targeted tests.
- Run `./node_modules/.bin/tsc -b`.
- Run `npm run build`.
- Run Playwright smoke on `/`, `/overview`, `/memory`, and mobile bottom nav.
- Commit, push, deploy, and verify `version.json`.

Done when:

- Production has the verified Phase 9 version, and the next phase is explicit.
