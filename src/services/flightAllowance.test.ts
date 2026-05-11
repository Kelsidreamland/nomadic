import { describe, expect, it } from 'vitest';
import type { Flight } from '../db';
import { getCombinedAllowance, getPassengerCount } from './flightAllowance';

const makeFlight = (overrides: Partial<Flight>): Flight => ({
  id: 'flight',
  departureDate: '2026-06-01',
  destination: '東京',
  airline: 'EVA Air',
  checkedAllowance: 23,
  carryOnAllowance: 7,
  personalAllowance: 0,
  ...overrides,
});

describe('flight allowances', () => {
  it('multiplies baggage allowance by passenger count', () => {
    const flight = makeFlight({ passengerCount: 2 });

    expect(getPassengerCount(flight)).toBe(2);
    expect(getCombinedAllowance(flight, 'checkedAllowance')).toBe(46);
    expect(getCombinedAllowance(flight, 'carryOnAllowance')).toBe(14);
  });

  it('defaults to one passenger for existing trips', () => {
    const flight = makeFlight({});

    expect(getPassengerCount(flight)).toBe(1);
    expect(getCombinedAllowance(flight, 'checkedAllowance')).toBe(23);
  });
});
