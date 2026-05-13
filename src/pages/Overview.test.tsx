// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Flight, Item, Luggage } from '../db';
import '../i18n';
import { Overview } from './Overview';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const setInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const { liveQueryState, generateSmartInsightsMock, dbItemsUpdateMock, dbLuggagesUpdateMock, dbFlightsDeleteMock } = vi.hoisted(() => ({
  liveQueryState: {
    callIndex: 0,
    luggages: [] as Luggage[],
    items: [] as Item[],
    flights: [] as Flight[],
  },
  generateSmartInsightsMock: vi.fn(),
  dbItemsUpdateMock: vi.fn(),
  dbLuggagesUpdateMock: vi.fn(),
  dbFlightsDeleteMock: vi.fn(),
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => {
    const values = [liveQueryState.luggages, liveQueryState.items, liveQueryState.flights];
    const value = values[liveQueryState.callIndex % values.length];
    liveQueryState.callIndex += 1;
    return value;
  }),
}));

vi.mock('../db', () => ({
  db: {
    luggages: {
      toArray: vi.fn(),
      get: vi.fn(),
      update: dbLuggagesUpdateMock,
    },
    items: {
      toArray: vi.fn(),
      update: dbItemsUpdateMock,
    },
    flights: {
      toArray: vi.fn(),
      delete: dbFlightsDeleteMock,
    },
  },
}));

vi.mock('../services/ai', () => ({
  generateSmartInsights: generateSmartInsightsMock,
}));

