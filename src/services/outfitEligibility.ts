import type { Item } from '../db';

const nonOutfitPlanningKeywords = [
  '睡衣',
  '睡褲',
  '睡裙',
  '睡袍',
  '家居服',
  '泳衣',
  '泳裝',
  '泳裤',
  '泳褲',
  '比基尼',
  'bikini',
  'pajama',
  'pajamas',
  'pyjama',
  'pyjamas',
  'sleepwear',
  'swimsuit',
  'swimwear',
];

export const isNonOutfitPlanningItem = (item: Pick<Item, 'name' | 'subCategory'>) => {
  const searchableText = `${item.name || ''} ${item.subCategory || ''}`.toLowerCase();
  return nonOutfitPlanningKeywords.some(keyword => searchableText.includes(keyword.toLowerCase()));
};

export const shouldAutoIncludeInOutfitPlanning = (
  item: Pick<Item, 'category' | 'inventoryMode' | 'name' | 'subCategory'>,
) => {
  if (item.category !== '衣物') return false;
  if (item.inventoryMode === 'quick') return false;
  return !isNonOutfitPlanningItem(item);
};

export const isOutfitEligibleItem = (
  item: Pick<Item, 'category' | 'inventoryMode' | 'outfitEligible' | 'name' | 'subCategory'>,
) => {
  if (item.category !== '衣物') return false;
  if (item.inventoryMode === 'quick') return false;
  if (isNonOutfitPlanningItem(item) && item.outfitEligible !== true) return false;
  return item.outfitEligible !== false;
};

export const getOutfitEligibleItems = <T extends Pick<Item, 'category' | 'inventoryMode' | 'outfitEligible' | 'name' | 'subCategory'>>(items: T[]) => {
  return items.filter(isOutfitEligibleItem);
};
