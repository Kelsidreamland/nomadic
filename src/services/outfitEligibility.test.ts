import { describe, expect, it } from 'vitest';
import type { Item } from '../db';
import { getOutfitEligibleItems } from './outfitEligibility';

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
});
