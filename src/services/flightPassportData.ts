import type { FlightMemorySegment } from './flightMemory';
import {
  getCountryVisits,
  getRouteMapPoint,
  type RouteMapPoint,
} from './flightMemoryGeo';

type Coordinate = [number, number];
type AirportLabelPosition = 'top' | 'right' | 'bottom' | 'left';

export interface FlightPassportRoute {
  id: string;
  fromCode: string;
  toCode: string;
  fromLabel: string;
  toLabel: string;
  coords: [Coordinate, Coordinate];
  departureDate: string;
  flightNumber?: string;
}

export interface FlightPassportAirport {
  code: string;
  label: string;
  lon: number;
  lat: number;
  visits: number;
  labelPosition: AirportLabelPosition;
  labelOffset: [number, number];
}

export interface FlightPassportStats {
  flights: number;
  countries: number;
  airports: number;
  topCountry: string;
  yearRange: string;
  countryFlags: string[];
}

export interface FlightPassportUnresolvedAirport {
  value: string;
  count: number;
}

export interface FlightPassportDiagnostics {
  totalSegments: number;
  drawableRoutes: number;
  unresolvedSegmentCount: number;
  unresolvedAirports: FlightPassportUnresolvedAirport[];
}

export interface FlightPassportData {
  routes: FlightPassportRoute[];
  airports: FlightPassportAirport[];
  labelAirports: FlightPassportAirport[];
  stats: FlightPassportStats;
  diagnostics: FlightPassportDiagnostics;
  mrzLine: string;
}

interface AirportAccumulator {
  point: RouteMapPoint;
  visits: number;
  firstIndex: number;
  routeKilometers: number;
}

interface UnresolvedAirportAccumulator {
  value: string;
  count: number;
  firstIndex: number;
}

const toCoordinate = (point: RouteMapPoint): Coordinate => [point.lon, point.lat];

const airportLabelLayout: Record<string, { position: AirportLabelPosition; offset: [number, number] }> = {
  BKK: { position: 'left', offset: [-2, 2] },
  CDG: { position: 'top', offset: [0, -1] },
  HKG: { position: 'bottom', offset: [0, 3] },
  HND: { position: 'left', offset: [-10, -10] },
  ICN: { position: 'top', offset: [-14, -18] },
  IST: { position: 'top', offset: [0, -2] },
  JFK: { position: 'left', offset: [-2, 0] },
  KIX: { position: 'bottom', offset: [0, 8] },
  LHR: { position: 'left', offset: [-2, -1] },
  NRT: { position: 'left', offset: [-10, 12] },
  SIN: { position: 'bottom', offset: [0, 3] },
  SGN: { position: 'left', offset: [-2, 0] },
  TPE: { position: 'bottom', offset: [0, 20] },
  TSA: { position: 'left', offset: [-2, 0] },
};

const getAirportLabelLayout = (code: string) => airportLabelLayout[code] || {
  position: 'right' as AirportLabelPosition,
  offset: [2, 0] as [number, number],
};

const toAirport = (accumulator: AirportAccumulator): FlightPassportAirport => {
  const layout = getAirportLabelLayout(accumulator.point.code);
  return {
  code: accumulator.point.code,
  label: accumulator.point.label,
  lon: accumulator.point.lon,
  lat: accumulator.point.lat,
  visits: accumulator.visits,
    labelPosition: layout.position,
    labelOffset: layout.offset,
  };
};

const getRouteKilometers = (from: RouteMapPoint, to: RouteMapPoint) => {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(to.lat - from.lat);
  const dLon = toRadians(to.lon - from.lon);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);

  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getYearRange = (segments: FlightMemorySegment[]) => {
  const years = Array.from(new Set(
    segments
      .map(segment => segment.departureDate.slice(0, 4))
      .filter(Boolean),
  )).sort();

  if (years.length === 0) return '';
  const first = years[0];
  const last = years[years.length - 1];
  return first === last ? first : `${first}-${last}`;
};

const addAirport = (
  airports: Map<string, AirportAccumulator>,
  point: RouteMapPoint,
  routeKilometers: number,
  index: number,
) => {
  const current = airports.get(point.code);
  airports.set(point.code, {
    point,
    visits: (current?.visits || 0) + 1,
    firstIndex: current?.firstIndex ?? index,
    routeKilometers: (current?.routeKilometers || 0) + routeKilometers,
  });
};

