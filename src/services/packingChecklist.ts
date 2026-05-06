import type { Item, Luggage } from '../db';

export interface PackingChecklistSummary {
  totalItems: number;
  assignedItems: number;
  unassignedItems: number;
  luggagesWithItems: number;
  expandableLuggageIds: string[];
}

export const getItemQuantity = (item: Pick<Item, 'quantity'>) => {
  return item.quantity && item.quantity > 0 ? item.quantity : 1;
};

export const buildPackingChecklistSummary = (
  luggages: Pick<Luggage, 'id'>[],
  items: Pick<Item, 'luggageId' | 'quantity'>[],
): PackingChecklistSummary => {
  const luggageIds = new Set(luggages.map(luggage => luggage.id));
  const itemCountByLuggage = new Map<string, number>();
  let assignedItems = 0;
  let unassignedItems = 0;

  for (const item of items) {
    const quantity = getItemQuantity(item);
    if (item.luggageId && luggageIds.has(item.luggageId)) {
      assignedItems += quantity;
      itemCountByLuggage.set(item.luggageId, (itemCountByLuggage.get(item.luggageId) || 0) + quantity);
    } else {
      unassignedItems += quantity;
    }
  }

  return {
    totalItems: assignedItems + unassignedItems,
    assignedItems,
    unassignedItems,
    luggagesWithItems: itemCountByLuggage.size,
    expandableLuggageIds: luggages
      .filter(luggage => (itemCountByLuggage.get(luggage.id) || 0) > 0)
      .map(luggage => luggage.id),
  };
};

export const togglePackedItemId = (packedItemIds: string[], itemId: string) => {
  const packedSet = new Set(packedItemIds);
  if (packedSet.has(itemId)) {
    packedSet.delete(itemId);
  } else {
    packedSet.add(itemId);
  }
  return Array.from(packedSet);
};

export const getPackingChecklistProgress = (
  items: Pick<Item, 'id' | 'luggageId' | 'quantity'>[],
  packedItemIds: string[],
) => {
  const packedSet = new Set(packedItemIds);
  const checkableItems = items.filter(item => item.luggageId);

  return {
    checkedItems: checkableItems.reduce((sum, item) => {
      if (!packedSet.has(item.id)) return sum;
      return sum + getItemQuantity(item);
    }, 0),
    totalCheckableItems: checkableItems.reduce((sum, item) => {
      return sum + getItemQuantity(item);
    }, 0),
  };
};
