# 重新設計品牌與引導流程 Spec

## Why
為了進軍國際英文市場，並提供更流暢的使用者體驗，需要重新塑造品牌視覺並更新應用名稱為「Nomadic : my luggage」。同時，初次使用者的引導流程 (Onboarding) 缺乏吸引力與明確指示，導致使用者不清楚授權 Google 日曆/Gmail 的好處，也缺乏手動新增打包清單的彈性。

## What Changes
- **品牌重塑**：將應用程式名稱更改為「Nomadic : my luggage」，並重新設計符合英文市場品味的品牌視覺（包含 Logo、色彩、排版）。
- **PWA 自動提示**：確保使用者首次打開網頁時，會自動且明顯地提示將應用程式安裝到桌面 (PWA Install Prompt)。
- **全新 Landing Page 與引導流程 (Onboarding)**：
  - 介紹「Nomadic」的功能亮點與簡單使用說明。
  - 展示兩個核心使用場景與流程。
  - 強烈建議使用者授權 Google 日曆與 Gmail，並明確說明其自動管理行程與個性化推薦的好處。
  - 提供明顯的「跳過 (Skip)」按鈕，讓不想授權的使用者可以直接手動填寫行程與行李內容物。
- **手動打包清單增強 (To-Do List)**：
  - 在「準備出發」的手動打包頁面中，新增「自行增加/刪減打包項目」的 To-Do List 功能。
  - 加入「智能提示」按鈕，快速一鍵加入基礎必帶行李（例如：SIM卡/網卡、萬國充、護照等）。
- **流程整合測試**：完整測試一次使用流程，確保所有新舊功能正常運作。

## Impact
- Affected specs: 品牌視覺、PWA 安裝機制、首頁路由與引導組件、打包清單組件。
- Affected code: 
  - `src/App.tsx` (路由與入口)
  - `src/pages/Dashboard.tsx` (主要操作面板與引導流程)
  - `src/components/PWAPrompt.tsx` (PWA 提示機制)
  - `src/index.css` / `tailwind.config.js` (品牌色與字體)
  - `index.html` (Meta tags, Title)

## ADDED Requirements
### Requirement: 全新 Landing Page 與引導流程
The system SHALL provide a dedicated landing/onboarding experience for first-time users.

#### Scenario: Success case
- **WHEN** 使用者第一次進入應用程式
- **THEN** 系統展示「Nomadic」品牌、功能亮點與使用場景，並提供「授權 Google (推薦)」與「跳過手動輸入」兩個明確選項。

### Requirement: 打包清單自訂與智能提示
The system SHALL allow users to manually add custom to-do items to their packing list and offer smart suggestions.

#### Scenario: Success case
- **WHEN** 使用者進入手動打包 (Checklist) 步驟
- **THEN** 使用者可以看到輸入框以手動新增物品，並有快速按鈕可一鍵加入「SIM卡」、「萬國充」等推薦必備物品。

## MODIFIED Requirements
### Requirement: PWA 安裝提示
The system SHALL automatically prompt the user to install the PWA on their first visit, rather than waiting for a passive interaction.

### Requirement: 品牌視覺更新
The system SHALL use "Nomadic : my luggage" as the primary application name across all UI text, manifest files, and page titles, adopting a modern, minimalist aesthetic suitable for the global English market.
