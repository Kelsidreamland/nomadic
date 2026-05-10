import { describe, expect, it } from 'vitest';
import type { Item } from '../db';
import { getOutfitEligibleItems, shouldAutoIncludeInOutfitPlanning } from './outfitEligibility';

const makeItem = (overrides: Partial<Item>): Item => ({
  id: overrides.id || 'item',
  luggageId: '',
  name: overrides.name || 'item',
  category: overrides.category || '衣物',
  subCategory: overrides.subCategory || '上衣',
  season: '通用',
  condition: '新',
  isDiscardable: false,
  createdAt: Date.now(),
  ...overrides,
});

describe('getOutfitEligibleItems', () => {
  it('excludes quick inventory count groups from outfit planning', () => {
    const result = getOutfitEligibleItems([
      makeItem({ id: 'detail-shirt', inventoryMode: 'detail', outfitEligible: true }),
      makeItem({ id: 'quick-tops', inventoryMode: 'quick', outfitEligible: false, quantity: 7 }),
      makeItem({ id: 'passport', category: '其他', inventoryMode: 'quick', outfitEligible: false }),
    ]);

    expect(result.map(item => item.id)).toEqual(['detail-shirt']);
  });

  it('excludes sleepwear and swimwear from outfit planning', () => {
    const result = getOutfitEligibleItems([
      makeItem({ id: 'shirt', name: '白色襯衫', inventoryMode: 'detail', outfitEligible: true }),
      makeItem({ id: 'pajamas', name: '薄長袖睡衣', inventoryMode: 'detail', outfitEligible: true }),
      makeItem({ id: 'swimsuit', name: '黑色泳衣', inventoryMode: 'detail', outfitEligible: true }),
      makeItem({ id: 'bikini', name: 'blue bikini', inventoryMode: 'detail', outfitEligible: true }),
    ]);

    expect(result.map(item => item.id)).toEqual(['shirt']);
  });

  it('uses the same rule when auto-setting detail item eligibility', () => {
    expect(shouldAutoIncludeInOutfitPlanning(makeItem({ name: '白色襯衫', inventoryMode: 'detail' }))).toBe(true);
    expect(shouldAutoIncludeInOutfitPlanning(makeItem({ name: '睡衣套裝', inventoryMode: 'detail' }))).toBe(false);
    expect(shouldAutoIncludeInOutfitPlanning(makeItem({ name: 'swimsuit', inventoryMode: 'detail' }))).toBe(false);
  });
});
