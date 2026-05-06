import type { Flight } from '../db';

export interface FlightMemoryCsvResult {
  flights: Flight[];
  errors: string[];
}

const columnAliases: Record<string, string[]> = {
  departureDate: ['departuredate', 'date', 'flightdate', '出發日期', '出发日期', '日期'],
  departureTime: ['departuretime', 'time', '起飛時間', '起飞时间', '出發時間', '出发时间'],
  departureAirport: ['departureairport', 'from', 'fromairport', 'origin', '出發機場', '出发机场', '起飛機場', '起飞机场'],
  arrivalAirport: ['arrivalairport', 'to', 'toairport', 'destinationairport', '抵達機場', '抵达机场', '降落機場', '降落机场'],
  destination: ['destination', 'city', '目的地', '城市'],
  airline: ['airline', 'carrier', '航空公司', '航司'],
  flightNumber: ['flightnumber', 'flightno', 'flight', '航班編號', '航班编号'],
  returnDepartureDate: ['returndeparturedate', 'returndate', '回程日期', '回程出發日期', '回程出发日期'],
  returnDepartureTime: ['returndeparturetime', 'returntime', '回程起飛時間', '回程起飞时间'],
  returnDepartureAirport: ['returndepartureairport', 'returnfrom', '回程出發機場', '回程出发机场'],
  returnArrivalAirport: ['returnarrivalairport', 'returnto', '回程抵達機場', '回程抵达机场'],
  returnFlightNumber: ['returnflightnumber', 'returnflight', '回程航班編號', '回程航班编号'],
};

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/[\s_-]/g, '');

const normalizeDate = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return trimmed;
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const normalizeAirport = (value: string) => value.trim().toUpperCase();

const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ');

const parseCsvRows = (csv: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      if (row.some(cell => cell.trim())) rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some(cell => cell.trim())) rows.push(row);
  return rows;
};

const buildColumnMap = (headers: string[]) => {
  const normalizedHeaders = headers.map(normalizeHeader);
  const map = new Map<string, number>();

  for (const [field, aliases] of Object.entries(columnAliases)) {
    const index = normalizedHeaders.findIndex(header => aliases.includes(header));
    if (index >= 0) map.set(field, index);
  }

  return map;
};

const getValue = (row: string[], columnMap: Map<string, number>, field: string) => {
  const index = columnMap.get(field);
  return index === undefined ? '' : normalizeText(row[index] || '');
};

export const parseFlightMemoryCsv = (csv: string, idPrefix = 'csv-flight'): FlightMemoryCsvResult => {
  const rows = parseCsvRows(csv);
  if (rows.length === 0) {
    return { flights: [], errors: ['CSV 沒有可匯入的資料。'] };
  }

  const [headers, ...dataRows] = rows;
  const columnMap = buildColumnMap(headers);
  const flights: Flight[] = [];
  const errors: string[] = [];

  dataRows.forEach((row, index) => {
    const departureDate = normalizeDate(getValue(row, columnMap, 'departureDate'));
    const departureAirport = normalizeAirport(getValue(row, columnMap, 'departureAirport'));
    const arrivalAirport = normalizeAirport(getValue(row, columnMap, 'arrivalAirport'));

    if (!departureDate || !departureAirport || !arrivalAirport) {
      errors.push(`第 ${index + 2} 列缺少出發日期、出發機場或抵達機場，已略過。`);
      return;
    }

    const flightNumber = normalizeAirport(getValue(row, columnMap, 'flightNumber'));
    const returnDepartureDate = normalizeDate(getValue(row, columnMap, 'returnDepartureDate'));

    flights.push({
      id: `${idPrefix}-${index + 1}-${departureDate}-${departureAirport}-${arrivalAirport}`,
      departureDate,
      departureTime: getValue(row, columnMap, 'departureTime'),
      arrivalTime: '',
      destination: getValue(row, columnMap, 'destination') || arrivalAirport,
      airline: getValue(row, columnMap, 'airline'),
      flightNumber,
      departureAirport,
      arrivalAirport,
      departureTerminal: '',
      arrivalTerminal: '',
      returnDepartureDate,
      returnDepartureTime: getValue(row, columnMap, 'returnDepartureTime'),
      returnArrivalTime: '',
      returnFlightNumber: normalizeAirport(getValue(row, columnMap, 'returnFlightNumber')),
      returnDepartureAirport: normalizeAirport(getValue(row, columnMap, 'returnDepartureAirport')),
      returnArrivalAirport: normalizeAirport(getValue(row, columnMap, 'returnArrivalAirport')),
      returnDepartureTerminal: '',
      returnArrivalTerminal: '',
      checkedAllowance: 0,
      carryOnAllowance: 0,
      personalAllowance: 0,
      rawEmailId: 'csv-import',
    });
  });

  return { flights, errors };
};
