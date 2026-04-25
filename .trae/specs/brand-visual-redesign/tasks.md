# Tasks

- [x] Task 1: 產出兩款溫暖風格的視覺提案 (Canvas Design & Frontend Design)
  - [x] SubTask 1.1: 設計版本 A (例如：大地暖色調 Earthy Warmth - 使用米色、沙色與暖橘色)。
  - [x] SubTask 1.2: 設計版本 B (例如：柔和粉彩 Soft Pastel - 使用奶油色、暖黃色與柔和粉色)。
  - [x] SubTask 1.3: 將這兩個版本呈現給使用者，等待使用者決定。(使用者傾向版本 A，並要求看實際畫面，我們將直接以版本 A 實作預覽與全站套用)

- [x] Task 2: Logo 設計與視覺確認
  - [x] SubTask 2.1: 根據使用者選擇的風格 (A 或 B)，設計 Nomadic 的專屬 Logo。
  - [x] SubTask 2.2: 確認 Logo 與主色調，將其定義為 Tailwind / CSS 變數。

- [x] Task 3: 全站字體與雙語排版設定
  - [x] SubTask 3.1: 設定英文字體 (如 Poppins/Lora) 與中文字體 (如 Noto Sans TC) 的 Fallback 機制。
  - [x] SubTask 3.2: 調整全域的行高與字距，確保中英文切換時排版不會跑版。

- [x] Task 4: 統一全站頁面視覺風格
  - [x] SubTask 4.1: 重構 `Onboarding.tsx` 與 `Dashboard.tsx` 的視覺，套用新的溫暖風格。
  - [x] SubTask 4.2: 重構 `Items.tsx` 與 `Luggages.tsx`，確保卡片、按鈕、輸入框皆符合新規範。
  - [x] SubTask 4.3: 重構 `Outfits.tsx` (矩陣穿搭 UI) 與 `Settings.tsx`，套用新的色彩與圓角設定。
  - [x] SubTask 4.4: 檢查所有 Modal、Alert、Toast 等共用組件的樣式一致性。

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 2, Task 3]