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

  it('keeps all airport labels for normal route sets and assigns dense-area label positions', () => {
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

    const labelCodes = data.labelAirports.map(airport => airport.code);
    expect(labelCodes).toEqual(
      expect.arrayContaining(['TPE', 'NRT', 'TSA', 'HND', 'ICN', 'BKK', 'SGN', 'SIN', 'LHR', 'JFK', 'CDG']),
    );
    expect(data.labelAirports).toHaveLength(data.airports.length);
    expect(data.labelAirports.find(airport => airport.code === 'NRT')).toMatchObject({
      labelPosition: 'left',
      labelOffset: [-10, 12],
    });
    expect(data.labelAirports.find(airport => airport.code === 'HND')).toMatchObject({
      labelPosition: 'left',
      labelOffset: [-10, -10],
    });
  });

  it('reports unknown airports so imported CSV issues are diagnosable', () => {
    const data = buildFlightPassportData([
      makeSegment({ id: 'known', from: 'TPE', to: 'SIN' }),
      makeSegment({ id: 'unknown-arrival', from: 'TPE', to: 'ZZZ' }),
      makeSegment({ id: 'unknown-departure', from: 'AAA', to: 'KUL' }),
      makeSegment({ id: 'same-unknown-twice', from: 'AAA', to: 'ZZZ' }),
    ]);

    expect(data.routes).toHaveLength(1);
    expect(data.diagnostics).toMatchObject({
      totalSegments: 4,
      drawableRoutes: 1,
      unresolvedSegmentCount: 3,
    });
    expect(data.diagnostics.unresolvedAirports).toEqual([
      { value: 'ZZZ', count: 2 },
      { value: 'AAA', count: 2 },
    ]);
  });
});
