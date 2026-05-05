import { describe, expect, it } from 'vitest';
import type { Flight } from '../db';
import {
  getFlightMemoryEntries,
  getFlightMemorySegments,
  getFlightMemoryStats,
  getUpcomingFlight,
} from './flightMemory';

const makeFlight = (overrides: Partial<Flight>): Flight => ({
  id: overrides.id || 'flight',
  departureDate: overrides.departureDate || '2026-05-06',
  departureTime: overrides.departureTime || '',
  arrivalTime: overrides.arrivalTime || '',
  destination: overrides.destination || 'Tokyo',
  airline: overrides.airline || 'EVA Air',
  flightNumber: overrides.flightNumber || '',
  departureAirport: overrides.departureAirport || '',
  arrivalAirport: overrides.arrivalAirport || '',
  departureTerminal: overrides.departureTerminal || '',
  arrivalTerminal: overrides.arrivalTerminal || '',
  returnDepartureDate: overrides.returnDepartureDate || '',
  returnDepartureTime: overrides.returnDepartureTime || '',
  returnArrivalTime: overrides.returnArrivalTime || '',
  returnFlightNumber: overrides.returnFlightNumber || '',
  returnDepartureAirport: overrides.returnDepartureAirport || '',
  returnArrivalAirport: overrides.returnArrivalAirport || '',
  returnDepartureTerminal: overrides.returnDepartureTerminal || '',
  returnArrivalTerminal: overrides.returnArrivalTerminal || '',
  checkedAllowance: overrides.checkedAllowance ?? 20,
  carryOnAllowance: overrides.carryOnAllowance ?? 7,
  personalAllowance: overrides.personalAllowance ?? 0,
});

describe('getUpcomingFlight', () => {
  it('ignores historical flights and returns the nearest future flight', () => {
    const today = new Date(2026, 4, 6, 10);
    const result = getUpcomingFlight([
      makeFlight({ id: 'past', departureDate: '2024-02-01', destination: 'Paris' }),
      makeFlight({ id: 'later', departureDate: '2026-06-20', departureTime: '09:00', destination: 'London' }),
      makeFlight({ id: 'next', departureDate: '2026-05-07', departureTime: '22:30', destination: 'Seoul' }),
    ], today);

    expect(result?.id).toBe('next');
  });

  it('keeps same-day flights eligible and sorts them by departure time', () => {
    const today = new Date(2026, 4, 6, 10);
    const result = getUpcomingFlight([
      makeFlight({ id: 'night', departureDate: '2026-05-06', departureTime: '23:50' }),
      makeFlight({ id: 'morning', departureDate: '2026-05-06', departureTime: '08:30' }),
    ], today);

    expect(result?.id).toBe('morning');
  });
});

describe('getFlightMemoryEntries', () => {
  it('returns historical flights newest first', () => {
    const today = new Date(2026, 4, 6, 10);
    const result = getFlightMemoryEntries([
      makeFlight({ id: 'future', departureDate: '2026-06-20' }),
      makeFlight({ id: 'older', departureDate: '2023-03-12' }),
      makeFlight({ id: 'newer', departureDate: '2025-11-02' }),
    ], today);

    expect(result.map(flight => flight.id)).toEqual(['newer', 'older']);
  });
});

describe('getFlightMemorySegments', () => {
  it('creates a separate memory segment for return-trip data', () => {
    const segments = getFlightMemorySegments([
      makeFlight({
        id: 'taipei-tokyo',
        departureDate: '2025-11-02',
        departureTime: '07:30',
        arrivalTime: '11:35',
        departureAirport: 'TPE 桃園',
        arrivalAirport: 'NRT 成田',
        destination: 'Tokyo',
        airline: 'EVA Air',
        flightNumber: 'BR198',
        returnDepartureDate: '2025-11-10',
        returnDepartureTime: '13:00',
        returnArrivalTime: '16:05',
        returnDepartureAirport: 'NRT 成田',
        returnArrivalAirport: 'TPE 桃園',
        returnFlightNumber: 'BR197',
      }),
    ]);

    expect(segments).toMatchObject([
      {
        id: 'taipei-tokyo:return',
        kind: 'return',
        departureDate: '2025-11-10',
        from: 'NRT 成田',
        to: 'TPE 桃園',
        flightNumber: 'BR197',
      },
      {
        id: 'taipei-tokyo:outbound',
        kind: 'outbound',
        departureDate: '2025-11-02',
        from: 'TPE 桃園',
        to: 'NRT 成田',
        flightNumber: 'BR198',
      },
    ]);
  });
});

describe('getFlightMemoryStats', () => {
  it('summarizes segments, airports, destinations, and airlines', () => {
    const stats = getFlightMemoryStats(getFlightMemorySegments([
      makeFlight({
        id: 'one',
        departureDate: '2025-11-02',
        departureAirport: 'TPE',
        arrivalAirport: 'NRT',
        destination: 'Tokyo',
        airline: 'EVA Air',
      }),
      makeFlight({
        id: 'two',
        departureDate: '2024-04-20',
        departureAirport: 'NRT',
        arrivalAirport: 'LHR',
        destination: 'London',
        airline: 'British Airways',
      }),
    ]));

    expect(stats).toEqual({
      totalSegments: 2,
      uniqueAirports: 3,
      uniqueDestinations: 2,
      uniqueAirlines: 2,
      yearRange: '2024-2025',
    });
  });
});
