import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db';

export const checkLocalAIAvailability = () => {
  return 'ai' in window && typeof (window as any).ai !== 'undefined';
};

const getGeminiClient = async () => {
  const configs = await db.user_configs.toArray();
  const config = configs[0];
  if (!config || !config.geminiApiKey) {
    throw new Error('未配置 Gemini API Key');
  }
  return new GoogleGenerativeAI(config.geminiApiKey);
};

export const generateSmartInsights = async (contextData: any) => {
  const configs = await db.user_configs.toArray();
  const config = configs[0];
  
  const prompt = `你是一个专门为数字游牧民设计的贴身行李管家AI。
请基于以下用户的行李数据、航班和定位信息，生成一份简短的洞察。
包含三个部分：1. 超重警告或旧物丢弃建议 2. 保养品补给建议 3. 推荐的Dropshipping商品或分润链接。
请返回JSON格式：{ "warnings": [], "restock": [], "ads": [{ "name": "商品名", "reason": "推荐理由", "link": "模拟的购买链接" }] }

上下文数据：
${JSON.stringify(contextData, null, 2)}`;

  try {
    const genAI = await getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // 尝试解析 JSON
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    return JSON.parse(responseText);
  } catch (e) {
    console.error('Failed to parse Gemini response', e);
    return { warnings: ['无法连接AI，请检查API Key设置。'], restock: [], ads: [] };
  }
};

export const generateOutfitAdvice = async (topName: string, bottomName: string, destination: string) => {
  const prompt = `用户正在为前往 ${destination} 打包行李。用户将上衣 "${topName}" 和下装 "${bottomName}" 搭配在了一起。
请给出一句简短的（20字以内）且有时尚感的点评，说明这套搭配是否适合当地气候，或者还缺点什么配饰。`;
  
  try {
    const genAI = await getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    return '搭配很棒，记得带上墨镜！';
  }
};

export const generatePackingDecision = async (items: any[], destination: string, days: number) => {
  const prompt = `用户有选择困难症。Ta即将前往 ${destination} 待 ${days} 天。
以下是Ta的衣柜（包含多件上衣、下装等）。
请挑选出最少的衣物（胶囊衣橱概念），使得它们能组合出至少 ${days} 套搭配。
告诉用户具体应该带哪些衣服，抛弃哪些衣服。
衣柜清单：
${JSON.stringify(items, null, 2)}

请直接用一小段温暖、时尚的语言告诉用户最终决定。`;

  try {
    const genAI = await getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    return '你的衣服都很好看，建议带上最百搭的3件上衣和2件下装，足够穿一周啦！';
  }
};

export const analyzeTicketWithAI = async (base64Image: string) => {
  const prompt = `作为一个智能航班助手，请解析用户提供的电子机票或行程单截图。
提取以下信息，并严格返回JSON格式：
{
  "destination": "目的地城市名称，例如：东京, 伦敦",
  "airline": "航空公司名称",
  "departureDate": "出发日期，必须是 YYYY-MM-DD 格式",
  "checkedAllowance": "托运行李重量限额(kg)，如果没有提到请填0",
  "carryOnAllowance": "手提行李重量限额(kg)，通常是7kg或10kg",
  "personalAllowance": "随身物品重量限额(kg)，如果没有提到请填0"
}
只返回纯JSON字符串，不要任何Markdown格式。`;

  try {
    const genAI = await getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const base64Data = base64Image.split(',')[1];
    const mimeType = base64Image.split(';')[0].split(':')[1];
    
    const parts: any[] = [
      { text: prompt },
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ];
    
    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(responseText);
  } catch (err) {
    console.error('AI Ticket parsing failed:', err);
    throw err;
  }
};

export const analyzeItemWithAI = async (name: string, base64Image?: string) => {
  const prompt = `作为一个行李收纳助手，请根据用户提供的物品名称${base64Image ? '或图片' : ''} "${name}"，自动推断出其分类和建议。
请严格返回以下格式的JSON：
{
  "name": "修正后的物品名称，比如根据图片补充颜色款式",
  "category": "衣物 | 器材 | 保养品 | 其他",
  "subCategory": "上衣 | 下装 | 连身裙 | 鞋子 | 配饰 | 外套 | 内搭 | 袜子 | 内衣 | 内裤",
  "season": "冬季 | 夏季 | 通用",
  "notes": "这件物品平常会在哪里出现、喜欢怎么穿搭，或者应该放进哪个行李箱的建议"
}
如果没有图片，请根据名称猜测；如果图片能看出颜色和款式，请在name里加上描述，并详细填写notes。
只返回纯JSON字符串，不要任何Markdown格式。`;

  try {
    const genAI = await getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const parts: any[] = [{ text: prompt }];
    if (base64Image) {
      // base64Image format: data:image/jpeg;base64,...
      const base64Data = base64Image.split(',')[1];
      const mimeType = base64Image.split(';')[0].split(':')[1];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }
    
    const result = await model.generateContent(parts);
    const responseText = result.response.text();
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
