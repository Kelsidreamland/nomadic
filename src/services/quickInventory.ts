import type { Item } from '../db';

export type QuickInventoryGroupId = 'clothing' | 'toiletries' | 'tech' | 'documents' | 'other';

export interface QuickInventoryGroup {
  id: QuickInventoryGroupId;
  name: string;
  nameEn: string;
}

export interface QuickInventoryTemplate {
  id: string;
  groupId: QuickInventoryGroupId;
  name: string;
  nameEn: string;
  category: Item['category'];
  subCategory?: Item['subCategory'];
  defaultQuantity: number;
}

export const quickInventoryGroups: QuickInventoryGroup[] = [
  { id: 'clothing', name: '衣物', nameEn: 'Clothing' },
  { id: 'toiletries', name: '盥洗', nameEn: 'Toiletries' },
  { id: 'tech', name: '科技', nameEn: 'Tech' },
  { id: 'documents', name: '證件', nameEn: 'Documents' },
  { id: 'other', name: '其他', nameEn: 'Other' },
];

export const quickInventoryTemplates: QuickInventoryTemplate[] = [
  { id: 'tops', groupId: 'clothing', name: '上衣', nameEn: 'Tops', category: '衣物', subCategory: '上衣', defaultQuantity: 7 },
  { id: 'bottoms', groupId: 'clothing', name: '褲子', nameEn: 'Bottoms', category: '衣物', subCategory: '下裝', defaultQuantity: 3 },
  { id: 'dress', groupId: 'clothing', name: '洋裝', nameEn: 'Dress', category: '衣物', subCategory: '連身裙', defaultQuantity: 1 },
  { id: 'outerwear', groupId: 'clothing', name: '外套', nameEn: 'Outerwear', category: '衣物', subCategory: '外套', defaultQuantity: 1 },
  { id: 'light-jacket', groupId: 'clothing', name: '薄外套', nameEn: 'Light Jacket', category: '衣物', subCategory: '外套', defaultQuantity: 1 },
  { id: 'socks', groupId: 'clothing', name: '襪子', nameEn: 'Socks', category: '衣物', subCategory: '襪子', defaultQuantity: 7 },
  { id: 'bra', groupId: 'clothing', name: '內衣', nameEn: 'Bra', category: '衣物', subCategory: '內衣', defaultQuantity: 3 },
  { id: 'underpants', groupId: 'clothing', name: '內褲', nameEn: 'Underwear', category: '衣物', subCategory: '內褲', defaultQuantity: 7 },
  { id: 'toothbrush', groupId: 'toiletries', name: '牙刷', nameEn: 'Toothbrush', category: '保養品', defaultQuantity: 1 },
  { id: 'toothpaste', groupId: 'toiletries', name: '牙膏', nameEn: 'Toothpaste', category: '保養品', defaultQuantity: 1 },
  { id: 'universal-adapter', groupId: 'tech', name: '萬國充', nameEn: 'Universal Adapter', category: '器材', defaultQuantity: 1 },
  { id: 'laptop', groupId: 'tech', name: '筆電', nameEn: 'Laptop', category: '器材', defaultQuantity: 1 },
  { id: 'laptop-charger', groupId: 'tech', name: '電腦充電器', nameEn: 'Laptop Charger', category: '器材', defaultQuantity: 1 },
  { id: 'phone-charger', groupId: 'tech', name: '手機充電器', nameEn: 'Phone Charger', category: '器材', defaultQuantity: 1 },
  { id: 'powerbank', groupId: 'tech', name: '行動電源', nameEn: 'Power Bank', category: '器材', defaultQuantity: 1 },
  { id: 'passport', groupId: 'documents', name: '護照', nameEn: 'Passport', category: '其他', defaultQuantity: 1 },
  { id: 'towel', groupId: 'other', name: '毛巾', nameEn: 'Towel', category: '其他', defaultQuantity: 1 },
];

export const getQuickInventoryGroup = (id: QuickInventoryGroupId) => {
  const group = quickInventoryGroups.find(item => item.id === id);
  if (!group) {
    throw new Error(`Unknown quick inventory group: ${id}`);
  }
  return group;
};

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
