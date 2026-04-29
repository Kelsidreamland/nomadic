import { db } from '../db';
import { AIRLINE_RULES } from '../data/airlines';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const checkLocalAIAvailability = () => {
  return 'ai' in window && typeof (window as any).ai !== 'undefined';
};

const getGeminiClient = async () => {
  // Always prioritize the backend function in production to hide the key
  if (import.meta.env.PROD) {
    // Return a proxy object that routes generateContent to our Netlify Function
    return {
      getGenerativeModel: ({ model: _model }: any) => ({
        generateContent: async (promptOrParts: any) => {
          let prompt = promptOrParts;
          let imageBase64 = undefined;
          
          // Handle array of parts (for images)
          if (Array.isArray(promptOrParts)) {
            prompt = promptOrParts.find(p => typeof p === 'string');
            const inlineData = promptOrParts.find(p => p.inlineData)?.inlineData;
            if (inlineData) {
              imageBase64 = `data:${inlineData.mimeType};base64,${inlineData.data}`;
            }
          }
          
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              prompt,
              imageBase64,
              text: typeof promptOrParts === 'string' && promptOrParts.includes('--- Gmail') ? promptOrParts : undefined
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Backend AI API Error');
          }
          
          const data = await response.json();
          return {
            response: {
              text: () => data.result
            }
          };
        }
      })
    } as unknown as GoogleGenerativeAI;
  }

  // Local development: Try to get it from environment variables
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) {
    return new GoogleGenerativeAI(envKey);
  }

  // Fallback to IndexedDB config
  const configs = await db.user_configs.toArray();
  const config = configs[0];
  if (!config || !config.geminiApiKey) {
    throw new Error('未配置 Gemini API Key');
  }
  return new GoogleGenerativeAI(config.geminiApiKey);
};

const extractJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('無法解析 AI 回傳的 JSON');
  }
};

const normalizeItemAnalysis = (value: any) => {
  const categoryMap: Record<string, string> = {
    保养品: '保養品',
    盥洗: '保養品',
    電子: '器材',
    电子: '器材',
  };
  const subCategoryMap: Record<string, string> = {
    下装: '下裝',
    连身裙: '連身裙',
    配饰: '配飾',
    内搭: '內搭',
    袜子: '襪子',
    内衣: '內衣',
    内裤: '內褲',
  };
  const allowedCategories = ['衣物', '器材', '保養品', '其他'];
  const allowedSubCategories = ['上衣', '下裝', '連身裙', '鞋子', '配飾', '外套', '內搭', '襪子', '內衣', '內褲'];
  const category = categoryMap[value.category] || value.category;
  const subCategory = subCategoryMap[value.subCategory] || value.subCategory;

  return {
    ...value,
    category: allowedCategories.includes(category) ? category : '其他',
    subCategory: allowedSubCategories.includes(subCategory) ? subCategory : undefined,
  };
};

export const generateSmartInsights = async (contextData: any) => {
  // Always use the backend agent pipeline for this specific feature in production
  if (import.meta.env.PROD) {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'agent_pipeline',
          payload: {
            flightInfo: {
              destination: contextData.upcomingFlight?.destination || '未知',
              checked_kg: contextData.upcomingFlight?.checkedAllowance || 0,
              carry_on_kg: contextData.upcomingFlight?.carryOnAllowance || 7,
              days: 5
            },
            weatherInfo: {
              location: contextData.location || '全球',
              forecast: '目前缺乏詳細天氣 API，請根據地點猜測概略天氣'
            },
            wardrobeItems: contextData.items || [],
            userNotes: "請幫我做減法，盡量精簡行李"
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'AI Pipeline Execution Failed');
      }

      const data = await response.json();
      return data.result;
    } catch (e: any) {
      console.error('Failed to execute Agent Pipeline', e);
      throw new Error('AI Pipeline Execution Failed: ' + e.message);
    }
  }

  // Local development logic
  const genAI = await getGeminiClient();

  try {
    const jsonModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const flightInfo = {
      destination: contextData.upcomingFlight?.destination || '未知',
      checked_kg: contextData.upcomingFlight?.checkedAllowance || 0,
      carry_on_kg: contextData.upcomingFlight?.carryOnAllowance || 7,
      days: 5
    };
    const weatherInfo = {
      location: contextData.location || '全球',
      forecast: '目前缺乏詳細天氣 API，請根據地點猜測概略天氣'
    };
    const wardrobeItems = contextData.items || [];
    const userNotes = "請幫我做減法，盡量精簡行李";

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
    const stage1Data = extractJson(stage1Result.response.text());

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
    const stage2Data = extractJson(stage2Result.response.text());

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
    const stage3Data = extractJson(stage3Result.response.text());

    return {
      context: stage1Data,
      outfits: stage2Data.outfit_combinations || [],
      usage: stage2Data.item_usage_counts || {},
      optimization: stage3Data
    };
  } catch (e: any) {
    console.error('Failed to execute Agent Pipeline', e);
    throw new Error('AI Pipeline Execution Failed: ' + e.message);
  }
};

