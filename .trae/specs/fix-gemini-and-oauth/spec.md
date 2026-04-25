# 修復 Gemini API 與 Google OAuth 同步功能 Spec

## 為什麼 (Why)
1. **Gemini API 報錯 (404 Not Found)**: 根據 GitHub 上的相關 Issue 討論與 Google 官方更新，`gemini-1.5-flash` 模型已經在近期被棄用或是在此 API 版本 (`v1beta`) 中不再支援 `generateContent` 方法。目前最新的推薦替代模型為 `gemini-2.5-flash`。
2. **Google 同步功能報錯 (400 redirect_uri_mismatch)**: 這是因為目前專案運行在 Trae 提供的一個隨機生成的沙盒網址 (`*.agent-sandbox-my-c1-gw.trae.ai`)。Google OAuth 基於安全考量，拒絕了未在 Google Cloud Console 中登記的「已授權的 JavaScript 來源」與「已授權的重新導向 URI」。

## 變更內容 (What Changes)
- 全面將 `src/services/ai.ts` 中使用的 `gemini-1.5-flash` 更新為 `gemini-2.5-flash` 模型。
- 在 `src/pages/Dashboard.tsx` 處理 Google 登入失敗的邏輯中，針對 `redirect_uri_mismatch` 錯誤新增友善的 UI 提示，引導使用者將目前的預覽網址加入到 Google Cloud Console 的授權清單中，或是建議他們在本地端 (`localhost:5173`) 運行。

## 影響範圍 (Impact)
- 影響功能: AI 行程規劃、物品自動解析、穿搭點評、Gmail/Calendar 航班同步
- 影響程式碼: `src/services/ai.ts`, `src/pages/Dashboard.tsx`

## 新增需求 (ADDED Requirements)
### 需求: 升級 Gemini 模型
系統必須使用 `gemini-2.5-flash` 取代舊版模型，以確保 AI 解析流程能正常運作。

### 需求: OAuth 環境指引
當使用者在雲端沙盒環境下遇到 OAuth 400 錯誤時，系統應提供明確的解決方案說明，告知他們必須去 GCP 後台新增目前的預覽網址作為白名單。
