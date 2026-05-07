import type { Item } from '../db';

export type DetailInventoryAreaId =
  | 'toiletries'
  | 'makeup'
  | 'skincare'
  | 'clothing'
  | 'tech'
  | 'documents'
  | 'medicine'
  | 'other';

export interface DetailInventoryArea {
  id: DetailInventoryAreaId;
  name: string;
  nameEn: string;
  examples: string;
  examplesEn: string;
  defaultCategory: Item['category'];
  defaultSubCategory?: Item['subCategory'];
}

export interface DetailInventoryAiContext {
  areaLabel: string;
  areaExamples: string;
  preferredCategory: Item['category'];
}

export const DEFAULT_DETAIL_INVENTORY_AREA_ID: DetailInventoryAreaId = 'clothing';

export const detailInventoryAreas: DetailInventoryArea[] = [
  {
    id: 'toiletries',
    name: '盥洗',
    nameEn: 'Toiletries',
    examples: '牙刷、牙膏、洗手液、洗面奶',
    examplesEn: 'toothbrush, toothpaste, hand soap, cleanser',
    defaultCategory: '保養品',
  },
  {
    id: 'makeup',
    name: '化妝',
    nameEn: 'Makeup',
    examples: '粉底、口紅、眼影、刷具',
    examplesEn: 'foundation, lipstick, eyeshadow, brushes',
    defaultCategory: '保養品',
  },
  {
    id: 'skincare',
    name: '保養',
    nameEn: 'Skincare',
    examples: '精華、乳液、防曬、面膜',
    examplesEn: 'serum, lotion, sunscreen, masks',
    defaultCategory: '保養品',
  },
  {
    id: 'clothing',
    name: '衣物',
    nameEn: 'Clothing',
    examples: '上衣、褲子、洋裝、外套',
    examplesEn: 'tops, bottoms, dresses, outerwear',
    defaultCategory: '衣物',
    defaultSubCategory: '上衣',
  },
  {
    id: 'tech',
    name: '電子 / 工作',
    nameEn: 'Tech / Work',
    examples: '筆電、充電器、萬國充、行動電源',
    examplesEn: 'laptop, chargers, universal adapter, power bank',
    defaultCategory: '器材',
  },
  {
    id: 'documents',
    name: '證件 / 文件',
    nameEn: 'Documents',
    examples: '護照、簽證、票券、保險文件',
    examplesEn: 'passport, visa, tickets, insurance documents',
    defaultCategory: '其他',
  },
  {
    id: 'medicine',
    name: '藥品',
    nameEn: 'Medicine',
    examples: '常備藥、止痛藥、過敏藥、OK 繃',
    examplesEn: 'daily medicine, painkillers, allergy medicine, bandages',
    defaultCategory: '其他',
  },
  {
    id: 'other',
    name: '其他',
    nameEn: 'Other',
    examples: '臨時想到、無法歸類的小物',
    examplesEn: 'miscellaneous items that do not fit other zones',
    defaultCategory: '其他',
  },
];

const isEnglish = (language?: string) => language?.toLowerCase().startsWith('en');

export const getDetailInventoryArea = (id?: string) => {
  return detailInventoryAreas.find(area => area.id === id) || detailInventoryAreas.find(area => area.id === DEFAULT_DETAIL_INVENTORY_AREA_ID)!;
};

export const getDetailInventoryAreaLabel = (area: DetailInventoryArea, language?: string) => {
  return isEnglish(language) ? area.nameEn : area.name;
};

export const getDetailInventoryAreaExamples = (area: DetailInventoryArea, language?: string) => {
  return isEnglish(language) ? area.examplesEn : area.examples;
};

export const createDetailInventoryItemDraft = (areaId?: string): Partial<Item> => {
  const area = getDetailInventoryArea(areaId);

  return {
    category: area.defaultCategory,
    subCategory: area.defaultSubCategory,
    season: '通用',
    condition: '新',
    isDiscardable: false,
    packingArea: area.id,
    inventoryMode: 'detail',
    outfitEligible: area.defaultCategory === '衣物',
  };
};

export const buildDetailInventoryAiContext = (
  area: DetailInventoryArea,
  language?: string,
): DetailInventoryAiContext => ({
  areaLabel: getDetailInventoryAreaLabel(area, language),
  areaExamples: getDetailInventoryAreaExamples(area, language),
  preferredCategory: area.defaultCategory,
});