export const generateOutfitAdvice = async (topName: string, bottomName: string, destination: string) => {
  const genAI = await getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `使用者正在為前往 ${destination} 打包行李。使用者將上衣 "${topName}" 和下裝 "${bottomName}" 搭配在了一起。
請給出一句簡短的（20字以內）且有時尚感的點評，說明這套搭配是否適合當地氣候，或者還缺點什麼配飾。`;
  
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('Failed to generate outfit advice', err);
    throw new Error('AI 生成建議失敗');
  }
};

export const generatePackingDecision = async (items: any[], destination: string, days: number) => {
  const genAI = await getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `使用者有選擇困難症。Ta即將前往 ${destination} 待 ${days} 天。
以下是Ta的衣櫃（包含多件上衣、下裝等）。
請挑選出最少的衣物（膠囊衣櫥概念），使得它們能組合出至少 ${days} 套搭配。
告訴使用者具體應該帶哪些衣服，拋棄哪些衣服。
衣櫃清單：
${JSON.stringify(items, null, 2)}

請直接用一小段溫暖、時尚的語言告訴使用者最終決定。`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('Failed to generate packing decision', err);
    throw new Error('AI 幫你決定失敗');
  }
};

export const analyzeTicketWithAI = async (base64Image: string) => {
  const genAI = await getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const airlinesContext = AIRLINE_RULES.map(r => `- ${r.name}: 預設託運 ${r.defaultCheckedAllowance}kg, 手提 ${r.defaultCarryOnAllowance}kg`).join('\n');

  const prompt = `作為一個智能航班助手，請解析使用者提供的電子機票或行程單截圖。
請比對截圖中的行李額度和以下我們原生資料庫的各航司基礎行李規範：
${airlinesContext}

提取以下資訊，並嚴格返回JSON格式：
{
  "destination": "目的地城市名稱，例如：東京, 倫敦",
  "airline": "航空公司名稱",
  "departureDate": "出發日期，必須是 YYYY-MM-DD 格式",
  "checkedAllowance": "託運行李重量限額(kg)。優先使用截圖裡使用者購買的套餐額度，如果沒有提到請參考上面的基礎規範，否則填0",
  "carryOnAllowance": "手提行李重量限額(kg)。優先使用截圖，沒提到就參考基礎規範，否則通常是7",
  "personalAllowance": "隨身物品重量限額(kg)。優先使用截圖，沒提到就參考基礎規範，否則填0"
}
只返回純JSON字串，不要任何Markdown格式。`;

  try {
    const base64Data = base64Image.split(',')[1] || base64Image;
    const mimeType = base64Image.includes('png') ? 'image/png' : 'image/jpeg';
    
    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('AI Analysis failed:', error);
    throw new Error('航班截圖解析失敗');
  }
};

