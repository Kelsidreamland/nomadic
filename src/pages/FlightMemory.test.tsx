// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Flight } from '../db';
import '../i18n';
import { FlightMemory } from './FlightMemory';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { liveFlights } = vi.hoisted(() => ({
  liveFlights: [] as Flight[],
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => liveFlights),
}));

vi.mock('../db', () => ({
  db: {
    flights: {
      toArray: vi.fn(),
      add: vi.fn(),
      bulkPut: vi.fn(),
    },
  },
}));

describe('FlightMemory MVP dashboard', () => {
  beforeEach(() => {
    liveFlights.length = 0;
  });

  it('shows import-first stats and removes the year timeline wall', () => {
    liveFlights.push({
      id: 'tokyo',
      departureDate: '2026-02-01',
      departureTime: '09:00',
      destination: 'Tokyo',
      airline: 'EVA Air',
      flightNumber: 'BR198',
      departureAirport: 'TPE',
      arrivalAirport: 'NRT',
      returnDepartureDate: '2026-02-08',
      returnDepartureAirport: 'NRT',
      returnArrivalAirport: 'TPE',
      checkedAllowance: 23,
      carryOnAllowance: 7,
      personalAllowance: 0,
    });

    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/memory']}>
          <FlightMemory />
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('今年航程');
    expect(container.textContent).toContain('去過國家');
    expect(container.textContent).toContain('最常去');
    expect(container.textContent).toContain('匯入 CSV');
    expect(container.textContent).toContain('上傳 PDF');
    expect(container.textContent).toContain('飛行路線圖');
    expect(container.textContent).not.toContain('飛行時間線');

    act(() => {
      root.unmount();
    });
  });
});
