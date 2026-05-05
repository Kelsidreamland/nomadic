# Phase 8 — 驗證地圖

## 靜態驗證

- `./node_modules/.bin/tsc --noEmit`
  - 預期：無 TypeScript 錯誤。
- `./node_modules/.bin/vitest run src/services/ai.test.ts`
  - 預期：現有 AI service regression test 通過。
- `npm run build`
  - 預期：Vite build 成功，PWA manifest/icon 不被本階段破壞。
- `rg "bg-blue|text-blue|bg-green|text-green|yellow|orange|red-" src/pages src/components`
  - 預期：高彩狀態色已收斂；保留的紅/橘只用於錯誤、超重、即將過期等語意。

## 手機截圖驗證

使用 Playwright 或等效瀏覽器檢查下列 viewport：

- 375x812
- 390x844
- 430x932

必看路徑：

- `/`：航班卡片、旅行天數、航班詳情表單、重量 vs 限額。
- `/overview` 或相容的新打包清單路徑：頁面標題、行李展開、空行李箱新增物品入口、重量條。
- `/items`：行李 selector、拍照入口、AI 表單、物品卡片縮圖。
- `/outfits`：統計區、上衣/下裝矩陣、選取與取消選取。
- `/luggages`：行李卡片、重量圖表、重量輸入、空狀態。

通過標準：

- 無水平捲動。
- 文字不重疊、不被 icon 或卡片邊界遮擋。
- 主要 CTA 在手機上可觸控，且不被底部導覽遮住。
- 旅行天數卡片在長目的地、長航空公司名稱下仍可讀。

## 桌機截圖驗證

使用 1440x1000 viewport 檢查：

- `/`
- 打包清單頁
- `/items`
- `/outfits`
- `/luggages`

通過標準：

- 版面維持原本 Claude-style 的暖色與 editorial 層級。
- 卡片不過度放大，不像 landing page。
- 資訊密度足以支援反覆操作。

## 功能驗證

### 打包清單

- 從底部導覽可以直接找到「打包清單」。
- 從 Dashboard CTA 可以進入打包清單。
- 展開空行李箱時可以點「新增物品」，且新增後物品自動歸入該行李箱。

### 航班詳情

- 只填目的地、航空公司、出發日期時可以儲存並顯示。
- 填航班編號、起飛/降落時間、機場/城市、航站樓時，Dashboard 與打包清單頁都能顯示。
- 填回程資訊時能在同張航班卡片或清楚的回程區塊顯示。
- 舊資料不含新欄位時不報錯、不顯示空 label。

### 搭配統計

- 頁面只保留一個總搭配數，不再重複「共 X 套」。
- 選取上衣後，下裝高亮/取消高亮仍正常。
- 取消選取後矩陣回到初始狀態。

### AI 物品照片

- 拍照後不等待去背即可進入 AI 辨識/確認表單。
- AI 失敗時仍保留照片與可編輯表單。
- 雜亂背景照片在物品庫與搭配統計卡片中不破版。

### 重量圖表

- 無重量紀錄顯示空狀態。
- 單筆紀錄不破圖。
- 多筆紀錄顯示趨勢、最新值、變化量。

## 使用者驗收

- 使用者能在手機上從「建立/選擇行李箱 → 拍照新增物品 → 回到打包清單確認」順跑。
- 使用者能看懂航班來回資訊與行李限制。
- 使用者確認整體視覺回到最初 Claude-style，而不是 Cursor hybrid。

## 發布檢查

發布只在使用者確認預覽後執行：

- `git status --short --branch` 確認只包含本階段預期修改。
- `git add` / `git commit` 使用單一清楚 commit message。
- `git push origin main`
- Vercel 部署成功後回報可測試 URL。
