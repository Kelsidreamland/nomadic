# Phase 8 — Claude 風格回正與手機流程修復

## 目標

- 將最近新增或改動的頁面重新對齊原本 Claude-style 視覺規範：暖色品牌色、editorial serif 標題、乾淨留白、柔和邊框、低飽和狀態色。
- 修復手機實測中阻塞使用者理解或操作的問題：打包清單入口不明、航班資訊不足、旅行天數卡片破版、搭配統計重複、AI 衣物卡片照片質感、整體 RWD。
- 保持拍照辨識流程速度優先；圖片美化改成可選的事後編輯，不進入必經儲存路徑。
- Phase 7 重量圖表納入本次視覺回正；原本的飛行軌跡地圖延後到核心手機流程穩定後再做。

## 現況事實

- `src/index.css` 已有核心品牌 token：sand、espresso、terracotta、olive、cream、stone，以及 DM Sans / Playfair Display。
- `src/pages/Overview.tsx` 目前是實際的打包清單/行李物品總覽，但 `src/i18n.ts` 與 `src/components/Layout.tsx` 顯示為「總覽 / Overview」。
- `src/db/index.ts` 的 `Flight` 目前只有 `departureDate`、`destination`、`airline`、三種行李額度與 `rawEmailId`。
- `src/pages/Dashboard.tsx` 與 `src/pages/Overview.tsx` 都有旅行天數卡片，手機窄版容易因橫向 flex 與 badge 擠壓而跑版。
- `src/pages/Outfits.tsx` 同時在頁首與統計 grid 顯示 `matches.length` 的「共 X 套」。
- `src/pages/Items.tsx` 的 `createStickerPreview()` 是快速 canvas 貼紙化，沒有去背；這符合速度優先，但需要後續可選美化路徑。
- `src/components/LuggageWeightChart.tsx` 已完成 Phase 7 的重量趨勢，但需要跟本次 Claude-style 視覺一起收斂。

## 設計基準

- 保留原始 App 的暖色紙張感：`brand-sand` 作背景、`brand-cream` 作卡面、`brand-espresso` 作主文字與主 CTA。
- 強調功能工具感，但不走 Cursor 深色、霓虹、藍綠高彩狀態色。
- 卡片可使用圓角，但避免新頁面越做越像遊戲面板；資訊密度要比 landing page 更高，手機上可掃描。
- 狀態色只在必要處使用，優先用 terracotta / olive 的低透明度背景；錯誤才用紅色。
- 導覽與頁面命名要直接反映任務，而不是抽象分類。

## 切片

### Slice 1 — 視覺基準與共用回正

- 檔案：`src/index.css`、`src/components/Layout.tsx`，必要時 touch 主要頁面 className。
- 內容：
  - 將新頁面中漂移的 blue/green/yellow 狀態色收斂到既有品牌色。
  - 統一卡片、badge、主/次 CTA、空狀態與手機底部導覽的視覺規格。
  - 保留原本 Nomadic logo 與暖色品牌，不導入 Cursor hybrid 的視覺語彙。
- 驗證：
  - 人工掃描 `rg "bg-blue|text-blue|bg-green|text-green|yellow|orange|red-" src/pages src/components`，保留只有明確語意的警告/錯誤色。
  - 桌機與手機截圖確認整體回到暖色 Claude-style。
- 完成條件：
  - 新增頁面與舊頁面看起來是同一套產品，而不是不同實驗版本。

### Slice 2 — 打包清單入口與命名修復

- 檔案：`src/i18n.ts`、`src/components/Layout.tsx`、`src/pages/Overview.tsx`、`src/pages/Dashboard.tsx`、必要時 `src/App.tsx`。
- 內容：
  - 將目前 `/overview` 的使用者可見名稱改成「打包清單 / Packing List」。
  - 視情況保留 `/overview` 路由相容，但導覽、頁面標題、Dashboard CTA 都要明確指向打包清單。
  - 在每個行李箱展開後提供清楚的「新增物品」動作，延續 active luggage 自動歸檔。
- 驗證：
  - 手機底部導覽可直接看到「打包清單」。
  - 從首頁 CTA、行李箱、空行李箱都能自然進入新增物品。
- 完成條件：
  - 使用者不會再覺得打包清單消失。

### Slice 3 — 航班詳情資料模型與表單

- 檔案：`src/db/index.ts`、`src/pages/Dashboard.tsx`、`src/pages/Overview.tsx`、`src/services/ai.ts`、`src/i18n.ts`。
- 內容：
  - 擴充 `Flight` optional 欄位：`flightNumber`、`departureTime`、`arrivalTime`、`departureAirport`、`arrivalAirport`、`departureTerminal`、`arrivalTerminal`。
  - 新增回程 optional 結構或欄位：`returnFlightNumber`、`returnDepartureDate`、`returnDepartureTime`、`returnArrivalTime`、`returnDepartureAirport`、`returnArrivalAirport`、`returnDepartureTerminal`、`returnArrivalTerminal`。
  - 更新手動航班表單與航班顯示卡；必要欄位仍保持低門檻，只要求目的地與出發日期。
  - AI 解析機票的 schema 也同步認得新欄位，但上傳 PDF/截圖真正解析可獨立排在後續。
