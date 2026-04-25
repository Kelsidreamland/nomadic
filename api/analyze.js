import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // CORS 處理
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { action, payload, prompt, imageBase64, text } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: Missing Gemini API Key' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 處理多層次 Agent 工作流
    if (action === 'agent_pipeline') {
      const jsonModel = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });

      const { flightInfo, weatherInfo, wardrobeItems, userNotes } = payload;

      // Stage 1
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
      const stage1DataText = stage1Result.response.text();
      let stage1Data;
      try {
        stage1Data = JSON.parse(stage1DataText);
      } catch (e) {
        const jsonMatch = stage1DataText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        stage1Data = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(stage1DataText.replace(/```json\n?|\n?```/g, '').trim());
      }

      // Stage 2
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
      const stage2DataText = stage2Result.response.text();
      let stage2Data;
      try {
        stage2Data = JSON.parse(stage2DataText);
      } catch (e) {
        const jsonMatch = stage2DataText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        stage2Data = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(stage2DataText.replace(/```json\n?|\n?```/g, '').trim());
      }

      // Stage 3
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
      const stage3DataText = stage3Result.response.text();
      let stage3Data;
      try {
        stage3Data = JSON.parse(stage3DataText);
      } catch (e) {
        const jsonMatch = stage3DataText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        stage3Data = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(stage3DataText.replace(/```json\n?|\n?```/g, '').trim());
      }

      return res.status(200).json({
        result: {
          context: stage1Data,
          outfits: stage2Data.outfit_combinations || [],
          usage: stage2Data.item_usage_counts || {},
          optimization: stage3Data
        }
      });
    }

    // 處理單次圖片解析 (機票 / 物品圖片)
    if (imageBase64) {
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

      const result = await model.generateContent([prompt, ...imageParts]);
      return res.status(200).json({ result: result.response.text() });
    }

    // 處理純文字/Gmail解析
    if (text) {
      const result = await model.generateContent([prompt, text]);
      return res.status(200).json({ result: result.response.text() });
    }

    // 處理一般對話
    if (prompt) {
      const result = await model.generateContent(prompt);
      return res.status(200).json({ result: result.response.text() });
    }

    return res.status(400).json({ error: 'Invalid request: missing action or prompt' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}