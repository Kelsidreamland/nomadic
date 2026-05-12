import { describe, expect, it } from 'vitest';
import type { FlightMemorySegment } from './flightMemory';
import {
  getAirportCode,
  getCountryForMemorySegment,
  getRouteMapPoint,
} from './flightMemoryGeo';

const makeSegment = (overrides: Partial<FlightMemorySegment>): FlightMemorySegment => ({
  id: 'segment',
  flightId: 'flight',
  kind: 'outbound',
  departureDate: '2026-01-01',
  from: 'TPE 桃園',
  to: 'NRT 成田',
  destination: 'Tokyo',
  airline: 'EVA Air',
  ...overrides,
});

describe('getAirportCode', () => {
  it('extracts the leading airport code from mixed labels', () => {
    expect(getAirportCode('TPE 桃園')).toBe('TPE');
    expect(getAirportCode('nrt narita')).toBe('NRT');
  });
});

describe('getCountryForMemorySegment', () => {
  it('uses outbound arrival and return departure as the visited country', () => {
    expect(getCountryForMemorySegment(makeSegment({ kind: 'outbound', to: 'NRT 成田' }))).toMatchObject({
      code: 'JP',
      flag: '🇯🇵',
      name: '日本',
    });

    expect(getCountryForMemorySegment(makeSegment({ kind: 'return', from: 'SIN', to: 'TPE' }))).toMatchObject({
      code: 'SG',
      flag: '🇸🇬',
      name: '新加坡',
    });
  });
});

describe('getRouteMapPoint', () => {
  it('returns normalized map coordinates for known airport codes', () => {
    expect(getRouteMapPoint('TPE')).toMatchObject({
      code: 'TPE',
      x: expect.any(Number),
      y: expect.any(Number),
    });
  });

  it('covers common Flighty export airport codes for route rendering', () => {
    expect(['LAX', 'DXB', 'SYD', 'AMS', 'FCO', 'MNL'].map(code => getRouteMapPoint(code)?.code)).toEqual([
      'LAX',
      'DXB',
      'SYD',
      'AMS',
      'FCO',
      'MNL',
    ]);
  });

  it('uses city aliases when Flighty exports omit IATA codes', () => {
    expect(getRouteMapPoint('Tokyo')?.code).toBe('NRT');
    expect(getRouteMapPoint('Taipei')?.code).toBe('TPE');
    expect(getRouteMapPoint('Dubai')?.code).toBe('DXB');
  });
});
