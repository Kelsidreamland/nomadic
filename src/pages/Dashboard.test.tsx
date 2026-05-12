// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Flight, Luggage } from '../db';
import '../i18n';
import { Dashboard } from './Dashboard';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { liveQueryState, flightsAddMock, flightsUpdateMock } = vi.hoisted(() => ({
  liveQueryState: {
    callIndex: 0,
    luggages: [] as Luggage[],
    flights: [] as Flight[],
  },
  flightsAddMock: vi.fn(),
  flightsUpdateMock: vi.fn(),
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => {
    const values = [liveQueryState.luggages, liveQueryState.flights];
    const value = values[liveQueryState.callIndex % values.length];
    liveQueryState.callIndex += 1;
    return value;
  }),
}));

vi.mock('../db', () => ({
  db: {
    flights: {
      add: flightsAddMock,
      update: flightsUpdateMock,
      toArray: vi.fn(),
    },
  },
}));

vi.mock('../services/google', () => ({
  getGeoIpLocation: vi.fn().mockResolvedValue('Global'),
}));

vi.mock('../services/ai', () => ({
  analyzeTicketWithAI: vi.fn(),
}));

describe('Dashboard flight form', () => {
  beforeEach(() => {
    localStorage.setItem('nomadic_onboarded', 'true');
    liveQueryState.callIndex = 0;
    liveQueryState.luggages = [];
    liveQueryState.flights = [];
    flightsAddMock.mockReset();
    flightsUpdateMock.mockReset();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callback(0);
      return 0;
    });
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  it('uses seat number and companion-ticket action instead of a passenger count field', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <Dashboard />
        </MemoryRouter>,
      );
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button')).find(button => button.textContent?.includes('手動輸入'))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('座位');
    expect(container.textContent).toContain('新增同行機票');
    expect(container.textContent).not.toContain('旅客數');

    act(() => {
      root.unmount();
    });
  });
});
