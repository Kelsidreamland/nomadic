import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { imageBase64, text, prompt, action, payload } = body;

    // 從 Netlify 的環境變數讀取 API Key
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'API Key not configured on server' }) 
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 處理多層次 Agent 工作流
    if (action === 'agent_pipeline') {
      const jsonModel = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });

      const { flightInfo, weatherInfo, wardrobeItems, userNotes } = payload;

      // 階段 1：行程解析 (Data Extraction)
      const stage1Prompt = `
# 系統任務：行程解析 Agent
你是一個旅行資料分析師。請分析以下使用者的行程資訊，並輸出純 JSON：
{
  "flight_rules": { "carry_on_kg": 7, "checked_kg": 20, "summary": "簡短規定說明" },
  "weather_forecast": "天氣摘要",
  "trip_context": "行程情境與天數摘要"
}

輸入資料：
- 航班：${JSON.stringify(flightInfo)}
- 天氣：${JSON.stringify(weatherInfo)}
      `;
      const stage1Result = await jsonModel.generateContent(stage1Prompt);
      const stage1Text = stage1Result.response.text();
      const stage1Data = JSON.parse(stage1Text.replace(/```json\n?|\n?```/g, '').trim());

      // 階段 2：穿搭決策 (Outfit Planner)
      const stage2Prompt = `
# 系統任務：穿搭決策 Agent
你是一位時尚造型師。請根據以下【行程情境】與使用者的【衣物庫存資料 (含連連看百搭權重)】，為每天規劃穿搭。
優先選擇「百搭權重高」的單品，並確保材質符合天氣。
輸出純 JSON 格式的穿搭清單：
{
  "outfit_combinations": [
    { "top": "衣物ID", "bottom": "衣物ID", "scenario": "適合第一天的商務會議" }
  ],
  "item_usage_counts": { "衣物ID": 預計穿著次數 }
}

輸入資料：
- 行程情境：${JSON.stringify(stage1Data.trip_context)}
- 天氣預測：${JSON.stringify(stage1Data.weather_forecast)}
- 衣物庫存：${JSON.stringify(wardrobeItems)}
      `;
      const stage2Result = await jsonModel.generateContent(stage2Prompt);
      const stage2Text = stage2Result.response.text();
      const stage2Data = JSON.parse(stage2Text.replace(/```json\n?|\n?```/g, '').trim());

      // 階段 3：行李優化 (Packing & Optimization)
      const stage3Prompt = `
# 系統任務：行李優化 Agent
你是一位精打細算的打包管家。請根據【階段2的穿搭清單】與【階段1的行李限額】，執行以下檢查：
1. 總重量是否超標？
2. 庫存中的「可拋棄式物品（如免洗褲）」數量是否足夠天數？
請輸出純 JSON 格式的最終報告：
{
  "weight_status": "Safe" | "Warning" | "Overweight",
  "luggage_analysis": "整體行李額度的簡短分析報告",
  "remove_suggestions": [
    { "item_id": "衣物ID", "reason": "說明為何建議不帶（例如：只能搭配一套，且當地天氣不適合）" }
  ],
  "packing_advice": ["打包技巧或備品補充建議清單"]
}

輸入資料：
- 行李限額：${JSON.stringify(stage1Data.flight_rules)}
- 穿搭計畫：${JSON.stringify(stage2Data)}
- 原始衣物：${JSON.stringify(wardrobeItems)}
- 使用者備註：${userNotes || '無'}
      `;
      const stage3Result = await jsonModel.generateContent(stage3Prompt);
      const stage3Text = stage3Result.response.text();
      const stage3Data = JSON.parse(stage3Text.replace(/```json\n?|\n?```/g, '').trim());

      // 組合三個階段的結果回傳給前端
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          result: {
            context: stage1Data,
            outfits: stage2Data.outfit_combinations,
            usage: stage2Data.item_usage_counts,
            optimization: stage3Data
          }
        })
      };
    }

    let result;
    if (imageBase64) {
      // 處理圖片分析
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      const mimeType = imageBase64.includes('png') ? 'image/png' : 'image/jpeg';
      
      const imageParts = [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
      ];
      result = await model.generateContent([prompt, ...imageParts]);
    } else if (text) {
      // 處理純文字分析 (Gmail/Calendar)
      result = await model.generateContent([prompt, text]);
    } else if (prompt) {
      // 處理只有 prompt 的情況
      result = await model.generateContent(prompt);
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'No image, text or prompt provided' }) };
    }

    const responseText = result.response.text();
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: responseText })
    };
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }) 
    };
  }
};