describe('Overview departure tools', () => {
  beforeEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    liveQueryState.callIndex = 0;
    liveQueryState.luggages = [];
    liveQueryState.items = [];
    liveQueryState.flights = [];
    generateSmartInsightsMock.mockReset();
    dbItemsUpdateMock.mockReset();
    dbLuggagesUpdateMock.mockReset();
    dbFlightsDeleteMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps packing-related actions on Overview without duplicating the outfit tab', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/overview']}>
          <Overview />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('AI 斷捨離');
    expect(container.textContent).toContain('打包模式');
    expect(container.textContent).toContain('旅居足跡');
    expect(container.textContent).not.toContain('查看搭配統計');

    act(() => {
      root.unmount();
    });
  });

  it('shows quick-count packing advice when the AI pipeline is unavailable', async () => {
    liveQueryState.items = [
      {
        id: 'socks',
        luggageId: 'carry-on',
        name: '襪子',
        category: '衣物',
        subCategory: '襪子',
        season: '通用',
        condition: '新',
        isDiscardable: false,
        createdAt: Date.now(),
        inventoryMode: 'quick',
        outfitEligible: false,
        quantity: 7,
      },
      {
        id: 'underpants',
        luggageId: 'carry-on',
        name: '內褲',
        category: '衣物',
        subCategory: '內褲',
        season: '通用',
        condition: '新',
        isDiscardable: false,
        createdAt: Date.now(),
        inventoryMode: 'quick',
        outfitEligible: false,
        quantity: 6,
      },
    ];
    liveQueryState.flights = [
      {
        id: 'flight-1',
        destination: '東京',
        airline: 'EVA',
        departureDate: '2026-06-01',
        returnDepartureDate: '2026-06-10',
        checkedAllowance: 23,
        carryOnAllowance: 7,
        personalAllowance: 0,
      },
    ];
    generateSmartInsightsMock.mockRejectedValue(new Error('no api'));

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/overview']}>
          <Overview />
        </MemoryRouter>
      );
    });

    const button = Array.from(container.querySelectorAll('button')).find(button => button.textContent?.includes('AI 斷捨離'));
    expect(button).toBeTruthy();

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('打包與備品建議');
    expect(container.textContent).toContain('襪子 7 件');
    expect(container.textContent).toContain('內褲 6 件');

    act(() => {
      root.unmount();
    });
  });

  it('ignores historical Flighty imports when choosing overview flight details', async () => {
    liveQueryState.flights = [
      {
        id: 'old-import',
        destination: '東京',
        airline: 'EVA',
        departureDate: 'Fri, Jan 5, 2024',
        checkedAllowance: 99,
        carryOnAllowance: 99,
        personalAllowance: 0,
      },
      {
        id: 'future',
        destination: '首爾',
        airline: 'Korean Air',
        departureDate: '2026-06-01',
        checkedAllowance: 23,
        carryOnAllowance: 7,
        personalAllowance: 0,
      },
    ];

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/overview']}>
          <Overview />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('首爾');
    expect(container.textContent).not.toContain('東京');

    act(() => {
      root.unmount();
    });
  });

  it('shows luggage allowance directly on each luggage card', async () => {
    liveQueryState.luggages = [
      {
        id: 'checked',
        name: '托運箱',
        type: '托运',
        season: '通用',
        length: 68,
        width: 45,
        height: 27,
        weightHistory: [{ date: '2026-05-01', weight: 10 }],
        createdAt: 1,
      },
    ];
    liveQueryState.flights = [
      {
        id: 'flight-1',
        destination: '東京',
        airline: 'EVA',
        departureDate: '2026-06-01',
        checkedAllowance: 23,
        carryOnAllowance: 7,
        personalAllowance: 0,
      },
    ];

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/overview']}>
          <Overview />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('本次測量 10.0kg');
    expect(container.textContent).toContain('限額 23kg');
    expect(container.textContent).not.toContain('重量 vs 限額');

    act(() => {
      root.unmount();
    });
  });

  it('saves luggage allowance only after the explicit save action', async () => {
    liveQueryState.luggages = [
      {
        id: 'checked',
        name: '托運箱',
        type: '托运',
        season: '通用',
        length: 68,
        width: 45,
        height: 27,
        weightHistory: [],
        createdAt: 1,
      },
    ];
    liveQueryState.flights = [
      {
        id: 'flight-1',
        destination: '東京',
        airline: 'EVA',
        departureDate: '2026-06-01',
        checkedAllowance: 23,
        carryOnAllowance: 7,
        personalAllowance: 0,
      },
    ];

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/overview']}>
          <Overview />
        </MemoryRouter>
      );
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button')).find(button => button.textContent?.includes('托運箱'))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const input = container.querySelector<HTMLInputElement>('[data-testid="luggage-allowance-input-checked"]');
    expect(input).toBeTruthy();
    expect(input?.value).toBe('23');

    await act(async () => {
      setInputValue(input!, '25');
      await Promise.resolve();
    });

    expect(input?.value).toBe('25');
    expect(dbLuggagesUpdateMock).not.toHaveBeenCalled();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-testid="luggage-allowance-save-checked"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(dbLuggagesUpdateMock).toHaveBeenCalledWith('checked', { allowanceOverrideKg: 25 });

    act(() => {
      root.unmount();
    });
  });

  it('adds allowance from companion tickets on the same future trip', async () => {
    liveQueryState.luggages = [
      {
        id: 'checked',
        name: 'Kevin 大行李箱',
        type: '托运',
        season: '通用',
        length: 68,
        width: 45,
        height: 27,
        weightHistory: [{ date: '2026-05-01', weight: 19 }],
        createdAt: 1,
      },
    ];
    liveQueryState.flights = [
      {
        id: 'kevin',
        destination: '東京',
        airline: 'EVA',
        departureDate: '2026-06-01',
        departureAirport: 'TPE',
        arrivalAirport: 'NRT',
        checkedAllowance: 20,
        carryOnAllowance: 7,
        personalAllowance: 0,
      },
      {
        id: 'partner',
        destination: '東京',
        airline: 'EVA',
        departureDate: '2026-06-01',
        departureAirport: 'TPE',
        arrivalAirport: 'NRT',
        checkedAllowance: 20,
        carryOnAllowance: 7,
        personalAllowance: 0,
      },
    ];

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/overview']}>
          <Overview />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('Kevin 大行李箱');
    expect(container.textContent).toContain('本次測量 19.0kg');
    expect(container.textContent).toContain('限額 40kg');

    act(() => {
      root.unmount();
    });
  });

  it('deletes the current upcoming trip and companion tickets from Overview', async () => {
    liveQueryState.flights = [
      {
        id: 'kevin',
        destination: '東京',
        airline: 'EVA',
        departureDate: '2026-06-01',
        departureAirport: 'TPE',
        arrivalAirport: 'NRT',
        checkedAllowance: 20,
        carryOnAllowance: 7,
        personalAllowance: 0,
      },
      {
        id: 'partner',
        destination: '東京',
        airline: 'EVA',
        departureDate: '2026-06-01',
        departureAirport: 'TPE',
        arrivalAirport: 'NRT',
        checkedAllowance: 20,
        carryOnAllowance: 7,
        personalAllowance: 0,
      },
      {
        id: 'later',
        destination: '倫敦',
        airline: 'China Airlines',
        departureDate: '2026-09-01',
        checkedAllowance: 23,
        carryOnAllowance: 7,
        personalAllowance: 0,
      },
    ];

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/overview']}>
          <Overview />
        </MemoryRouter>
      );
    });

    const deleteButton = container.querySelector<HTMLButtonElement>('[data-testid="overview-delete-upcoming-trip"]');
    expect(deleteButton).toBeTruthy();

    await act(async () => {
      deleteButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(dbFlightsDeleteMock).toHaveBeenCalledTimes(2);
    expect(dbFlightsDeleteMock).toHaveBeenCalledWith('kevin');
    expect(dbFlightsDeleteMock).toHaveBeenCalledWith('partner');
    expect(dbFlightsDeleteMock).not.toHaveBeenCalledWith('later');

    act(() => {
      root.unmount();
    });
  });

  it('expands unassigned items so they can be dragged into luggage', async () => {
    liveQueryState.luggages = [
      {
        id: 'checked',
        name: '托運箱',
        type: '托运',
        season: '通用',
        length: 68,
        width: 45,
        height: 27,
        weightHistory: [],
        createdAt: 2,
      },
    ];
    liveQueryState.items = [
      {
        id: 'loose-shirt',
        luggageId: '',
        name: '未分配襯衫',
        category: '衣物',
        subCategory: '上衣',
        season: '通用',
        condition: '新',
        isDiscardable: false,
        createdAt: 3,
      },
    ];

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/overview']}>
          <Overview />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('未分配');
    expect(container.textContent).not.toContain('未分配襯衫');

    await act(async () => {
      Array.from(container.querySelectorAll('button')).find(button => button.textContent?.includes('未分配'))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('未分配襯衫');

    act(() => {
      root.unmount();
    });
  });

  it('moves an item to another luggage by dragging it on the overview', async () => {
    liveQueryState.luggages = [
      {
        id: 'carry-on',
        name: '手提箱',
        type: '手提',
        season: '通用',
        length: 55,
        width: 35,
        height: 20,
        weightHistory: [],
        createdAt: 1,
      },
      {
        id: 'checked',
        name: '托運箱',
        type: '托运',
        season: '通用',
        length: 68,
        width: 45,
        height: 27,
        weightHistory: [],
        createdAt: 2,
      },
    ];
    liveQueryState.items = [
      {
        id: 'shirt',
        luggageId: 'carry-on',
        name: '白色襯衫',
        category: '衣物',
        subCategory: '上衣',
        season: '通用',
        condition: '新',
        isDiscardable: false,
        createdAt: 3,
      },
    ];

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/overview?packing=1']}>
          <Overview />
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    const itemCard = container.querySelector('[aria-label="拖移 白色襯衫"]');
    const targetLuggage = container.querySelector('[aria-label="移到 托運箱"]');
    expect(itemCard).toBeTruthy();
    expect(targetLuggage).toBeTruthy();

    await act(async () => {
      itemCard?.dispatchEvent(new Event('dragstart', { bubbles: true }));
    });

    await act(async () => {
      targetLuggage?.dispatchEvent(new Event('drop', { bubbles: true }));
      await Promise.resolve();
    });

    expect(dbItemsUpdateMock).toHaveBeenCalledWith('shirt', { luggageId: 'checked' });

    act(() => {
      root.unmount();
    });
  });

  it('moves an item with an explicit item-card action instead of precision dragging', async () => {
    liveQueryState.luggages = [
      {
        id: 'carry-on',
        name: '手提箱',
        type: '手提',
        season: '通用',
        length: 55,
        width: 35,
        height: 20,
        weightHistory: [],
        createdAt: 1,
      },
      {
        id: 'checked',
        name: '托運箱',
        type: '托运',
        season: '通用',
        length: 68,
        width: 45,
        height: 27,
        weightHistory: [],
        createdAt: 2,
      },
    ];
    liveQueryState.items = [
      {
        id: 'shirt',
        luggageId: 'carry-on',
        name: '白色襯衫',
        category: '衣物',
        subCategory: '上衣',
        season: '通用',
        condition: '新',
        isDiscardable: false,
        createdAt: 3,
      },
    ];

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/overview?packing=1']}>
          <Overview />
        </MemoryRouter>
      );
      await Promise.resolve();
    });

    const moveSelect = container.querySelector<HTMLSelectElement>('[data-testid="move-item-select-shirt"]');
    expect(moveSelect).toBeTruthy();

    await act(async () => {
      moveSelect!.value = 'checked';
      moveSelect!.dispatchEvent(new Event('change', { bubbles: true }));
      await Promise.resolve();
    });

    expect(dbItemsUpdateMock).toHaveBeenCalledWith('shirt', { luggageId: 'checked' });

    act(() => {
      root.unmount();
    });
  });

});
