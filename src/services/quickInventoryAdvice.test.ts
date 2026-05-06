import { describe, expect, it } from 'vitest';
import type { Flight, Item } from '../db';
import {
  buildQuickInventoryInsights,
  getTripLengthDays,
  mergeQuickInventoryInsights,
} from './quickInventoryAdvice';

const makeItem = (id: string, overrides: Partial<Item> = {}): Item => ({
  id,
  luggageId: 'carry-on',
  name: id,
  category: '衣物',
  season: '通用',
  condition: '新',
  isDiscardable: false,
  createdAt: Date.now(),
  inventoryMode: 'quick',
  outfitEligible: false,
  quantity: 1,
  ...overrides,
});

const makeFlight = (overrides: Partial<Flight> = {}): Flight => ({
  id: 'flight-1',
  destination: '東京',
  airline: 'EVA',
  departureDate: '2026-06-01',
  checkedAllowance: 23,
  carryOnAllowance: 7,
  personalAllowance: 0,
  ...overrides,
});

describe('getTripLengthDays', () => {
  it('uses the return date as an inclusive trip length when available', () => {
    expect(getTripLengthDays(makeFlight({ returnDepartureDate: '2026-06-08' }))).toBe(8);
  });

  it('falls back to a one-week planning window for one-way or missing trips', () => {
    expect(getTripLengthDays(makeFlight())).toBe(7);
    expect(getTripLengthDays(undefined)).toBe(7);
  });
});

describe('buildQuickInventoryInsights', () => {
  it('turns quick-count underwear and socks into shortage advice for the trip length', () => {
    const insights = buildQuickInventoryInsights({
      upcomingFlight: makeFlight({ returnDepartureDate: '2026-06-10' }),
      items: [
        makeItem('socks', { name: '襪子', subCategory: '襪子', quantity: 7 }),
        makeItem('underpants', { name: '內褲', subCategory: '內褲', quantity: 6 }),
      ],
      language: 'zh-TW',
    });
    expect(insights.optimization).toBeDefined();

    expect(insights.optimization!.weight_status).toBe('Warning');
    expect(insights.optimization!.packing_advice).toEqual(
      expect.arrayContaining([
        expect.stringContaining('襪子 7 件'),
        expect.stringContaining('內褲 6 件'),
      ]),
    );
  });

  it('suggests a laundry day when quick-count clothing is below the trip length', () => {
    const insights = buildQuickInventoryInsights({
      upcomingFlight: makeFlight({ returnDepartureDate: '2026-06-14' }),
      items: [
        makeItem('tops', { name: '上衣', subCategory: '上衣', quantity: 7 }),
        makeItem('bottoms', { name: '褲子', subCategory: '下裝', quantity: 3 }),
      ],
      language: 'zh-TW',
    });
    expect(insights.optimization).toBeDefined();

    expect(insights.optimization!.packing_advice).toEqual(
      expect.arrayContaining([
        expect.stringContaining('第 5 天'),
      ]),
    );
  });

  it('reminds the user when travel essentials are missing from quick inventory', () => {
    const insights = buildQuickInventoryInsights({
      upcomingFlight: makeFlight(),
      items: [
        makeItem('tops', { name: '上衣', subCategory: '上衣', quantity: 7 }),
      ],
      language: 'zh-TW',
    });
    expect(insights.optimization).toBeDefined();

    expect(insights.optimization!.packing_advice).toEqual(
      expect.arrayContaining([
        expect.stringContaining('護照'),
        expect.stringContaining('萬國充'),
      ]),
    );
  });
});

describe('mergeQuickInventoryInsights', () => {
  it('keeps AI suggestions and appends deterministic quick-count advice', () => {
    const merged = mergeQuickInventoryInsights(
      {
        optimization: {
          weight_status: 'Safe',
          luggage_analysis: 'AI 已檢查重量。',
          remove_suggestions: [{ item_id: 'dress', reason: '只適合特殊場合。' }],
          packing_advice: ['AI 建議把液體集中收納。'],
        },
      },
      {
        optimization: {
          weight_status: 'Warning',
          luggage_analysis: '快速清點建議。',
          remove_suggestions: [],
          packing_advice: ['襪子 7 件少於 10 天。'],
        },
      },
    );

    expect(merged.optimization?.weight_status).toBe('Warning');
    expect(merged.optimization?.remove_suggestions).toEqual([{ item_id: 'dress', reason: '只適合特殊場合。' }]);
    expect(merged.optimization?.packing_advice).toEqual([
      'AI 建議把液體集中收納。',
      '襪子 7 件少於 10 天。',
    ]);
  });
});
