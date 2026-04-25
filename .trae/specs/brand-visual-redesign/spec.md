# 品牌視覺全面重塑 Spec

## Why
使用者對於先前的極簡黑白設計感到不滿意，且發現該風格僅套用於單一頁面（Landing Page），缺乏整體一致性。使用者希望採用「溫暖的風格 (Warm Style)」，並且在決定最終風格與 Logo 前，需要先看到兩個不同版本的視覺提案。此外，新的設計規範必須完美支援中文與英文的雙語顯示。

## What Changes
- **視覺提案 (Visual Proposals)**：產出兩款「溫暖風格」的設計哲學與視覺 Mockup (Version A 與 Version B) 供使用者選擇。
- **Logo 設計**：在使用者確認風格後，依據該風格設計專屬的品牌 Logo。
- **全站視覺統一**：將使用者選定的視覺風格規範（色彩、字體、圓角、陰影、排版等）全面套用至所有的頁面，包含：
  - `Dashboard.tsx` 及 `Onboarding.tsx`
  - `Items.tsx` (物品清單)
  - `Luggages.tsx` (行李箱)
  - `Outfits.tsx` (穿搭推薦)
  - `Settings.tsx` (設定)
- **雙語排版支援**：調整字體設定與排版間距，確保中文字體（如 Noto Sans TC）與英文字體（如 Poppins/Lora）在切換時皆能保持美觀與對齊。

## Impact
- Affected specs: 品牌視覺規範 (Brand Guidelines)、全站 UI 組件 (Frontend Design)。
- Affected code: 
  - `src/index.css` 及 `tailwind.config.js` (全域樣式與變數)
  - `src/components/*` (所有共用元件)
  - `src/pages/*` (所有頁面)

## ADDED Requirements
### Requirement: 多版本視覺提案與確認機制
The system SHALL present two distinct warm-themed visual design proposals before applying any global changes.

#### Scenario: Success case
- **WHEN** 進入設計階段
- **THEN** 系統將提供版本 A 與版本 B 的設計理念與視覺預覽，等待使用者確認後再進行後續開發。

### Requirement: 全站雙語字體支援
The system SHALL implement a typography stack that seamlessly supports both English and Traditional Chinese characters without layout breaking.

## MODIFIED Requirements
### Requirement: 全站風格統一
The system SHALL apply the selected warm visual style consistently across ALL pages, removing the isolated black-and-white minimalist design.