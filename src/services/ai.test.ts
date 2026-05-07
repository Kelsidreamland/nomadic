import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeItemWithAI, analyzeTicketWithAI, generateSmartInsights } from './ai';
import { db } from '../db';

const { generateContentMock } = vi.hoisted(() => ({
  generateContentMock: vi.fn(),
}));

vi.mock('../db', () => ({
  db: {
    user_configs: {
      toArray: vi.fn()
    }
  }
}));

// Mock the GoogleGenerativeAI client
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(function () {
      return {
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: generateContentMock
        })
      };
    }),
    __generateContentMock: generateContentMock
  };
});

describe('generateSmartInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    vi.stubEnv('PROD', false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return error when no API key is configured', async () => {
    (db.user_configs.toArray as any).mockResolvedValue([]);

    try {
      await generateSmartInsights({});
      expect.fail('Should have thrown');
    } catch (e: any) {
      expect(e.message).toContain('未配置 Gemini API Key');
    }
  });
});

describe('analyzeTicketWithAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
    vi.stubEnv('PROD', false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sends PDF files with their MIME type and normalizes baggage weights', async () => {
    generateContentMock.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          destination: '東京',
          departureDate: '2026-06-01',
          checkedAllowance: '23kg',
          carryOnAllowance: '7 kg',
          personalAllowance: '',
        }),
      },
    });

    const result = await analyzeTicketWithAI('data:application/pdf;base64,JVBERi0=', 'application/pdf');
    const requestParts = generateContentMock.mock.calls[0][0];

    expect(requestParts[1].inlineData).toEqual({
      data: 'JVBERi0=',
      mimeType: 'application/pdf',
    });
    expect(result.checkedAllowance).toBe(23);
    expect(result.carryOnAllowance).toBe(7);
    expect(result.personalAllowance).toBe(0);
  });
});

describe('analyzeItemWithAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
    vi.stubEnv('PROD', false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('includes detailed packing zone context in item recognition prompts', async () => {
    generateContentMock.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          name: '牙刷',
          category: '保養品',
          season: '通用',
        }),
      },
    });

    await analyzeItemWithAI('', 'data:image/jpeg;base64,QUJD', {
      areaLabel: '盥洗',
      areaExamples: '牙刷、牙膏、洗面奶',
      preferredCategory: '保養品',
    });

    const requestParts = generateContentMock.mock.calls[0][0];
    expect(requestParts[0]).toContain('目前正在記錄的打包區域：盥洗');
    expect(requestParts[0]).toContain('牙刷、牙膏、洗面奶');
    expect(requestParts[0]).toContain('優先考慮分類：保養品');
  });
});
