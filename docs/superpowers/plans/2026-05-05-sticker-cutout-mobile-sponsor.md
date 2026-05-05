# Sticker Cutout And Mobile Sponsor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add local manual sticker cutout editing and restore mobile visibility for the Sponsor / VIP CTA.

**Architecture:** Keep image math in `src/services/imageSticker.ts` so it is testable. Keep pointer drawing state inside `src/pages/Items.tsx` because it is transient UI state. Add the mobile CTA directly in `src/components/Layout.tsx` beside the existing header controls.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Canvas 2D, Vitest, Testing Library.

---

### Task 1: Sticker Cutout Helpers

**Files:**
- Modify: `src/services/imageSticker.ts`
- Modify: `src/services/imageSticker.test.ts`

- [x] Add failing tests for point clamping and default cutout polygon generation.
- [x] Implement `StickerPoint`, `normalizeStickerCutoutPath`, and `getDefaultStickerCutoutPath`.
- [x] Run `./node_modules/.bin/vitest run src/services/imageSticker.test.ts`.

### Task 2: Manual Cutout Editor

**Files:**
- Modify: `src/pages/Items.tsx`
- Modify: `src/i18n.ts`

- [x] Add transient lasso state and pointer handlers.
- [x] Update sticker rendering to clip to the lasso path and draw a white cut-paper border.
- [x] Replace background buttons with draw, clear, and apply controls.
- [x] Add Traditional Chinese and English copy.
- [x] Run `./node_modules/.bin/tsc -b`.

### Task 3: Mobile Sponsor CTA

**Files:**
- Modify: `src/components/Layout.tsx`
- Create: `src/components/Layout.test.tsx`

- [x] Add a failing jsdom test that expects desktop and mobile Sponsor / VIP entry points.
- [x] Add the mobile icon-only CTA to the header.
- [x] Run `./node_modules/.bin/vitest run src/components/Layout.test.tsx`.

### Task 4: Verify, Commit, Deploy

**Files:**
- Verify all changed files.

- [x] Run targeted Vitest tests.
- [x] Run `./node_modules/.bin/tsc -b`.
- [x] Run `npm run build`.
- [x] Run browser smoke checks on desktop and mobile widths.
- [ ] Commit, push to `main`, deploy to Vercel production, and verify `version.json`.
