# Phase 11 — Quick Inventory Departure Advice Verification

## Scope

- Add deterministic quick-count advice for `AI 斷捨離`, so the app remains useful when the AI pipeline or API key is unavailable.
- Derive an inclusive trip length from outbound and return dates, falling back to a 7-day planning window for one-way trips.
- Convert quick-count groups such as `襪子 × 7` and `內褲 × 6` into shortage and laundry timing advice.
- Remind users about missing essentials such as passport, universal adapter, and phone charger.
- Merge deterministic quick-count advice with AI-generated declutter results instead of replacing them.
- Render `packing_advice` in the Overview insight result area.

## Verification Evidence

- `./node_modules/.bin/vitest run src/services/quickInventoryAdvice.test.ts src/pages/Overview.test.tsx src/services/quickInventory.test.ts src/services/packingChecklist.test.ts src/pages/Items.test.tsx src/services/outfitEligibility.test.ts`: 6 files, 18 tests passed.
- `./node_modules/.bin/tsc -b`: passed.
- `npm run build`: passed, with existing Vite chunk-size warning.
- `npm run lint`: failed on existing repo-wide lint debt outside this slice, including `src/services/ai.ts`, `src/pages/Items.tsx`, `src/pages/Luggages.tsx`, `src/pages/Outfits.tsx`, `src/hooks/useRetry.ts`, and `src/services/google.ts`.
- Playwright local preview smoke on `/overview`: seeded `襪子 × 7`, `內褲 × 6`, `上衣 × 7`, and a 10-day round trip; clicking `AI 斷捨離` displayed local quick-count advice for shortage, day-5 laundry timing, and missing essentials when the API route was unavailable.
- GitHub push: `986e893 feat: add quick inventory packing advice` pushed to `origin/main`.
- Vercel production deploy: `https://nomadic-rust.vercel.app` aliased to deployment `nomadic-zvhhjbx14-kelsidreamlands-projects.vercel.app`.
- Production `version.json`: `986e893`, built at `2026-05-06T16:56:39.490Z`.
- Playwright production smoke on `/overview`: page showed `v986e893`; seeded the same quick-count trip data and confirmed `AI 斷捨離` rendered `打包與備品建議`, socks/underwear shortage, day-5 laundry timing, and missing essentials. Production API returned the existing missing Gemini API key error, and the local fallback advice handled it.
