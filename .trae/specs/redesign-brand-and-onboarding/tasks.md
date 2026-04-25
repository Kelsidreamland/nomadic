# Tasks

- [x] Task 1: 品牌視覺重塑與 Logo 設計
  - [x] SubTask 1.1: 撰寫品牌視覺設計理念（使用 Canvas Design & Frontend Design）並更新至 CSS Variables (`src/index.css` 或 `tailwind.config.js`)，改採現代極簡、適合英文市場的配色與字體。
  - [x] SubTask 1.2: 更新 `index.html` 的 Title、Meta tags、Favicon 及 PWA manifest (`vite.config.ts`)，將名稱改為「Nomadic : my luggage」。
  - [x] SubTask 1.3: 更新所有 UI 上的標題與文案（如 `App.tsx`, `Dashboard.tsx`）為新品牌名稱。

- [x] Task 2: 實作 PWA 自動安裝提示
  - [x] SubTask 2.1: 修改 `src/components/PWAPrompt.tsx` 或首頁邏輯，確保使用者第一次開啟網頁時會自動彈出「安裝到桌面」的提示（如果瀏覽器支援 `beforeinstallprompt`）。
  - [x] SubTask 2.2: 使用 `localStorage` 記錄使用者是否已經看過安裝提示，避免頻繁打擾。

- [x] Task 3: 打造 Landing Page 與 Onboarding 流程
  - [x] SubTask 3.1: 新增 `src/components/Onboarding.tsx` 或在 `Dashboard.tsx` 新增首頁狀態（如 `isFirstTimeUser`），展示「Nomadic」的簡單使用介紹、兩個使用場景（自動同步/手動輸入）及功能亮點。
  - [x] SubTask 3.2: 實作「授權 Google (推薦)」的主要 CTA，文案強調「自動管理行程與個性化行李推薦的好處」。
  - [x] SubTask 3.3: 實作「跳過 (Skip)」按鈕，讓不想授權的使用者可以直接進入手動填寫行程的表單 (`handleManualAdd`)。

- [x] Task 4: 手動打包清單增強功能 (To-Do List 與智能提示)
  - [x] SubTask 4.1: 在 `Dashboard.tsx` 的 `checklist` 階段，新增一個可以自由輸入文字的 input 與「新增」按鈕，讓使用者能手動增加打包項目 (To-Do List)。
  - [x] SubTask 4.2: 在輸入框下方新增一排「智能提示」按鈕 (Chips)，例如「SIM卡/網卡」、「萬國充」、「護照」等，點擊即可快速加入清單。
  - [x] SubTask 4.3: 將手動新增的物品整合至現有的打包清單狀態 (`items` 列表之外的額外列表，或作為一次性 todo items 存入資料庫)。

- [x] Task 5: 完整流程與功能測試
  - [x] SubTask 5.1: 測試新使用者的 Landing Page 流程，確認授權與跳過按鈕皆能正常切換至對應流程。
  - [x] SubTask 5.2: 測試打包清單的新增、勾選、刪除功能是否正常運作。
  - [x] SubTask 5.3: 測試 PWA 安裝提示是否能在初次訪問時顯示。

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 3]
- [Task 5] depends on [Task 2, Task 3, Task 4]
