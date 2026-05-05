import type { Item, Luggage } from '../db';

export interface PackingChecklistSummary {
  totalItems: number;
  assignedItems: number;
  unassignedItems: number;
  luggagesWithItems: number;
  expandableLuggageIds: string[];
}

export const buildPackingChecklistSummary = (
  luggages: Pick<Luggage, 'id'>[],
  items: Pick<Item, 'luggageId'>[],
): PackingChecklistSummary => {
  const luggageIds = new Set(luggages.map(luggage => luggage.id));
  const itemCountByLuggage = new Map<string, number>();
  let assignedItems = 0;
  let unassignedItems = 0;

  for (const item of items) {
    if (item.luggageId && luggageIds.has(item.luggageId)) {
      assignedItems += 1;
      itemCountByLuggage.set(item.luggageId, (itemCountByLuggage.get(item.luggageId) || 0) + 1);
    } else {
      unassignedItems += 1;
    }
  }

  return {
    totalItems: items.length,
    assignedItems,
    unassignedItems,
    luggagesWithItems: itemCountByLuggage.size,
    expandableLuggageIds: luggages
      .filter(luggage => (itemCountByLuggage.get(luggage.id) || 0) > 0)
      .map(luggage => luggage.id),
  };
};
