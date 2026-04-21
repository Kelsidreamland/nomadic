# Nomadic: Minimalist Luggage Manager

Nomadic 是一個專為數字遊牧 (Digital Nomads)、旅居者與極簡主義者設計的「行李與物品管理」Web App。
它幫助您在跨國移動時，精準控管每個行李箱的尺寸與重量、有效管理衣櫥與裝備，並透過 AI 智能建議打造完美的膠囊衣櫥。

## 🌟 核心功能 (Core Features)

1. **📦 行李空間管理 (Luggage Space Management)**
   - 記錄托運行李、手提行李、隨身物品的長寬高尺寸。
   - 手動記錄每次飛行前的重量歷史，隨時對比航空公司的限額。
   - 支援冬季/夏季行李的快速切換與篩選。

2. **👕 智能物品庫 (Smart Inventory)**
   - 分類管理：衣物（上衣、下裝、外套、內衣等）、器材、保養品、其他。
   - **📸 AI 圖片辨識填寫：** 上傳衣物或裝備照片，系統透過 Gemini Vision 自動為您判斷分類、填寫名稱與建議備註。
   - 記錄物品狀態（新購入、舊物、快用完）與過期日提醒。

3. **✨ 視覺化智能穿搭 (Visual Outfits & Capsule Wardrobe)**
   - **連連看風格：** 視覺化點擊上衣與下裝，快速建立穿搭組合。
   - 雜誌剪貼風格：上傳的圖片會自動套用立體剪貼效果。
   - **🤖 Gemini 穿搭點評：** AI 會根據您連線的衣服給出時尚建議，並在最後幫您「做減法」，告訴您哪些百搭單品該帶，哪些該果斷捨棄。

4. **✈️ 行前智能分析與機票解析 (Pre-flight Analysis & Ticket Parsing)**
   - 儀表板會統計所有行李箱的總重與分類重量。
   - **機票截圖解析：** 上傳電子機票截圖，AI 自動抓取目的地、出發日期與各項行李重量限額。
   - 根據即將到來的航班、目的地與您的物品清單，AI 會給出：
     - **減重與丟棄建議**
     - **行前補給建議**
     - **分潤好物推薦 (廣告預留版位)**

5. **⚙️ BYOK (Bring Your Own Key) 與本地 AI 支援**
   - 支援填入免費的 Google Gemini API Key。
   - **🌐 零成本本地 AI：** 支援 Google Chrome 最新的 `window.ai` 本地大模型推理，完全離線且免費，注重隱私。

## 🛠️ 技術架構 (Tech Stack)

* **前端框架:** React 19 + Vite + TypeScript
* **樣式與 UI:** Tailwind CSS v4 + Lucide Icons + `clsx`
* **狀態管理:** Zustand
* **多語系 (i18n):** `react-i18next` (預設繁體中文，支援英文切換)
* **本地資料庫:** Dexie.js (IndexedDB wrapper) - 離線優先架構 (Offline-first)
* **連線視覺化:** `react-xarrows`
* **AI 串接:** `@google/generative-ai` (Gemini 1.5 Flash)

## 🚀 開發與部署 (Development & Deployment)

```bash
# 安裝依賴
npm install

# 啟動本地開發伺服器
npm run dev

# 建立正式環境檔案
npm run build
```

### 部署策略 (Deployment Strategy)

本專案採用 **Offline-first** 架構，資料預設儲存在使用者的瀏覽器 IndexedDB 中。
因此推薦使用 **Cloudflare Pages** 進行純靜態前端部署：

1. 將程式碼推送到 GitHub。
2. 在 Cloudflare Pages 連結 GitHub 倉庫。
3. 構建指令 (Build command): `npm run build`
4. 輸出目錄 (Build output directory): `dist`
5. （可選）在 Cloudflare 後台綁定您在 Namecheap 購買的自訂網域 (Custom Domain)。