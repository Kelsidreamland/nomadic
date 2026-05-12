// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Flight } from '../db';
import '../i18n';
import { Dashboard } from './Dashboard';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const setInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const { liveQueryState, flightsAddMock, flightsUpdateMock } = vi.hoisted(() => ({
  liveQueryState: {
    flights: [] as Flight[],
  },
  flightsAddMock: vi.fn(),
  flightsUpdateMock: vi.fn(),
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => liveQueryState.flights),
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

  it('does not show the old standalone weight-vs-limit dashboard card', async () => {
    liveQueryState.flights = [
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
        <MemoryRouter initialEntries={['/']}>
          <Dashboard />
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('首爾');
    expect(container.textContent).not.toContain('重量 vs 限額');

    act(() => {
      root.unmount();
    });
  });

  it('keeps companion-ticket action disabled until a flight route is filled', async () => {
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

    const companionButton = container.querySelector<HTMLButtonElement>('[data-testid="dashboard-add-companion-ticket"]');
    expect(companionButton).toBeTruthy();
    expect(companionButton?.disabled).toBe(true);

    act(() => {
      root.unmount();
    });
  });

  it('does not save historical form data as a companion ticket', async () => {
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

    const textInputs = container.querySelectorAll<HTMLInputElement>('input[type="text"]');
    const dateInput = container.querySelector<HTMLInputElement>('input[type="date"]');
    expect(textInputs[0]).toBeTruthy();
    expect(dateInput).toBeTruthy();

    await act(async () => {
      setInputValue(textInputs[0], '東京');
      setInputValue(dateInput!, '2024-01-05');
      await Promise.resolve();
    });

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-testid="dashboard-add-companion-ticket"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(flightsAddMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain('即將出發');

    act(() => {
      root.unmount();
    });
  });
});
