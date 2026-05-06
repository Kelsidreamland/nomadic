import { describe, expect, it } from 'vitest';
import { createQuickInventoryItemDraft, getQuickInventoryTemplate, quickInventoryTemplates } from './quickInventory';

describe('quickInventoryTemplates', () => {
  it('includes quantity-friendly clothing and travel essentials', () => {
    expect(quickInventoryTemplates.map(template => template.id)).toEqual(
      expect.arrayContaining([
        'tops',
        'socks',
        'underpants',
        'passport',
        'universal-adapter',
        'laptop-charger',
      ]),
    );
  });
});

describe('createQuickInventoryItemDraft', () => {
  it('creates one non-outfit item that represents a counted group', () => {
    const item = createQuickInventoryItemDraft(getQuickInventoryTemplate('socks'), 7, 'carry-on');

    expect(item).toMatchObject({
      name: '襪子',
      category: '衣物',
      subCategory: '襪子',
      season: '通用',
      condition: '新',
      isDiscardable: false,
      inventoryMode: 'quick',
      outfitEligible: false,
      quantity: 7,
      luggageId: 'carry-on',
    });
  });

  it('clamps invalid quantities to a useful manual range', () => {
    const template = getQuickInventoryTemplate('passport');

    expect(createQuickInventoryItemDraft(template, 0, '').quantity).toBe(1);
    expect(createQuickInventoryItemDraft(template, 200, '').quantity).toBe(99);
  });
});