- 驗證：
  - 新舊 IndexedDB 航班資料都能正常顯示。
  - 只填舊欄位時 UI 不出現空白破版；填完整欄位時能看到起降時間、地點、航站樓、航班編號與回程。
- 完成條件：
  - 航班卡片能承載一次完整來回資訊，但手動新增仍快速。

### Slice 4 — 旅行天數卡片與手機 RWD 修復

- 檔案：`src/pages/Dashboard.tsx`、`src/pages/Overview.tsx`、`src/components/Layout.tsx`。
- 內容：
  - 將天數、目的地、航班 metadata 改為手機優先排版：避免固定橫向 space、過長 badge、目的地/日期擠壓。
  - 調整頁首、底部 nav、CTA、表單 grid，使 375px 寬度不溢出、不重疊。
  - 將長文案與按鈕文字允許換行或縮短，不用 viewport font scaling。
- 驗證：
  - Playwright 以 375x812、390x844、430x932、1440x1000 截圖檢查 `/`、打包清單、物品庫、搭配統計、行李空間。
- 完成條件：
  - 手機瀏覽器上沒有卡片破版、文字重疊、水平捲動。

### Slice 5 — 搭配統計頁簡化與品牌化

- 檔案：`src/pages/Outfits.tsx`、`src/i18n.ts`。
- 內容：
  - 移除頁首或統計 grid 其中一個 `matches.length` 顯示，避免「共 X 套」重複。
  - 將高彩 blue/green badge 改成品牌色低飽和樣式。
  - 保留連連看矩陣操作，但讓選取、高亮、空狀態更像原始 Nomadic App。
- 驗證：
  - 建立多筆搭配後，只保留一個總搭配數入口。
  - 選取上衣、切換下裝、取消選取的互動仍正常。
- 完成條件：
  - 功能可讀，視覺不再偏離 Claude-style。

### Slice 6 — AI 衣物卡片圖片策略

- 檔案：`src/pages/Items.tsx`、必要時新增 `src/components/ItemImageEditor.tsx`、`src/i18n.ts`。
- 內容：
  - 保留現在的快速拍照、快速辨識、快速儲存流程。
  - 第一階段只優化卡片呈現：讓原始照片用更穩定的 object-fit、柔和底色、裁切比例與陰影，背景雜亂時也不至於難看。
  - 規劃一個可選「編輯圖片 / 裁切成貼紙」入口，先用本機 canvas crop/rotate/zoom/背景淡化，不把去背放到必經路徑。
  - 真正 AI 去背或分割列為後續 on-demand 功能；需要成本、延遲與裝置效能評估後再做。
- 驗證：
  - 拍照後仍能立即看到預覽與 AI 表單。
  - 使用雜亂背景照片時，卡片縮圖在物品庫與搭配統計都不破壞版面。
- 完成條件：
  - 快速流程不變慢；圖片質感先提升，重型去背不綁在上傳當下。

### Slice 7 — Phase 7 重量圖表視覺收斂

- 檔案：`src/components/LuggageWeightChart.tsx`、`src/pages/Luggages.tsx`、`src/i18n.ts`。
- 內容：
  - 將圖表與行李卡片的資訊層級收斂，不讓趨勢圖喧賓奪主。
  - 手機上圖表高度、三個統計小格與重量輸入區要穩定。
  - 顏色回到 espresso/terracotta/olive 的柔和組合。
- 驗證：
  - 無重量、單筆重量、多筆重量三種狀態截圖。
  - 手機行李卡片不因圖表造成過長或擠壓。
- 完成條件：
  - Phase 7 功能保留，視覺與整體 App 一致。

### Slice 8 — 最終 RWD/部署檢查

- 檔案：不限定，限於本階段修改範圍。
- 內容：
  - 跑型別、測試、build。
  - 建立手機/桌機截圖作為設計審查素材。
  - 若使用者確認畫面，才提交、推送、部署。
- 驗證：
  - `./node_modules/.bin/tsc --noEmit`
  - `./node_modules/.bin/vitest run src/services/ai.test.ts`
  - `npm run build`
  - Playwright 截圖與基本互動檢查。
- 完成條件：
  - 本地驗證通過、截圖可審、工作樹可提交。

## 暫緩項目

- 飛行軌跡地圖不在本階段直接做。原因是目前使用者手機流程仍有命名、航班資料、RWD、圖片卡片質感問題；地圖屬於展示/增強功能，應在核心流程穩定後接續。
- 上傳機票 PDF/截圖自動解析可先更新 schema，但完整解析流程另排一個 AI 文件解析階段。
- AI 自動去背不進入拍照必經流程；先做可選事後編輯，避免 15 分鐘整理一箱行李的核心效率被拖慢。
