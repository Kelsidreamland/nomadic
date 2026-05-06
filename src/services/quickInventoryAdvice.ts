import type { Flight, Item } from '../db';
import { getItemQuantity } from './packingChecklist';

type InsightStatus = 'Safe' | 'Warning' | 'Overweight' | string;

export interface QuickInventoryInsights {
  optimization?: {
    weight_status?: InsightStatus;
    luggage_analysis?: string;
    remove_suggestions?: Array<{ item_id: string; reason: string }>;
    packing_advice?: string[];
  };
}

interface QuickInventoryAdviceContext {
  upcomingFlight?: Pick<Flight, 'departureDate' | 'returnDepartureDate'>;
  items: Pick<Item, 'id' | 'name' | 'category' | 'subCategory' | 'quantity' | 'inventoryMode'>[];
  language?: string;
}

const DEFAULT_TRIP_DAYS = 7;

const parseDateOnly = (value?: string) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isEnglish = (language?: string) => language?.toLowerCase().startsWith('en');

const includesAny = (value: string | undefined, keywords: string[]) => {
  const normalized = (value || '').toLowerCase();
  return keywords.some(keyword => normalized.includes(keyword.toLowerCase()));
};

export const getTripLengthDays = (flight?: Pick<Flight, 'departureDate' | 'returnDepartureDate'>) => {
  const departureDate = parseDateOnly(flight?.departureDate);
  const returnDate = parseDateOnly(flight?.returnDepartureDate);

  if (!departureDate || !returnDate || returnDate < departureDate) {
    return DEFAULT_TRIP_DAYS;
  }

  const diffDays = Math.floor((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(60, Math.max(1, diffDays));
};

const countMatchingItems = (
  items: QuickInventoryAdviceContext['items'],
  predicate: (item: QuickInventoryAdviceContext['items'][number]) => boolean,
) => {
  return items.reduce((sum, item) => {
    return predicate(item) ? sum + getItemQuantity(item) : sum;
  }, 0);
};

const hasMatchingItem = (
  items: QuickInventoryAdviceContext['items'],
  predicate: (item: QuickInventoryAdviceContext['items'][number]) => boolean,
) => items.some(predicate);

const getLaundryDay = (availableOutfitDays: number, tripDays: number) => {
  if (availableOutfitDays <= 0 || availableOutfitDays >= tripDays) return null;
  return Math.max(3, Math.min(tripDays, Math.ceil(availableOutfitDays * 0.7)));
};

export const buildQuickInventoryInsights = ({
  upcomingFlight,
  items,
  language,
}: QuickInventoryAdviceContext): QuickInventoryInsights => {
  const tripDays = getTripLengthDays(upcomingFlight);
  const en = isEnglish(language);
  const advice: string[] = [];

  const sockCount = countMatchingItems(
    items,
    item => item.subCategory === '襪子' || includesAny(item.name, ['襪', 'sock']),
  );
  const underpantsCount = countMatchingItems(
    items,
    item => item.subCategory === '內褲' || includesAny(item.name, ['內褲', 'underwear', 'underpants']),
  );
  const topLikeCount = countMatchingItems(
    items,
    item => ['上衣', '內搭', '連身裙'].includes(item.subCategory || '') || includesAny(item.name, ['上衣', '洋裝', 'dress', 'top', 'shirt']),
  );

  if (sockCount > 0 && sockCount < tripDays) {
    advice.push(
      en
        ? `Socks: ${sockCount} pieces for a ${tripDays}-day trip. Add more or plan laundry mid-trip.`
        : `襪子 ${sockCount} 件少於 ${tripDays} 天，建議補到 ${tripDays} 件，或先安排中途洗衣。`,
    );
  }

  if (underpantsCount > 0 && underpantsCount < tripDays) {
    advice.push(
      en
        ? `Underwear: ${underpantsCount} pieces for a ${tripDays}-day trip. Add more or plan laundry mid-trip.`
        : `內褲 ${underpantsCount} 件少於 ${tripDays} 天，建議補到 ${tripDays} 件，或先安排中途洗衣。`,
    );
  }

  const laundryDay = getLaundryDay(topLikeCount, tripDays);
  if (laundryDay) {
    advice.push(
      en
        ? `You have ${topLikeCount} main outfits for ${tripDays} days. Plan laundry around day ${laundryDay}.`
        : `上衣/洋裝約 ${topLikeCount} 套，行程 ${tripDays} 天，建議第 ${laundryDay} 天左右安排洗衣。`,
    );
  } else if (topLikeCount > tripDays + 3) {
    advice.push(
      en
        ? `You have ${topLikeCount} main outfits for ${tripDays} days. Remove a few low-frequency pieces first.`
        : `上衣/洋裝約 ${topLikeCount} 套，明顯多於 ${tripDays} 天行程，可以先扣掉幾件低頻單品。`,
    );
  }

  const missingEssentials = [
    {
      zh: '護照',
      en: 'passport',
      matches: (item: QuickInventoryAdviceContext['items'][number]) => includesAny(item.name, ['護照', 'passport']),
    },
    {
      zh: '萬國充',
      en: 'universal adapter',
      matches: (item: QuickInventoryAdviceContext['items'][number]) => includesAny(item.name, ['萬國充', '轉接', 'adapter']),
    },
    {
      zh: '手機充電器',
      en: 'phone charger',
      matches: (item: QuickInventoryAdviceContext['items'][number]) => includesAny(item.name, ['手機充電器', 'phone charger']),
    },
  ].filter(essential => !hasMatchingItem(items, essential.matches));

  if (items.length > 0 && missingEssentials.length > 0) {
    advice.push(
      en
        ? `Essentials not seen yet: ${missingEssentials.map(item => item.en).join(', ')}. Confirm before departure.`
        : `必要品還沒看到：${missingEssentials.map(item => item.zh).join('、')}。出發前請先確認。`,
    );
  }

  const hasWarning = advice.length > 0;

  return {
    optimization: {
      weight_status: hasWarning ? 'Warning' : 'Safe',
      luggage_analysis: en
        ? `Checked quick-count quantities against a ${tripDays}-day planning window.`
        : `已根據 ${tripDays} 天行程和快速清點數量做基礎檢查。`,
      remove_suggestions: [],
      packing_advice: advice,
    },
  };
};

const statusRank = (status?: InsightStatus) => {
  if (status === 'Overweight') return 3;
  if (status === 'Warning') return 2;
  if (status === 'Safe') return 1;
  return 0;
};

const chooseStatus = (first?: InsightStatus, second?: InsightStatus) => {
  return statusRank(second) > statusRank(first) ? second : first || second;
};

export const mergeQuickInventoryInsights = (
  aiInsights: QuickInventoryInsights,
  quickInsights: QuickInventoryInsights,
): QuickInventoryInsights => {
  const aiOptimization = aiInsights.optimization;
  const quickOptimization = quickInsights.optimization;

  if (!aiOptimization) return quickInsights;
  if (!quickOptimization) return aiInsights;

  const packingAdvice = Array.from(new Set([
    ...(aiOptimization.packing_advice || []),
    ...(quickOptimization.packing_advice || []),
  ]));

  return {
    ...aiInsights,
    optimization: {
      ...aiOptimization,
      weight_status: chooseStatus(aiOptimization.weight_status, quickOptimization.weight_status),
      luggage_analysis: [
        aiOptimization.luggage_analysis,
        quickOptimization.luggage_analysis,
      ].filter(Boolean).join(' '),
      remove_suggestions: [
        ...(aiOptimization.remove_suggestions || []),
        ...(quickOptimization.remove_suggestions || []),
      ],
      packing_advice: packingAdvice,
    },
  };
};
