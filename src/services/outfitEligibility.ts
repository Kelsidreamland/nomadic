import type { Item } from '../db';

export const isOutfitEligibleItem = (item: Pick<Item, 'category' | 'inventoryMode' | 'outfitEligible'>) => {
  if (item.category !== '衣物') return false;
  if (item.inventoryMode === 'quick') return false;
  return item.outfitEligible !== false;
};

export const getOutfitEligibleItems = <T extends Pick<Item, 'category' | 'inventoryMode' | 'outfitEligible'>>(items: T[]) => {
  return items.filter(isOutfitEligibleItem);
};
