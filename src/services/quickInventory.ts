import type { Item } from '../db';

export interface QuickInventoryTemplate {
  id: string;
  name: string;
  nameEn: string;
  category: Item['category'];
  subCategory?: Item['subCategory'];
  defaultQuantity: number;
}

export const quickInventoryTemplates: QuickInventoryTemplate[] = [
  { id: 'tops', name: '上衣', nameEn: 'Tops', category: '衣物', subCategory: '上衣', defaultQuantity: 7 },
  { id: 'bottoms', name: '褲子', nameEn: 'Bottoms', category: '衣物', subCategory: '下裝', defaultQuantity: 3 },
  { id: 'dress', name: '洋裝', nameEn: 'Dress', category: '衣物', subCategory: '連身裙', defaultQuantity: 1 },
  { id: 'outerwear', name: '外套', nameEn: 'Outerwear', category: '衣物', subCategory: '外套', defaultQuantity: 1 },
  { id: 'light-jacket', name: '薄外套', nameEn: 'Light Jacket', category: '衣物', subCategory: '外套', defaultQuantity: 1 },
  { id: 'socks', name: '襪子', nameEn: 'Socks', category: '衣物', subCategory: '襪子', defaultQuantity: 7 },
  { id: 'bra', name: '內衣', nameEn: 'Bra', category: '衣物', subCategory: '內衣', defaultQuantity: 3 },
  { id: 'underpants', name: '內褲', nameEn: 'Underwear', category: '衣物', subCategory: '內褲', defaultQuantity: 7 },
  { id: 'toothbrush', name: '牙刷', nameEn: 'Toothbrush', category: '保養品', defaultQuantity: 1 },
  { id: 'toothpaste', name: '牙膏', nameEn: 'Toothpaste', category: '保養品', defaultQuantity: 1 },
  { id: 'towel', name: '毛巾', nameEn: 'Towel', category: '其他', defaultQuantity: 1 },
  { id: 'universal-adapter', name: '萬國充', nameEn: 'Universal Adapter', category: '器材', defaultQuantity: 1 },
  { id: 'laptop', name: '筆電', nameEn: 'Laptop', category: '器材', defaultQuantity: 1 },
  { id: 'laptop-charger', name: '電腦充電器', nameEn: 'Laptop Charger', category: '器材', defaultQuantity: 1 },
  { id: 'phone-charger', name: '手機充電器', nameEn: 'Phone Charger', category: '器材', defaultQuantity: 1 },
  { id: 'powerbank', name: '行動電源', nameEn: 'Power Bank', category: '器材', defaultQuantity: 1 },
  { id: 'passport', name: '護照', nameEn: 'Passport', category: '其他', defaultQuantity: 1 },
];

export const getQuickInventoryTemplate = (id: string) => {
  const template = quickInventoryTemplates.find(item => item.id === id);
  if (!template) {
    throw new Error(`Unknown quick inventory template: ${id}`);
  }
  return template;
};

export const clampQuickInventoryQuantity = (quantity: number) => {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(99, Math.max(1, Math.round(quantity)));
};

export const createQuickInventoryItemDraft = (
  template: QuickInventoryTemplate,
  quantity: number,
  luggageId: string,
): Partial<Item> => ({
  name: template.name,
  category: template.category,
  subCategory: template.subCategory,
  season: '通用',
  condition: '新',
  isDiscardable: false,
  luggageId,
  inventoryMode: 'quick',
  outfitEligible: false,
  quantity: clampQuickInventoryQuantity(quantity),
});
