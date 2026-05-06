// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Flight, Item, Luggage } from '../db';
import '../i18n';
import { Overview } from './Overview';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { liveQueryState, generateSmartInsightsMock } = vi.hoisted(() => ({
  liveQueryState: {
    callIndex: 0,
    luggages: [] as Luggage[],
    items: [] as Item[],
    flights: [] as Flight[],
  },
  generateSmartInsightsMock: vi.fn(),
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => {
    const values = [liveQueryState.luggages, liveQueryState.items, liveQueryState.flights];
    const value = values[liveQueryState.callIndex % values.length];
    liveQueryState.callIndex += 1;
    return value;
  }),
}));

vi.mock('../services/ai', () => ({
  generateSmartInsights: generateSmartInsightsMock,
}));

describe('Overview departure tools', () => {
  beforeEach(() => {
    localStorage.clear();
    liveQueryState.callIndex = 0;
    liveQueryState.luggages = [];
    liveQueryState.items = [];
    liveQueryState.flights = [];
    generateSmartInsightsMock.mockReset();
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
});
