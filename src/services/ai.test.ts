import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSmartInsights } from './ai';
import { db } from '../db';
import { GoogleGenerativeAI } from '@google/generative-ai';

vi.mock('../db', () => ({
  db: {
    user_configs: {
      toArray: vi.fn()
    }
  }
}));

// Mock the GoogleGenerativeAI client
vi.mock('@google/generative-ai', () => {
  const generateContentMock = vi.fn();
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: generateContentMock
      })
    })),
    __generateContentMock: generateContentMock
  };
});

describe('generateSmartInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    vi.stubEnv('PROD', '');
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

