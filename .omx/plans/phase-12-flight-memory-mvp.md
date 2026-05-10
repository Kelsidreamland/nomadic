# Phase 12 — Flight Memory MVP

## Goal

Simplify `旅居足跡` into a quiet MVP dashboard: fewer stats, no year timeline wall, visible import entry points, and a simple route-map preview.

## Scope

- Replace airport/destination/year stats with:
  - current-year flight segments
  - countries visited with emoji flags
  - most visited country
- Remove the year-grouped timeline from the page.
- Add CSV import as the first real bulk import path.
- Add PDF upload as a visible MVP entry with a clear "coming next" style message.
- Upgrade route preview into a simple non-live route map using known airport coordinates.

## Non-Goals

- No live flight status.
- No gate/terminal tracking.
- No full PDF batch parser in this slice.
- No country picker, no editable country metadata.

## Verification Plan

- Add unit tests for country stats and CSV parsing.
- Add page render test for the simplified MVP surface.
- Run targeted tests, TypeScript, build, and Playwright smoke.
- Commit, push, deploy production, and verify production version.

## Local Verification Evidence

- `./node_modules/.bin/vitest run src/services/flightMemoryGeo.test.ts src/services/flightMemoryImport.test.ts src/services/flightMemory.test.ts src/pages/FlightMemory.test.tsx src/services/quickInventoryAdvice.test.ts src/pages/Overview.test.tsx src/services/packingChecklist.test.ts src/pages/Items.test.tsx src/components/Layout.test.tsx`: 9 files, 26 tests passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run build`: passed, with existing Vite chunk-size warning.
- `npm run lint`: still fails on existing repo-wide errors in `src/hooks/useRetry.ts`, `src/pages/Items.tsx`, `src/pages/Luggages.tsx`, `src/pages/Outfits.tsx`, `src/services/ai.test.ts`, `src/services/ai.ts`, and `src/services/google.ts`. This slice removed its own `FlightMemory.tsx` warning.
- Playwright local preview on `127.0.0.1:4176/memory`: seeded demo flight memory data and confirmed the simplified stats, CSV/PDF import entry, route map, and manual fallback order on desktop and mobile.

## Production Verification Evidence

- GitHub push: `412e586 feat: simplify flight memory MVP` pushed to `origin/main`.
- Vercel production deploy: `https://nomadic-rust.vercel.app` aliased to deployment `nomadic-hdgpg1l1n-kelsidreamlands-projects.vercel.app`.
- Production `version.json`: `412e586`, built at `2026-05-06T19:13:58.016Z`.
- Playwright production smoke on `/memory`: page showed `v412e586`; seeded demo flight records and confirmed `今年航程`, `去過國家`, `最常去`, `匯入 CSV`, `上傳 PDF`, `飛行路線圖`, and manual fallback appear in the intended order.

## Flight Passport Map Revision

- Replace the simple SVG route map with an ECharts flight-passport poster card: dark world map, red route flow lines, limited airport labels, passport stats, MRZ-style text, and a 2x PNG export button.
- Add `flightPassportData` as the map data layer so route coordinates, stats, MRZ text, and label selection stay separate from rendering.
- Verification:
  - `./node_modules/.bin/vitest run src/services/flightPassportData.test.ts src/components/FlightRouteMap.test.tsx`: passed.
  - `./node_modules/.bin/tsc -b`: passed.
  - `npm run build`: passed with the existing large chunk warning.
  - `npm run lint`: still fails on existing repo-wide lint debt in `useRetry`, `Items`, `Luggages`, `Outfits`, `ai`, and `google`; no errors remain in this flight passport slice.
  - Playwright local preview on `127.0.0.1:4177/memory`: seeded eight demo flight records, confirmed ECharts canvas renders on desktop and mobile widths, and confirmed the `匯出護照圖` button downloads a valid `nomadic-flight-passport-2026-05-10.png`.
- Production:
  - GitHub push: `a4a3713 feat: add flight passport map` pushed to `origin/main`.
  - Vercel production deploy: `https://nomadic-rust.vercel.app` aliased to deployment `nomadic-kxkovwphy-kelsidreamlands-projects.vercel.app`.
  - Production `version.json`: `a4a3713`, built at `2026-05-10T13:58:09.180Z`.
  - Playwright production smoke on `/memory`: seeded demo flights in browser IndexedDB, confirmed `va4a3713`, `flight-passport-card`, ECharts canvas, MRZ text, and PNG export download.

## Brand Alignment And Complete Airport Labels

- Adjust the flight passport poster from cool blue/black into the existing Nomadic palette: espresso background, terracotta route accents, stone/cream labels, and muted warm land colors.
- Keep all unique airport labels visible for normal route sets, and render airport codes as positioned HTML labels over the ECharts canvas so dense labels can stay complete in exported PNGs.
- Verification:
  - `./node_modules/.bin/vitest run src/services/flightPassportData.test.ts src/components/FlightRouteMap.test.tsx`: passed.
  - `./node_modules/.bin/tsc -b`: passed.
  - `npm run build`: passed with the existing large chunk warning.
  - `npm run lint`: still fails on existing repo-wide lint debt in `useRetry`, `Items`, `Luggages`, `Outfits`, `ai`, and `google`; no new lint errors from this map revision.
  - Playwright local preview on `127.0.0.1:4177/memory`: seeded eight demo flights, confirmed nine airport labels (`TPE/SIN/IST/LHR/JFK/CDG/NRT/HND/ICN`) render as DOM overlays on mobile width, captured desktop/mobile screenshots, and confirmed PNG export includes the complete warm-brand map.

## Passport Information Density Simplification

- Remove route chips (`TPE > SIN` style) from the passport poster to reduce duplicate route detail now that airport labels are visible on the map.
- Remove the `COUNTRIES` stats column because the country flag row already communicates visited countries.
- Verification:
  - `./node_modules/.bin/vitest run src/components/FlightRouteMap.test.tsx src/services/flightPassportData.test.ts`: passed.
  - `./node_modules/.bin/tsc -b`: passed.
  - `npm run build`: passed with the existing large chunk warning.
  - `npm run lint`: still fails on existing repo-wide lint debt in `useRetry`, `Items`, `Luggages`, `Outfits`, `ai`, and `google`; no new lint errors from this simplification.
  - Playwright local preview on `127.0.0.1:4177/memory`: seeded eight demo flights, confirmed route chips and `COUNTRIES` no longer appear in the passport card, confirmed `FLIGHTS`, `TOP`, MRZ, and nine airport labels remain, and confirmed PNG export still works.
