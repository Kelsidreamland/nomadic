import { describe, expect, it } from 'vitest';
import type { Item, Luggage } from '../db';
import { buildPackingChecklistSummary } from './packingChecklist';

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

const makeItem = (id: string, luggageId: string): Item => ({
  id,
  luggageId,
  name: id,
  category: '衣物',
  season: '通用',
  condition: '新',
  isDiscardable: false,
  createdAt: Date.now(),
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
});