const normalizeUnresolvedAirport = (value?: string) => value?.trim().replace(/\s+/g, ' ').toUpperCase() || '';

const addUnresolvedAirport = (
  unresolvedAirports: Map<string, UnresolvedAirportAccumulator>,
  value: string | undefined,
  index: number,
) => {
  const normalized = normalizeUnresolvedAirport(value);
  if (!normalized) return;

  const current = unresolvedAirports.get(normalized);
  unresolvedAirports.set(normalized, {
    value: normalized,
    count: (current?.count || 0) + 1,
    firstIndex: current?.firstIndex ?? index,
  });
};

const chooseLabelAirports = (airports: AirportAccumulator[], maxLabels = 18) => {
  if (airports.length <= maxLabels) {
    return [...airports]
      .sort((a, b) => a.firstIndex - b.firstIndex)
      .map(toAirport);
  }

  const sorted = [...airports].sort((a, b) => {
    const scoreA = a.visits * 10000 + a.routeKilometers;
    const scoreB = b.visits * 10000 + b.routeKilometers;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.firstIndex - b.firstIndex;
  });

  return sorted
    .slice(0, maxLabels)
    .sort((a, b) => a.firstIndex - b.firstIndex)
    .map(toAirport);
};

const buildMrzLine = (airportCodes: string[]) => {
  const codeBlock = airportCodes.join('<');
  return `NOMADIC<<${codeBlock}<FLIGHT<MEMORY<PASSPORT`;
};

export const buildFlightPassportData = (segments: FlightMemorySegment[]): FlightPassportData => {
  const airportCodes: string[] = [];
  const airportCodeSet = new Set<string>();
  const airportAccumulators = new Map<string, AirportAccumulator>();
  const unresolvedAirports = new Map<string, UnresolvedAirportAccumulator>();
  let unresolvedSegmentCount = 0;

  const routes = segments
    .map((segment, index): FlightPassportRoute | undefined => {
      const from = getRouteMapPoint(segment.from);
      const to = getRouteMapPoint(segment.to);
      if (!from || !to) {
        unresolvedSegmentCount += 1;
        if (!from) addUnresolvedAirport(unresolvedAirports, segment.from, index);
        if (!to) addUnresolvedAirport(unresolvedAirports, segment.to, index);
        return undefined;
      }

      const routeKilometers = getRouteKilometers(from, to);
      addAirport(airportAccumulators, from, routeKilometers, index);
      addAirport(airportAccumulators, to, routeKilometers, index);

      for (const code of [from.code, to.code]) {
        if (airportCodeSet.has(code)) continue;
        airportCodeSet.add(code);
        airportCodes.push(code);
      }

      return {
        id: segment.id,
        fromCode: from.code,
        toCode: to.code,
        fromLabel: from.label,
        toLabel: to.label,
        coords: [toCoordinate(from), toCoordinate(to)],
        departureDate: segment.departureDate,
        flightNumber: segment.flightNumber,
      };
    })
    .filter((route): route is FlightPassportRoute => Boolean(route));

  const countryStats = getCountryVisits(segments);
  const topCountry = countryStats[0];
  const airports = Array.from(airportAccumulators.values())
    .sort((a, b) => a.firstIndex - b.firstIndex)
    .map(toAirport);

  return {
    routes,
    airports,
    labelAirports: chooseLabelAirports(Array.from(airportAccumulators.values())),
    stats: {
      flights: routes.length,
      countries: countryStats.length,
      airports: airports.length,
      topCountry: topCountry ? `${topCountry.flag} ${topCountry.name}` : '',
      yearRange: getYearRange(segments),
      countryFlags: countryStats.map(country => country.flag),
    },
    diagnostics: {
      totalSegments: segments.length,
      drawableRoutes: routes.length,
      unresolvedSegmentCount,
      unresolvedAirports: Array.from(unresolvedAirports.values())
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return a.firstIndex - b.firstIndex;
        })
        .map(({ value, count }) => ({ value, count })),
    },
    mrzLine: buildMrzLine(airportCodes),
  };
};
