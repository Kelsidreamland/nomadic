import type { FlightMemorySegment } from './flightMemory';
import {
  getCountryVisits,
  getRouteMapPoint,
  type RouteMapPoint,
} from './flightMemoryGeo';

type Coordinate = [number, number];

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
}

export interface FlightPassportStats {
  flights: number;
  countries: number;
  airports: number;
  topCountry: string;
  yearRange: string;
  countryFlags: string[];
}

export interface FlightPassportData {
  routes: FlightPassportRoute[];
  airports: FlightPassportAirport[];
  labelAirports: FlightPassportAirport[];
  stats: FlightPassportStats;
  mrzLine: string;
}

interface AirportAccumulator {
  point: RouteMapPoint;
  visits: number;
  firstIndex: number;
  routeKilometers: number;
}

const toCoordinate = (point: RouteMapPoint): Coordinate => [point.lon, point.lat];

const toAirport = (accumulator: AirportAccumulator): FlightPassportAirport => ({
  code: accumulator.point.code,
  label: accumulator.point.label,
  lon: accumulator.point.lon,
  lat: accumulator.point.lat,
  visits: accumulator.visits,
});

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

const chooseLabelAirports = (airports: AirportAccumulator[]) => {
  const sorted = [...airports].sort((a, b) => {
    const scoreA = a.visits * 10000 + a.routeKilometers;
    const scoreB = b.visits * 10000 + b.routeKilometers;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.firstIndex - b.firstIndex;
  });

  const selected: AirportAccumulator[] = [];
  for (const airport of sorted) {
    const isFarEnough = selected.every(selectedAirport => (
      getRouteKilometers(airport.point, selectedAirport.point) >= 2500
    ));
    if (!isFarEnough) continue;
    selected.push(airport);
    if (selected.length >= 6) break;
  }

  if (selected.length < 2) {
    for (const airport of sorted) {
      if (selected.some(selectedAirport => selectedAirport.point.code === airport.point.code)) continue;
      selected.push(airport);
      if (selected.length >= Math.min(2, sorted.length)) break;
    }
  }

  return selected
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

  const routes = segments
    .map((segment, index): FlightPassportRoute | undefined => {
      const from = getRouteMapPoint(segment.from);
      const to = getRouteMapPoint(segment.to);
      if (!from || !to) return undefined;

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
    mrzLine: buildMrzLine(airportCodes),
  };
};
