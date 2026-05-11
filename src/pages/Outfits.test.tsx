// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Item, OutfitMatch } from '../db';
import '../i18n';
import { Outfits } from './Outfits';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { liveQueryState } = vi.hoisted(() => ({
  liveQueryState: {
    callIndex: 0,
    items: [] as Item[],
    matches: [] as OutfitMatch[],
  },
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => {
    const values = [liveQueryState.items, liveQueryState.matches];
    const value = values[liveQueryState.callIndex % values.length];
    liveQueryState.callIndex += 1;
    return value;
  }),
}));

vi.mock('../db', () => ({
  db: {
    items: { toArray: vi.fn() },
    outfit_matches: {
      toArray: vi.fn(),
      add: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Outfits page', () => {
  beforeEach(() => {
    liveQueryState.callIndex = 0;
    liveQueryState.items = [
      {
        id: 'shirt',
        luggageId: '',
        name: '白色襯衫',
        category: '衣物',
        subCategory: '上衣',
        season: '通用',
        condition: '新',
        isDiscardable: false,
        createdAt: 1,
      },
      {
        id: 'pants',
        luggageId: '',
        name: '黑色長褲',
        category: '衣物',
        subCategory: '下裝',
        season: '通用',
        condition: '新',
        isDiscardable: false,
        createdAt: 2,
      },
    ];
    liveQueryState.matches = [];
  });

  it('does not render the top summary stat cards', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(<Outfits />);
    });

    expect(container.textContent).toContain('搭配統計');
    expect(container.textContent).not.toContain('物品庫');
    expect(container.textContent).not.toContain('已建立搭配');
    expect(container.textContent).not.toContain('平均每件搭配');
    expect(container.textContent).not.toContain('百搭單品');

    act(() => {
      root.unmount();
    });
  });
});
