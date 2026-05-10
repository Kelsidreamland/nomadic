import { describe, expect, it } from 'vitest';
import type { FlightMemorySegment } from './flightMemory';
import { buildFlightPassportData } from './flightPassportData';

const makeSegment = (overrides: Partial<FlightMemorySegment>): FlightMemorySegment => ({
  id: overrides.id || 'segment',
  flightId: overrides.flightId || 'flight',
  kind: 'outbound',
  departureDate: overrides.departureDate || '2026-01-01',
  departureTime: '08:00',
  arrivalTime: '12:00',
  from: 'TPE',
  to: 'SIN',
  destination: 'Singapore',
  airline: 'EVA Air',
  flightNumber: 'BR225',
  ...overrides,
});

describe('buildFlightPassportData', () => {
  it('turns memory segments into poster routes, stats, and a passport MRZ line', () => {
    const data = buildFlightPassportData([
      makeSegment({ id: 'tpe-sin', from: 'TPE', to: 'SIN', destination: 'Singapore' }),
      makeSegment({ id: 'tpe-icn', from: 'TPE', to: 'ICN', destination: 'Seoul' }),
      makeSegment({ id: 'tpe-lhr', from: 'TPE', to: 'LHR', destination: 'London', departureDate: '2025-11-01' }),
      makeSegment({ id: 'jfk-cdg', from: 'JFK', to: 'CDG', destination: 'Paris', departureDate: '2024-10-01' }),
      makeSegment({ id: 'tsa-hnd', from: 'TSA', to: 'HND', destination: 'Tokyo', departureDate: '2024-04-01' }),
    ]);

    expect(data.routes).toHaveLength(5);
    expect(data.routes[0]).toMatchObject({
      fromCode: 'TPE',
      toCode: 'SIN',
      coords: [
        [expect.any(Number), expect.any(Number)],
        [expect.any(Number), expect.any(Number)],
      ],
    });
    expect(data.stats).toMatchObject({
      flights: 5,
      countries: 5,
      topCountry: '🇸🇬 新加坡',
      yearRange: '2024-2026',
    });
    expect(data.mrzLine).toContain('NOMADIC<<TPE<SIN<ICN<LHR<JFK<CDG');
  });

  it('limits airport labels so dense map areas do not stack every code', () => {
    const data = buildFlightPassportData([
      makeSegment({ id: 'tpe-nrt', from: 'TPE', to: 'NRT' }),
      makeSegment({ id: 'tsa-hnd', from: 'TSA', to: 'HND' }),
      makeSegment({ id: 'tpe-icn', from: 'TPE', to: 'ICN' }),
      makeSegment({ id: 'tpe-bkk', from: 'TPE', to: 'BKK' }),
      makeSegment({ id: 'tpe-sgn', from: 'TPE', to: 'SGN' }),
      makeSegment({ id: 'tpe-sin', from: 'TPE', to: 'SIN' }),
      makeSegment({ id: 'tpe-lhr', from: 'TPE', to: 'LHR' }),
      makeSegment({ id: 'jfk-cdg', from: 'JFK', to: 'CDG' }),
    ]);

    expect(data.labelAirports.length).toBeLessThanOrEqual(6);
    expect(data.labelAirports.map(airport => airport.code)).toContain('TPE');
    expect(data.labelAirports.map(airport => airport.code)).not.toEqual(
      expect.arrayContaining(['NRT', 'HND', 'ICN', 'TSA']),
    );
  });
});
