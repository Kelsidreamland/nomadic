// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Item, Luggage } from '../db';
import '../i18n';
import { Items } from './Items';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { liveQueryState, dbItemsDeleteMock, outfitMatchesDeleteMock } = vi.hoisted(() => ({
  liveQueryState: {
    callIndex: 0,
    items: [] as Item[],
    luggages: [] as Luggage[],
  },
  dbItemsDeleteMock: vi.fn(),
  outfitMatchesDeleteMock: vi.fn(),
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => {
    const values = [liveQueryState.items, liveQueryState.luggages];
    const value = values[liveQueryState.callIndex % values.length];
    liveQueryState.callIndex += 1;
    return value;
  }),
}));

vi.mock('../db', () => ({
  db: {
    items: {
      add: vi.fn(),
      update: vi.fn(),
      delete: dbItemsDeleteMock,
      toArray: vi.fn(),
    },
    luggages: {
      toArray: vi.fn(),
    },
    outfit_matches: {
      filter: vi.fn(() => ({
        toArray: vi.fn(async () => []),
      })),
      delete: outfitMatchesDeleteMock,
    },
  },
}));

vi.mock('../services/ai', () => ({
  analyzeItemWithAI: vi.fn(),
}));

describe('Items inventory modes', () => {
  beforeEach(() => {
    liveQueryState.callIndex = 0;
    liveQueryState.items = [];
    liveQueryState.luggages = [];
    dbItemsDeleteMock.mockReset();
    outfitMatchesDeleteMock.mockReset();
  });

  it('opens the quick count panel from the mode query string', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/items?mode=quick']}>
          <Items />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('快速清點');
    expect(container.textContent).toContain('衣物');
    expect(container.textContent).toContain('科技');
    expect(container.textContent).not.toContain('襪子');
    expect(container.textContent).not.toContain('護照');

    const clothingButton = Array.from(container.querySelectorAll('button'))
      .find(button => button.textContent?.trim() === '衣物');
    expect(clothingButton).toBeTruthy();

    act(() => {
      clothingButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('襪子');
    expect(container.textContent).not.toContain('護照');

    act(() => {
      clothingButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).not.toContain('襪子');

    act(() => {
      root.unmount();
    });
  });

  it('shows detailed packing zones before photo capture', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/items?mode=detail']}>
          <Items />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('從哪一區開始');
    expect(container.textContent).toContain('盥洗');
    expect(container.textContent).toContain('化妝');
    expect(container.textContent).toContain('正在記錄：衣物');

    const toiletriesButton = Array.from(container.querySelectorAll('button'))
      .find(button => button.textContent?.includes('盥洗'));
    expect(toiletriesButton).toBeTruthy();

    act(() => {
      toiletriesButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('正在記錄：盥洗');

    act(() => {
      root.unmount();
    });
  });

  it('requires confirmation before deleting an item card', async () => {
    liveQueryState.items = [
      {
        id: 'shirt-1',
        luggageId: '',
        name: '白色襯衫',
        category: '衣物',
        subCategory: '上衣',
        season: '通用',
        condition: '新',
        isDiscardable: false,
        createdAt: 1,
      },
    ];

    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/items']}>
          <Items />
        </MemoryRouter>,
      );
    });

    const deleteButton = Array.from(container.querySelectorAll('button'))
      .find(button => button.getAttribute('aria-label') === '刪除 白色襯衫');
    expect(deleteButton).toBeTruthy();

    await act(async () => {
      deleteButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(dbItemsDeleteMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain('確認刪除');

    const confirmButton = Array.from(container.querySelectorAll('button'))
      .find(button => button.textContent?.includes('確認刪除'));
    expect(confirmButton).toBeTruthy();

    await act(async () => {
      confirmButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(dbItemsDeleteMock).toHaveBeenCalledWith('shirt-1');

    act(() => {
      root.unmount();
    });
  });
});
