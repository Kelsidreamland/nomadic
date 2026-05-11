// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Flight } from '../db';
import '../i18n';
import { FlightMemory } from './FlightMemory';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { liveFlights, flightsBulkPutMock, analyzeTicketWithAIMock } = vi.hoisted(() => ({
  liveFlights: [] as Flight[],
  flightsBulkPutMock: vi.fn(),
  analyzeTicketWithAIMock: vi.fn(),
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => liveFlights),
}));

vi.mock('../db', () => ({
  db: {
    flights: {
      toArray: vi.fn(),
      add: vi.fn(),
      bulkPut: flightsBulkPutMock,
    },
  },
}));

vi.mock('../services/ai', () => ({
  analyzeTicketWithAI: analyzeTicketWithAIMock,
}));

const waitForAssertion = async (assertion: () => void) => {
  const deadline = Date.now() + 1000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
    }
  }

  assertion();
  if (lastError) throw lastError;
};

describe('FlightMemory MVP dashboard', () => {
  beforeEach(() => {
    liveFlights.length = 0;
    flightsBulkPutMock.mockReset();
    analyzeTicketWithAIMock.mockReset();
  });

  it('shows import-first stats and removes the year timeline wall', async () => {
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
    await waitForAssertion(() => {
      expect(container.textContent).toContain('飛行護照');
    });
    expect(container.textContent).not.toContain('飛行時間線');

    act(() => {
      root.unmount();
    });
  });

  it('imports a PDF itinerary into flight memory with AI parsing', async () => {
    analyzeTicketWithAIMock.mockResolvedValue({
      destination: '東京',
      airline: 'EVA Air',
      flightNumber: 'BR198',
      departureDate: '2026-06-01',
      departureTime: '09:00',
      departureAirport: 'TPE 桃園',
      arrivalAirport: 'NRT 成田',
      checkedAllowance: '23kg',
      carryOnAllowance: '7kg',
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

    const pdfInput = container.querySelector('input[accept=".pdf,image/*"]') as HTMLInputElement | null;
    expect(pdfInput).toBeTruthy();

    const file = new File(['%PDF-1.4'], 'ticket.pdf', { type: 'application/pdf' });
    Object.defineProperty(pdfInput, 'files', {
      configurable: true,
      value: [file],
    });

    act(() => {
      pdfInput?.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await waitForAssertion(() => {
      expect(analyzeTicketWithAIMock).toHaveBeenCalledWith(expect.stringContaining('data:application/pdf;base64,'), 'application/pdf');
    });
    await waitForAssertion(() => {
      expect(flightsBulkPutMock).toHaveBeenCalledWith([
        expect.objectContaining({
          destination: '東京',
          airline: 'EVA Air',
          flightNumber: 'BR198',
          departureDate: '2026-06-01',
          departureTime: '09:00',
          departureAirport: 'TPE',
          arrivalAirport: 'NRT',
          checkedAllowance: 23,
          carryOnAllowance: 7,
          rawEmailId: 'pdf-import',
        }),
      ]);
    });
    await waitForAssertion(() => {
      expect(container.textContent).toContain('已從 1 個檔案匯入 1 段航班');
    });

    act(() => {
      root.unmount();
    });
  });
});
