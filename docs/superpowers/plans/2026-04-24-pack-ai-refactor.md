# Pack AI 核心模組重構實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重構 Pack AI 的三大核心模組：擴充衣物 Metadata、實作矩陣式穿搭統計、以及導入精靈引導式的打包 Planner Flow。

**Architecture:** 
- 前端使用 React (Vite) + Tailwind CSS。
- 狀態與本地資料儲存維持使用 Dexie.js (IndexedDB)。
- AI 服務統一透過 `netlify/functions/analyze.ts` 代理呼叫 Gemini API。
- 移除 `react-xarrows`，改以純 CSS 高亮與格狀排版實作穿搭連連看。

**Tech Stack:** React 19, Tailwind CSS v4, Dexie.js, Lucide React, Google Generative AI (Gemini)

---

## Task 1: 擴充 Dexie.js 資料庫 Schema (Inventory Metadata)

**Files:**
- Modify: `src/db/index.ts`

- [ ] **Step 1: 更新 `Item` interface 與 DB Schema**
  在 `Item` interface 中加入新的 Metadata 欄位：`color`, `occasion`, `wrinkleProne`, `tempRange`。
  同時在 Dexie Table 定義中加入這些可被索引的欄位。

```typescript
// in src/db/index.ts
export interface Item {
  id: string;
  luggageId: string;
  name: string;
  category: '衣物' | '器材' | '保养品' | '其他';
  subCategory?: '上衣' | '下装' | '连身裙' | '鞋子' | '配饰' | '外套' | '内搭' | '袜子' | '内衣' | '内裤';
  season: '冬季' | '夏季' | '通用';
  expirationDate?: string;
  condition: '新' | '旧' | '快用完';
  isDiscardable: boolean;
  notes?: string;
  createdAt: number;
  image?: string;
  // 新增欄位
  color?: string;
  occasion?: '商務' | '休閒' | '運動' | '正式';
  wrinkleProne?: '易皺' | '適中' | '抗皺';
  tempRange?: string; // e.g. "15-25°C"
}

// Update DB schema
export class MyDatabase extends Dexie {
  // ...
  constructor() {
    super('pack_ai_db');
    this.version(2).stores({
      luggages: 'id, name, type',
      items: 'id, luggageId, category, season, occasion, wrinkleProne', // 加入新欄位索引
      flights: 'id',
      outfit_matches: 'id, topItemId, bottomItemId',
      user_configs: 'id',
    });
  }
}
```

- [ ] **Step 2: Commit**
```bash
git add src/db/index.ts
git commit -m "feat(db): 擴充 Item schema 以支援更詳細的衣物 Metadata"
```

---

## Task 2: 更新 AI 圖片辨識 Prompt 與資料解析

**Files:**
- Modify: `src/services/ai.ts`

- [ ] **Step 1: 修改 `analyzeItemWithAI` 函式**
  更新 prompt 以要求 AI 輸出新定義的 JSON Schema。

```typescript
// in src/services/ai.ts
export const analyzeItemWithAI = async (name: string, base64Image?: string) => {
  const prompt = `作为一个行李收纳助手，请根据用户提供的物品名称${base64Image ? '或图片' : ''} "${name}"，自动推断出其分类和建议。
请严格返回以下格式的JSON：
{
  "name": "修正后的物品名称，比如根据图片补充颜色款式",
  "category": "衣物 | 器材 | 保养品 | 其他",
  "subCategory": "上衣 | 下装 | 连身裙 | 鞋子 | 配饰 | 外套 | 内搭 | 袜子 | 内衣 | 内裤",
  "season": "冬季 | 夏季 | 通用",
  "color": "主要颜色 (如: 黑色, 藏青色)",
  "occasion": "商務 | 休閒 | 運動 | 正式",
  "wrinkleProne": "易皺 | 適中 | 抗皺",
  "tempRange": "适合的温度区间 (如: 15-25°C)",
  "notes": "这件物品平常会在哪里出现、喜欢怎么穿搭的建议"
}
如果没有图片，请根据名称猜测；如果图片能看出颜色和款式，请在name里加上描述，并详细填写notes。
只返回纯JSON字符串，不要任何Markdown格式。`;

  // ... 保持原有 fetch 邏輯不變
```

- [ ] **Step 2: Commit**
```bash
git add src/services/ai.ts
git commit -m "feat(ai): 更新 analyzeItemWithAI 以要求輸出旅行實用派 Metadata"
```

---

