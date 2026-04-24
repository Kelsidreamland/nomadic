import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { analyzeTextWithAI } from './ai';

// 呼叫 Gmail API 尋找機票信件
export const fetchGmailFlights = async (accessToken: string) => {
  try {
    console.log("Fetching Gmail flights with token...");
    
    // 1. 搜尋信件 (這裡只找最近一個月內，包含 ticket/flight/itinerary 的信件)
    const query = 'subject:(ticket OR flight OR itinerary OR 機票 OR 行程) newer_than:30d';
    const searchRes = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=5`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const messages = searchRes.data.messages || [];
    if (messages.length === 0) {
      console.log("No flight emails found in Gmail.");
      return [];
    }

    const emailContents = [];
    
    // 2. 取得信件內容
    for (const msg of messages) {
      const msgRes = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      // 解析信件 (Gmail API 回傳的 body 是 Base64 URL Safe 編碼)
      const payload = msgRes.data.payload;
      let base64Body = '';
      
      if (payload.parts) {
        // multipart/alternative
        const part = payload.parts.find((p: any) => p.mimeType === 'text/plain') || payload.parts[0];
        base64Body = part.body.data;
      } else if (payload.body.data) {
        base64Body = payload.body.data;
      }

      if (base64Body) {
        // Base64 URL Decode
        const decodedStr = decodeURIComponent(escape(window.atob(base64Body.replace(/-/g, '+').replace(/_/g, '/'))));
        emailContents.push({ id: msg.id, snippet: msgRes.data.snippet, body: decodedStr });
      }
    }
    
    return emailContents;
  } catch (error) {
    console.error("Gmail API Error:", error);
    throw error;
  }
};

// 呼叫 Google Calendar API 尋找航班行程
export const fetchCalendarFlights = async (accessToken: string) => {
  try {
    console.log("Fetching Calendar flights with token...");
    
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(); // 尋找未來半年內

    const res = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&q=flight|機票|航班&singleEvents=true&orderBy=startTime`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const events = res.data.items || [];
    const calendarContents = [];

    for (const event of events) {
      calendarContents.push({
        id: event.id,
        summary: event.summary,
        description: event.description || '',
        location: event.location || '',
        start: event.start.dateTime || event.start.date
      });
    }

    return calendarContents;
  } catch (error) {
    console.error("Calendar API Error:", error);
    throw error;
  }
};

export const syncGmailFlights = async (accessToken?: string) => {
  if (!accessToken) {
    throw new Error("No Access Token provided for Google APIs");
  }
  
  // 在這裡，你可以組合 Gmail 和 Calendar 的結果，並丟給 AI 分析
  const gmailData = await fetchGmailFlights(accessToken);
  const calendarData = await fetchCalendarFlights(accessToken);
  
  // 將抓下來的資料組合成一段長文字讓 AI 去判斷
  let combinedText = '';
  
  if (gmailData.length > 0) {
    combinedText += '--- Gmail Emails ---\n';
    gmailData.forEach(msg => {
      // 取前 500 字，避免過長
      combinedText += `Subject snippet: ${msg.snippet}\nContent: ${msg.body.substring(0, 500)}\n\n`;
    });
  }
  
  if (calendarData.length > 0) {
    combinedText += '--- Google Calendar Events ---\n';
    calendarData.forEach(evt => {
      combinedText += `Title: ${evt.summary}\nTime: ${evt.start}\nLocation: ${evt.location}\nDetails: ${evt.description.substring(0, 300)}\n\n`;
    });
  }

  if (!combinedText) {
    throw new Error("找不到任何有關機票的信件或日曆行程");
  }

  // 將資料交給 Netlify Function 上的 Gemini AI 解析
  console.log("Sending data to AI for analysis...");
  const parsedData = await analyzeTextWithAI(combinedText);
  
  const flight = {
    id: uuidv4(),
    ...parsedData
  };

  // 儲存到本地資料庫
  await db.flights.add(flight);
  
  return [flight];
};

export const getGeoIpLocation = async () => {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) {
      throw new Error(`ipapi responded with status ${res.status}`);
    }
    const data = await res.json();
    return data.country_name || 'Global';
  } catch (error) {
    console.warn('Failed to get Geo IP, falling back to Global:', error);
    return 'Global';
  }
};
