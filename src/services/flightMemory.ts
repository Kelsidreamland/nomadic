import type { Flight } from '../db';

export interface FlightMemorySegment {
  id: string;
  flightId: string;
  kind: 'outbound' | 'return';
  departureDate: string;
  departureTime?: string;
  arrivalTime?: string;
  from?: string;
  to?: string;
  destination: string;
  airline: string;
  flightNumber?: string;
}

export interface FlightMemoryStats {
  totalSegments: number;
  uniqueAirports: number;
  uniqueDestinations: number;
  uniqueAirlines: number;
  yearRange: string;
}

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const sortKey = (date?: string, time?: string) => `${date || '0000-00-00'}T${time || '00:00'}`;

const sortFlightsAscending = (a: Flight, b: Flight) => {
  return sortKey(a.departureDate, a.departureTime).localeCompare(sortKey(b.departureDate, b.departureTime));
};

const sortFlightsDescending = (a: Flight, b: Flight) => {
  return sortFlightsAscending(b, a);
};

const sortSegmentsDescending = (a: FlightMemorySegment, b: FlightMemorySegment) => {
  return sortKey(b.departureDate, b.departureTime).localeCompare(sortKey(a.departureDate, a.departureTime));
};

const hasReturnSegment = (flight: Flight) => Boolean(
  flight.returnDepartureDate ||
  flight.returnDepartureTime ||
  flight.returnArrivalTime ||
  flight.returnFlightNumber ||
  flight.returnDepartureAirport ||
  flight.returnArrivalAirport
);

export const getUpcomingFlight = (flights: Flight[], now: Date | number = new Date()) => {
  const today = toDateKey(now instanceof Date ? now : new Date(now));
  return [...flights]
    .filter(flight => flight.departureDate >= today)
    .sort(sortFlightsAscending)[0];
};

export const getFlightMemoryEntries = (flights: Flight[], now: Date | number = new Date()) => {
  const today = toDateKey(now instanceof Date ? now : new Date(now));
  return [...flights]
    .filter(flight => flight.departureDate < today)
    .sort(sortFlightsDescending);
};

export const getFlightMemorySegments = (flights: Flight[]): FlightMemorySegment[] => {
  const segments = flights.flatMap((flight): FlightMemorySegment[] => {
    const outbound: FlightMemorySegment = {
      id: `${flight.id}:outbound`,
      flightId: flight.id,
      kind: 'outbound',
      departureDate: flight.departureDate,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      from: flight.departureAirport,
      to: flight.arrivalAirport,
      destination: flight.destination,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
    };

    if (!hasReturnSegment(flight)) return [outbound];

    const returnSegment: FlightMemorySegment = {
      id: `${flight.id}:return`,
      flightId: flight.id,
      kind: 'return',
      departureDate: flight.returnDepartureDate || flight.departureDate,
      departureTime: flight.returnDepartureTime,
      arrivalTime: flight.returnArrivalTime,
      from: flight.returnDepartureAirport,
      to: flight.returnArrivalAirport,
      destination: flight.returnArrivalAirport || flight.destination,
      airline: flight.airline,
      flightNumber: flight.returnFlightNumber || flight.flightNumber,
    };

    return [outbound, returnSegment];
  });

  return segments.sort(sortSegmentsDescending);
};

export const getFlightMemoryStats = (segments: FlightMemorySegment[]): FlightMemoryStats => {
  const airports = new Set<string>();
  const destinations = new Set<string>();
  const airlines = new Set<string>();
  const years = new Set<string>();

  for (const segment of segments) {
    if (segment.from) airports.add(segment.from.trim());
    if (segment.to) airports.add(segment.to.trim());
    if (segment.destination) destinations.add(segment.destination.trim());
    if (segment.airline) airlines.add(segment.airline.trim());
    if (segment.departureDate) years.add(segment.departureDate.slice(0, 4));
  }

  const sortedYears = Array.from(years).sort();

  return {
    totalSegments: segments.length,
    uniqueAirports: airports.size,
    uniqueDestinations: destinations.size,
    uniqueAirlines: airlines.size,
    yearRange: sortedYears.length === 0
      ? ''
      : sortedYears[0] === sortedYears[sortedYears.length - 1]
        ? sortedYears[0]
        : `${sortedYears[0]}-${sortedYears[sortedYears.length - 1]}`,
  };
};
