import { db } from '../db';
import { AIRLINE_RULES } from '../data/airlines';

export const checkLocalAIAvailability = () => {
  return 'ai' in window && typeof (window as any).ai !== 'undefined';
};

export const generateSmartInsights = async (contextData: any) => {
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
            days: 5 // Default for now
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

    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.result; // This now contains context, outfits, usage, and optimization
  } catch (e) {
    console.error('Failed to execute Agent Pipeline', e);
    return null;
  }
};

export const generateOutfitAdvice = async (topName: string, bottomName: string, destination: string) => {
  const prompt = `使用者正在為前往 ${destination} 打包行李。使用者將上衣 "${topName}" 和下裝 "${bottomName}" 搭配在了一起。
請給出一句簡短的（20字以內）且有時尚感的點評，說明這套搭配是否適合當地氣候，或者還缺點什麼配飾。`;
  
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();
    return data.result;
  } catch (err) {
    return '搭配很棒，記得帶上墨鏡！';
  }
};

export const generatePackingDecision = async (items: any[], destination: string, days: number) => {
  const prompt = `使用者有選擇困難症。Ta即將前往 ${destination} 待 ${days} 天。
以下是Ta的衣櫃（包含多件上衣、下裝等）。
請挑選出最少的衣物（膠囊衣櫥概念），使得它們能組合出至少 ${days} 套搭配。
告訴使用者具體應該帶哪些衣服，拋棄哪些衣服。
衣櫃清單：
${JSON.stringify(items, null, 2)}

請直接用一小段溫暖、時尚的語言告訴使用者最終決定。`;

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();
    return data.result;
  } catch (err) {
    return '你的衣服都很好看，建議帶上最百搭的3件上衣和2件下裝，足夠穿一周啦！';
  }
};

export const analyzeTicketWithAI = async (base64Image: string) => {
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
    // 改為呼叫我們的 Netlify Function (後端代理)
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Image, prompt })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze ticket');
    }

    const data = await response.json();
    const text = data.result.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('AI Analysis failed:', error);
    throw error;
  }
};

// 新增處理 Gmail / Calendar 純文字分析的 AI 功能
export const analyzeTextWithAI = async (text: string) => {
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
只返回純JSON字串，不要任何Markdown格式。如果文本中找不到機票資訊，請在 JSON 中拋出 error 屬性如 {"error": "找不到航班資訊"}。`;

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, prompt })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze text');
    }

    const data = await response.json();
    const resultText = data.result.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(resultText);
    
    if (parsed.error) {
      throw new Error(parsed.error);
    }
    
    return parsed;
  } catch (error) {
    console.error('AI Text Analysis failed:', error);
    throw error;
  }
};

export const analyzeItemWithAI = async (name: string, base64Image?: string) => {
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
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt,
        imageBase64: base64Image 
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze item');
    }

    const data = await response.json();
    const responseText = data.result;
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(responseText);
  } catch (err) {
    console.error('AI Auto-fill failed:', err);
    throw err;
  }
};