export const analyzeTextWithAI = async (text: string) => {
  const genAI = await getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const airlinesContext = AIRLINE_RULES.map(r => `- ${r.name}: 預設託運 ${r.defaultCheckedAllowance}kg, 手提 ${r.defaultCarryOnAllowance}kg`).join('\n');

  const prompt = `作為一個智能航班助手，請解析使用者提供的 Gmail 或 Calendar 行程資料（可能是多封信件或日曆事件的合併文本）。
找出其中【最接近未來的單趟行程或來回機票】，並比對以下我們原生資料庫的各航司基礎行李規範：
${airlinesContext}

提取以下資訊，並嚴格返回JSON格式：
{
  "destination": "目的地城市名稱，例如：東京, 倫敦",
  "airline": "航空公司名稱",
  "departureDate": "出發日期，必須是 YYYY-MM-DD 格式",
  "checkedAllowance": "託運行李重量限額(kg)。優先使用文本裡使用者購買的套餐額度，如果沒有提到請參考上面的基礎規範，否則填0",
  "carryOnAllowance": "手提行李重量限額(kg)。優先使用文本，沒提到就參考基礎規範，否則通常是7",
  "personalAllowance": "隨身物品重量限額(kg)。優先使用文本，沒提到就參考基礎規範，否則填0"
}
只返回純JSON字串，不要任何Markdown格式。如果文本中找不到機票資訊，請返回 {"noFlight": true, "reason": "找不到航班資訊"}，不要返回 error。`;

  try {
    const result = await model.generateContent([prompt, text]);
    const resultText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(resultText);

    if (parsed.error) {
      throw new Error(parsed.error);
    }

    // Handle no-flight case gracefully
    if (parsed.noFlight) {
      return { noFlight: true, reason: parsed.reason || '找不到航班資訊' };
    }

    return parsed;
  } catch (error) {
    console.error('AI Text Analysis failed:', error);
    const err = error as any;
    if (err.message?.includes('API')) {
      throw new Error(`AI API 錯誤: ${err.message}`);
    }
    if (err instanceof SyntaxError) {
      throw new Error(`AI 回傳格式錯誤`);
    }
    throw new Error(`航班文本解析失敗: ${err.message || '未知錯誤'}`);
  }
};

export const analyzeItemWithAI = async (name: string, base64Image?: string) => {
  const genAI = await getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `作為一個行李收納助手，請根據使用者提供的物品名稱${base64Image ? '或圖片' : ''} "${name}"，自動推斷出其分類和建議。
請嚴格返回以下格式的JSON：
{
  "name": "修正後的物品名稱，比如根據圖片補充顏色款式",
  "category": "衣物 | 器材 | 保養品 | 其他",
  "subCategory": "上衣 | 下裝 | 連身裙 | 鞋子 | 配飾 | 外套 | 內搭 | 襪子 | 內衣 | 內褲",
  "season": "冬季 | 夏季 | 通用",
  "color": "主要顏色 (如: 黑色, 藏青色)",
  "occasion": "商務 | 休閒 | 運動 | 正式 | 其他",
  "wrinkleProne": "易皺 | 適中 | 抗皺",
  "tempRange": "適合的溫度區間 (如: 15-25°C)",
  "notes": "這件物品平常會在哪裡出現、喜歡怎麼穿搭的建議"
}
如果沒有圖片，請根據名稱猜測；如果圖片能看出顏色和款式，請在name裡加上描述，並詳細填寫notes。
只返回純JSON字串，不要任何Markdown格式。`;

  try {
    let result;
    if (base64Image) {
      const base64Data = base64Image.split(',')[1] || base64Image;
      const mimeType = base64Image.includes('png') ? 'image/png' : 'image/jpeg';
      
      const imageParts = [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
      ];
      result = await model.generateContent([prompt, ...imageParts]);
    } else {
      result = await model.generateContent(prompt);
    }

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return normalizeItemAnalysis(JSON.parse(jsonMatch[0]));
    }
    return normalizeItemAnalysis(JSON.parse(responseText));
  } catch (err) {
    console.error('AI Auto-fill failed:', err);
    throw new Error('AI 物品解析失敗');
  }
};
