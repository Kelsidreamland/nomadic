import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DETAIL_INVENTORY_AREA_ID,
  buildDetailInventoryAiContext,
  createDetailInventoryItemDraft,
  detailInventoryAreas,
  getDetailInventoryArea,
} from './detailInventoryAreas';

describe('detailInventoryAreas', () => {
  it('defines the packing zones used before detailed photo capture', () => {
    expect(detailInventoryAreas.map(area => area.id)).toEqual([
      'toiletries',
      'makeup',
      'skincare',
      'clothing',
      'tech',
      'documents',
      'medicine',
      'other',
    ]);
    expect(DEFAULT_DETAIL_INVENTORY_AREA_ID).toBe('clothing');
  });

  it('creates item defaults from the selected packing zone', () => {
    expect(createDetailInventoryItemDraft('toiletries')).toMatchObject({
      category: '保養品',
      packingArea: 'toiletries',
      inventoryMode: 'detail',
    });

    expect(createDetailInventoryItemDraft('tech')).toMatchObject({
      category: '器材',
      packingArea: 'tech',
      inventoryMode: 'detail',
    });
  });

  it('builds an AI context that narrows recognition to the selected zone', () => {
    const area = getDetailInventoryArea('toiletries');
    const context = buildDetailInventoryAiContext(area, 'zh-TW');

    expect(context.areaLabel).toBe('盥洗');
    expect(context.areaExamples).toContain('牙刷');
    expect(context.preferredCategory).toBe('保養品');
  });
});
