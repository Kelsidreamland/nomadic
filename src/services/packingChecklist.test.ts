import { describe, expect, it } from 'vitest';
import type { Item, Luggage } from '../db';
import { buildPackingChecklistSummary, getPackingChecklistProgress, togglePackedItemId } from './packingChecklist';

const makeLuggage = (id: string, name: string): Luggage => ({
  id,
  name,
  type: '托运',
  season: '通用',
  length: 70,
  width: 45,
  height: 28,
  weightHistory: [],
  createdAt: Date.now(),
});

const makeItem = (id: string, luggageId: string, overrides: Partial<Item> = {}): Item => ({
  id,
  luggageId,
  name: id,
  category: '衣物',
  season: '通用',
  condition: '新',
  isDiscardable: false,
  createdAt: Date.now(),
  ...overrides,
});

describe('buildPackingChecklistSummary', () => {
  it('summarizes packed, empty, and unassigned items', () => {
    const summary = buildPackingChecklistSummary(
      [makeLuggage('checked', '托運箱'), makeLuggage('carry', '登機箱')],
      [makeItem('shirt', 'checked'), makeItem('pants', 'checked'), makeItem('adapter', '')],
    );

    expect(summary.totalItems).toBe(3);
    expect(summary.assignedItems).toBe(2);
    expect(summary.unassignedItems).toBe(1);
    expect(summary.luggagesWithItems).toBe(1);
    expect(summary.expandableLuggageIds).toEqual(['checked']);
  });

  it('counts quick inventory quantities in totals', () => {
    const summary = buildPackingChecklistSummary(
      [makeLuggage('checked', '托運箱')],
      [
        makeItem('socks', 'checked', { inventoryMode: 'quick', quantity: 7 }),
        makeItem('passport', 'checked', { inventoryMode: 'quick', quantity: 1 }),
      ],
    );

    expect(summary.totalItems).toBe(8);
    expect(summary.assignedItems).toBe(8);
  });
});

describe('togglePackedItemId', () => {
  it('adds missing item ids and removes existing ones without duplicates', () => {
    expect(togglePackedItemId(['shirt'], 'pants')).toEqual(['shirt', 'pants']);
    expect(togglePackedItemId(['shirt', 'pants'], 'shirt')).toEqual(['pants']);
    expect(togglePackedItemId(['shirt', 'shirt'], 'shirt')).toEqual([]);
  });
});

describe('getPackingChecklistProgress', () => {
  it('counts checked assigned items only', () => {
    const result = getPackingChecklistProgress(
      [makeItem('shirt', 'checked'), makeItem('pants', 'checked'), makeItem('adapter', '')],
      ['shirt', 'adapter'],
    );

    expect(result).toEqual({ checkedItems: 1, totalCheckableItems: 2 });
  });

  it('counts checked quick inventory groups by quantity', () => {
    const result = getPackingChecklistProgress(
      [makeItem('socks', 'checked', { inventoryMode: 'quick', quantity: 7 })],
      ['socks'],
    );

    expect(result).toEqual({ checkedItems: 7, totalCheckableItems: 7 });
  });
});
