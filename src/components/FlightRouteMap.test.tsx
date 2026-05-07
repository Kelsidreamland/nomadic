// @vitest-environment jsdom

import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, expect, it } from 'vitest';
import '../i18n';
import type { FlightMemorySegment } from '../services/flightMemory';
import { FlightRouteMap } from './FlightRouteMap';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const makeSegment = (overrides: Partial<FlightMemorySegment>): FlightMemorySegment => ({
  id: 'segment',
  flightId: 'flight',
  kind: 'outbound',
  departureDate: '2026-01-01',
  departureTime: '08:00',
  arrivalTime: '12:00',
  from: 'TPE',
  to: 'SIN',
  destination: 'Singapore',
  airline: 'EVA Air',
  flightNumber: 'BR225',
  ...overrides,
});

describe('FlightRouteMap', () => {
  it('renders a vector world map with route arcs and airport markers', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <FlightRouteMap
          segments={[
            makeSegment({ id: 'tpe-sin', from: 'TPE', to: 'SIN' }),
            makeSegment({ id: 'tpe-lhr', from: 'TPE', to: 'LHR' }),
          ]}
        />,
      );
    });

    expect(container.querySelector('[data-testid="flight-route-world-map"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-testid="flight-route-land"]').length).toBeGreaterThan(5);
    expect(container.querySelectorAll('[data-testid="flight-route-arc"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-testid="flight-route-airport"]').length).toBeGreaterThanOrEqual(3);

    act(() => {
      root.unmount();
    });
  });
});
