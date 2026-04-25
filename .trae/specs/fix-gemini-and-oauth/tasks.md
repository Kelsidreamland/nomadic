# 任務列表 (Tasks)

- [x] Task 1: 升級 Gemini 模型版本
  - 將 `src/services/ai.ts` 中所有的 `gemini-1.5-flash` 替換為 `gemini-2.5-flash`。
- [x] Task 2: 處理 Google OAuth `redirect_uri_mismatch` 錯誤提示
  - 修改 `src/pages/Dashboard.tsx` 的 `onError` 處理函式，如果登入失敗，顯示一個友善的 alert 或對話框，說明是因為目前在「預覽沙盒網址」所導致的限制。
  - 提供具體的解決方案提示：請至 Google Cloud Console 將當前網址加入「已授權的 JavaScript 來源」與「重新導向 URI」，或建議透過 GitHub 同步到本地端使用 `localhost:5173` 測試。

# 任務相依性 (Task Dependencies)
- 兩項任務彼此獨立，可以同時進行。
