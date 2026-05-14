// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Flight } from '../db';
import '../i18n';
import { FlightMemory } from './FlightMemory';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { liveFlights, flightsBulkPutMock, flightsDeleteMock, flightsBulkDeleteMock, analyzeTicketWithAIMock } = vi.hoisted(() => ({
  liveFlights: [] as Flight[],
  flightsBulkPutMock: vi.fn(),
  flightsDeleteMock: vi.fn(),
  flightsBulkDeleteMock: vi.fn(),
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
      delete: flightsDeleteMock,
      bulkDelete: flightsBulkDeleteMock,
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
    flightsDeleteMock.mockReset();
    flightsBulkDeleteMock.mockReset();
    analyzeTicketWithAIMock.mockReset();
    vi.restoreAllMocks();
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
    expect(container.textContent).toContain('已匯入航程');
    expect(container.textContent).not.toContain('TPE → NRT');
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="flight-memory-list-toggle"]')?.click();
    });
    expect(container.textContent).toContain('TPE → NRT');
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

  it('deletes an imported flight memory from the expanded list', async () => {
    liveFlights.push({
      id: 'bad-import',
      departureDate: '2024-01-05',
      departureTime: '09:00',
      destination: 'Tokyo',
      airline: 'EVA Air',
      flightNumber: 'BR198',
      departureAirport: 'TPE',
      arrivalAirport: 'NRT',
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

    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="flight-memory-list-toggle"]')?.click();
    });

    const deleteButton = container.querySelector<HTMLButtonElement>('[data-testid="delete-flight-memory-bad-import"]');
    expect(deleteButton).toBeTruthy();

    await act(async () => {
      deleteButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(flightsDeleteMock).toHaveBeenCalledWith('bad-import');

    act(() => {
      root.unmount();
    });
  });

  it('clears historical flight memories without deleting future trips', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    liveFlights.push(
      {
        id: 'demo-old-one',
        departureDate: '2024-01-05',
        departureTime: '09:00',
        destination: 'Tokyo',
        airline: 'EVA Air',
        flightNumber: 'BR198',
        departureAirport: 'TPE',
        arrivalAirport: 'NRT',
        checkedAllowance: 23,
        carryOnAllowance: 7,
        personalAllowance: 0,
      },
      {
        id: 'demo-old-two',
        departureDate: '2024-02-06',
        departureTime: '08:00',
        destination: 'Singapore',
        airline: 'Singapore Airlines',
        flightNumber: 'SQ879',
        departureAirport: 'TPE',
        arrivalAirport: 'SIN',
        checkedAllowance: 23,
        carryOnAllowance: 7,
        personalAllowance: 0,
      },
      {
        id: 'future-trip',
        departureDate: '2026-06-01',
        destination: 'Seoul',
        airline: 'Korean Air',
        departureAirport: 'TPE',
        arrivalAirport: 'ICN',
        checkedAllowance: 23,
        carryOnAllowance: 7,
        personalAllowance: 0,
      },
    );

    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/memory']}>
          <FlightMemory />
        </MemoryRouter>,
      );
    });

    const clearButton = container.querySelector<HTMLButtonElement>('[data-testid="clear-flight-memory-entries"]');
    expect(clearButton).toBeTruthy();

    await act(async () => {
      clearButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(flightsBulkDeleteMock).toHaveBeenCalledWith(['demo-old-two', 'demo-old-one']);
    expect(flightsBulkDeleteMock).not.toHaveBeenCalledWith(expect.arrayContaining(['future-trip']));

    act(() => {
      root.unmount();
    });
  });

  it('shows route diagnostics when imported airports cannot be mapped', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    });

    liveFlights.push(
      {
        id: 'known-route',
        departureDate: '2024-01-05',
        departureTime: '09:00',
        destination: 'Singapore',
        airline: 'EVA Air',
        flightNumber: 'BR225',
        departureAirport: 'TPE',
        arrivalAirport: 'SIN',
        checkedAllowance: 23,
        carryOnAllowance: 7,
        personalAllowance: 0,
      },
      {
        id: 'unknown-arrival',
        departureDate: '2024-01-06',
        departureTime: '09:00',
        destination: 'Unknown',
        airline: 'EVA Air',
        flightNumber: 'BR999',
        departureAirport: 'TPE',
        arrivalAirport: 'ZZZ',
        checkedAllowance: 23,
        carryOnAllowance: 7,
        personalAllowance: 0,
      },
      {
        id: 'unknown-departure',
        departureDate: '2024-01-07',
        departureTime: '09:00',
        destination: 'Kuala Lumpur',
        airline: 'EVA Air',
        flightNumber: 'BR998',
        departureAirport: 'AAA',
        arrivalAirport: 'KUL',
        checkedAllowance: 23,
        carryOnAllowance: 7,
        personalAllowance: 0,
      },
    );

    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/memory']}>
          <FlightMemory />
        </MemoryRouter>,
      );
    });

    await waitForAssertion(() => {
      expect(container.textContent).toContain('可繪製航線');
      expect(container.textContent).toContain('1 / 3');
      expect(container.textContent).toContain('未辨識機場');
      expect(container.textContent).toContain('ZZZ');
      expect(container.textContent).toContain('AAA');
    });

    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="flight-memory-diagnostics-toggle"]')?.click();
    });
    expect(container.textContent).toContain('2024-01-07 BR998：AAA → KUL，未辨識：AAA');
    expect(container.textContent).toContain('2024-01-06 BR999：TPE → ZZZ，未辨識：ZZZ');

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-testid="copy-flight-memory-diagnostics"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('2024-01-07 BR998：AAA → KUL，未辨識：AAA'));

    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="flight-memory-list-toggle"]')?.click();
    });
    expect(container.textContent).toContain('未辨識：AAA');
    expect(container.textContent).toContain('未辨識：ZZZ');

    act(() => {
      root.unmount();
    });
  });

  it('keeps the page usable if clearing imported flight memories fails', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    flightsBulkDeleteMock.mockRejectedValue(new Error('delete failed'));
    liveFlights.push({
      id: 'old-flight',
      departureDate: '2024-01-05',
      departureTime: '09:00',
      destination: 'Tokyo',
      airline: 'EVA Air',
      flightNumber: 'BR198',
      departureAirport: 'TPE',
      arrivalAirport: 'NRT',
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

    const clearButton = container.querySelector<HTMLButtonElement>('[data-testid="clear-flight-memory-entries"]');
    expect(clearButton).toBeTruthy();

    await act(async () => {
      clearButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    await waitForAssertion(() => {
      expect(container.textContent).toContain('清空航程失敗，請重新整理後再試。');
      expect(container.textContent).toContain('已匯入航程');
    });

    act(() => {
      root.unmount();
    });
  });
});