## Task 3: 實作矩陣式穿搭統計 (Outfits 模組重構)

**Files:**
- Modify: `src/pages/Outfits.tsx`
- Modify: `package.json` (移除 react-xarrows)

- [ ] **Step 1: 移除 `react-xarrows` 依賴**
```bash
npm uninstall react-xarrows
```

- [ ] **Step 2: 重構 `Outfits.tsx` 介面與邏輯**
  實作上下兩排的矩陣佈局。點擊上衣時，計算並高亮關聯的下裝，並在卡片上顯示搭配統計數 (Versatility Score)。

```tsx
// 概念性程式碼結構 (需替換 Outfits.tsx 原有內容)
// ... imports
export const Outfits = () => {
  const items = useLiveQuery(() => db.items.toArray()) || [];
  const matches = useLiveQuery(() => db.outfit_matches.toArray()) || [];
  
  const [selectedTopId, setSelectedTopId] = useState<string | null>(null);

  // 取得單品的搭配數
  const getMatchCount = (itemId: string, isTop: boolean) => {
    return matches.filter(m => isTop ? m.topItemId === itemId : m.bottomItemId === itemId).length;
  };

  const handleTopClick = (id: string) => {
    setSelectedTopId(selectedTopId === id ? null : id);
  };

  const handleBottomClick = async (bottomId: string) => {
    if (!selectedTopId) return;
    const exists = matches.find(m => m.topItemId === selectedTopId && m.bottomItemId === bottomId);
    if (exists) {
      await db.outfit_matches.delete(exists.id);
    } else {
      await db.outfit_matches.add({ id: uuidv4(), topItemId: selectedTopId, bottomItemId: bottomId, createdAt: Date.now() });
    }
  };

  // Render 邏輯：
  // 1. 上衣區：顯示 getMatchCount。選中時套用 ring-blue-500。
  // 2. 下裝區：如果 selectedTopId 存在，檢查是否有 match。有 match 則高亮，無 match 則半透明。
  // 點擊下裝即可 toggle match。
}
```

- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json src/pages/Outfits.tsx
git commit -m "refactor(outfits): 移除 xarrows，改為矩陣式排版與搭配統計顯示"
```

---

## Task 4: 實作精靈引導打包 Planner Flow (Dashboard 重構)

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/i18n.ts` (新增 Planner 相關文案)

- [ ] **Step 1: 新增 Planner 狀態與介面結構**
  在 `Dashboard.tsx` 中引入步驟狀態管理：`step: 'context' | 'ai-plan' | 'checklist'`。

```tsx
// in Dashboard.tsx
const [plannerStep, setPlannerStep] = useState<'context' | 'ai-plan' | 'checklist'>('context');
const [aiChecklist, setAiChecklist] = useState<any[]>([]); // 儲存 AI 建議的清單

// 渲染階段 1: 行程確認 (Context)
// 顯示即將到來的航班資訊。
// 提供兩個按鈕：「讓 AI 幫我規劃清單」、「我自己手動打包」

// 渲染階段 2: AI 建議與清單生成 (AI Plan - Multi-Agent Pipeline)
// 1. 呼叫 Data Extraction Agent 解析行程
// 2. 呼叫 Outfit Planner Agent 生成穿搭 (傳入天氣與衣物 Metadata)
// 3. 呼叫 Packing & Optimization Agent 生成最終清單與建議捨棄清單
// 顯示 AI 回傳的「建議攜帶」與「建議捨棄」清單（帶有 Checkbox 讓使用者微調）。
// 提供「確認並開始打包」按鈕。

// 渲染階段 3: 落地打包執行 (Checklist)
// 類似 travel-packing-list。
// 顯示所有需要帶的物品，分為 Packed 與 Unpacked 兩區塊。
// 點擊物品即切換狀態，並即時更新頂部進度條 (e.g. 8/15)。
```

- [ ] **Step 2: 實作打包狀態追蹤**
  在 `Item` schema 中可能需要一個臨時或持久化的欄位來追蹤打包狀態。由於這是一次性的行為，可以先將 `packedItems` 的 ID 陣列存在 `Dashboard` 的 component state 中，或存入 localStorage。

```tsx
const [packedItemIds, setPackedItemIds] = useState<string[]>([]);
```

- [ ] **Step 3: Commit**
```bash
git add src/pages/Dashboard.tsx src/i18n.ts
git commit -m "feat(dashboard): 實作精靈引導打包 Planner Flow (Context -> AI Plan -> Checklist)"
```