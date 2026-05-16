import type { Flight } from '../db';

export interface FlightMemoryCsvResult {
  flights: Flight[];
  errors: string[];
}

const columnAliases: Record<string, string[]> = {
  departureDate: ['departuredate', 'date', 'flightdate', '出發日期', '出发日期', '日期'],
  departureTime: ['departuretime', 'time', '起飛時間', '起飞时间', '出發時間', '出发时间'],
  departureAirport: ['departureairport', 'from', 'fromairport', 'origin', 'origincode', 'start', 'departure', 'dep', '出發機場', '出发机场', '起飛機場', '起飞机场'],
  arrivalAirport: ['arrivalairport', 'to', 'toairport', 'destinationairport', 'destination', 'dest', 'arrival', 'arr', '抵達機場', '抵达机场', '降落機場', '降落机场'],
  destination: ['destination', 'city', '目的地', '城市'],
  airline: ['airline', 'carrier', '航空公司', '航司'],
  flightNumber: ['flightnumber', 'flightno', 'flight', '航班編號', '航班编号'],
  returnDepartureDate: ['returndeparturedate', 'returndate', '回程日期', '回程出發日期', '回程出发日期'],
  returnDepartureTime: ['returndeparturetime', 'returntime', '回程起飛時間', '回程起飞时间'],
  returnDepartureAirport: ['returndepartureairport', 'returnfrom', '回程出發機場', '回程出发机场'],
  returnArrivalAirport: ['returnarrivalairport', 'returnto', '回程抵達機場', '回程抵达机场'],
  returnFlightNumber: ['returnflightnumber', 'returnflight', '回程航班編號', '回程航班编号'],
  seatNumber: ['seatnumber', 'seat', '座位', '座位號碼', '座位号码'],
};

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/[\s_-]/g, '');

const monthNumbers: Record<string, string> = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
};

const normalizeYear = (value: string) => {
  if (value.length === 2) return `20${value}`;
  return value;
};

const formatDateParts = (year: string, month: string, day: string) => {
  return `${normalizeYear(year)}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const normalizeDate = (value: string) => {
  const trimmed = value.trim().replace(/^[A-Za-z]{3,9},\s+/, '');
  if (!trimmed) return '';

  const isoMatch = trimmed.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return formatDateParts(year, month, day);
  }

  const slashMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);
  if (slashMatch) {
    const [, first, second, year] = slashMatch;
    const isDayFirst = Number(first) > 12 && Number(second) <= 12;
    return isDayFirst
      ? formatDateParts(year, second, first)
      : formatDateParts(year, first, second);
  }

  const monthFirstMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{2}|\d{4})$/);
  if (monthFirstMatch) {
    const [, monthName, day, year] = monthFirstMatch;
    const month = monthNumbers[monthName.toLowerCase()];
    return month ? formatDateParts(year, month, day) : '';
  }

  const dayFirstMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{2}|\d{4})$/);
  if (dayFirstMatch) {
    const [, day, monthName, year] = dayFirstMatch;
    const month = monthNumbers[monthName.toLowerCase()];
    return month ? formatDateParts(year, month, day) : '';
  }

  const zhDateMatch = trimmed.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?/);
  if (zhDateMatch) {
    const [, year, month, day] = zhDateMatch;
    return formatDateParts(year, month, day);
  }

  return '';
};

const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ');
const normalizeUnknownText = (value: unknown) => String(value ?? '').trim().replace(/\s+/g, ' ');

const normalizeAirportValue = (value: unknown) => {
  const normalized = normalizeUnknownText(value).toUpperCase();
  const parenthesizedIata = normalized.match(/\(([A-Z]{3})\)/)?.[1];
  if (parenthesizedIata) return parenthesizedIata;

  const leadingIata = normalized.match(/^([A-Z]{3})\b/)?.[1];
  if (leadingIata) return leadingIata;

  const trailingIata = normalized.match(/\b([A-Z]{3})$/)?.[1];
  return trailingIata || normalized;
};

const normalizeKgValue = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const match = normalizeUnknownText(value).match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : fallback;
};

const inferCsvDelimiter = (csv: string) => {
  const firstDataLine = csv.split(/\r?\n/).find(line => line.trim()) || '';
  const candidates = [',', ';', '\t'];
  return candidates
    .map(delimiter => ({ delimiter, count: firstDataLine.split(delimiter).length }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter || ',';
};

const parseCsvRows = (csv: string) => {
  const delimiter = inferCsvDelimiter(csv);
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

    if (char === delimiter && !inQuotes) {
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
    const rawDepartureDate = getValue(row, columnMap, 'departureDate');
    const rawDepartureAirport = getValue(row, columnMap, 'departureAirport');
    const rawArrivalAirport = getValue(row, columnMap, 'arrivalAirport');
    const departureDate = normalizeDate(rawDepartureDate);
    const departureAirport = normalizeAirportValue(rawDepartureAirport);
    const arrivalAirport = normalizeAirportValue(rawArrivalAirport);

    if (!departureDate || !departureAirport || !arrivalAirport) {
      const route = [
        rawDepartureAirport || '未填出發',
        rawArrivalAirport || '未填抵達',
      ].join(' → ');
      const missingFields = [
        !departureDate ? '出發日期' : '',
        !departureAirport ? '出發機場' : '',
        !arrivalAirport ? '抵達機場' : '',
      ].filter(Boolean).join('、');
      errors.push(`第 ${index + 2} 列已略過：${rawDepartureDate || '未填日期'} ${route}，無法辨識 ${missingFields}。`);
      return;
    }

    const flightNumber = normalizeUnknownText(getValue(row, columnMap, 'flightNumber')).toUpperCase();
    const returnDepartureDate = normalizeDate(getValue(row, columnMap, 'returnDepartureDate'));
    const destination = columnMap.get('destination') === columnMap.get('arrivalAirport')
      ? arrivalAirport
      : getValue(row, columnMap, 'destination') || arrivalAirport;

    flights.push({
      id: `${idPrefix}-${index + 1}-${departureDate}-${departureAirport}-${arrivalAirport}`,
      departureDate,
      departureTime: getValue(row, columnMap, 'departureTime'),
      arrivalTime: '',
      destination,
      airline: getValue(row, columnMap, 'airline'),
      flightNumber,
      departureAirport,
      arrivalAirport,
      departureTerminal: '',
      arrivalTerminal: '',
      returnDepartureDate,
      returnDepartureTime: getValue(row, columnMap, 'returnDepartureTime'),
      returnArrivalTime: '',
      returnFlightNumber: normalizeUnknownText(getValue(row, columnMap, 'returnFlightNumber')).toUpperCase(),
      returnDepartureAirport: normalizeAirportValue(getValue(row, columnMap, 'returnDepartureAirport')),
      returnArrivalAirport: normalizeAirportValue(getValue(row, columnMap, 'returnArrivalAirport')),
      returnDepartureTerminal: '',
      returnArrivalTerminal: '',
      checkedAllowance: 0,
      carryOnAllowance: 0,
      personalAllowance: 0,
      passengerCount: 1,
      seatNumber: getValue(row, columnMap, 'seatNumber'),
      rawEmailId: 'csv-import',
    });
  });

  return { flights, errors };
};

export const getSupportedFlightUploadMimeType = (file: Pick<File, 'name' | 'type'>) => {
  const fileType = file.type.toLowerCase();
  if (fileType === 'application/pdf' || fileType.startsWith('image/')) return fileType;

  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.pdf')) return 'application/pdf';
  if (fileName.endsWith('.png')) return 'image/png';
  if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) return 'image/jpeg';
  if (fileName.endsWith('.webp')) return 'image/webp';
  if (fileName.endsWith('.heic')) return 'image/heic';
  if (fileName.endsWith('.heif')) return 'image/heif';
  return '';
};

export const readFlightUploadAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('File read failed'));
  reader.readAsDataURL(file);
});

export const buildFlightMemoryImportFromAnalysis = (
  data: Partial<Flight>,
  id: string,
  source = 'pdf-import',
): Flight | undefined => {
  const departureDate = normalizeDate(normalizeUnknownText(data.departureDate));
  const departureAirport = normalizeAirportValue(data.departureAirport);
  const arrivalAirport = normalizeAirportValue(data.arrivalAirport);

  if (!departureDate || !departureAirport || !arrivalAirport) return undefined;

  const returnDepartureDate = normalizeDate(normalizeUnknownText(data.returnDepartureDate));

  return {
    id,
    departureDate,
    departureTime: normalizeUnknownText(data.departureTime),
    arrivalTime: normalizeUnknownText(data.arrivalTime),
    destination: normalizeUnknownText(data.destination) || arrivalAirport,
    airline: normalizeUnknownText(data.airline),
    flightNumber: normalizeUnknownText(data.flightNumber).toUpperCase(),
    departureAirport,
    arrivalAirport,
    departureTerminal: normalizeUnknownText(data.departureTerminal),
    arrivalTerminal: normalizeUnknownText(data.arrivalTerminal),
    returnDepartureDate,
    returnDepartureTime: normalizeUnknownText(data.returnDepartureTime),
    returnArrivalTime: normalizeUnknownText(data.returnArrivalTime),
    returnFlightNumber: normalizeUnknownText(data.returnFlightNumber).toUpperCase(),
    returnDepartureAirport: normalizeAirportValue(data.returnDepartureAirport),
    returnArrivalAirport: normalizeAirportValue(data.returnArrivalAirport),
    returnDepartureTerminal: normalizeUnknownText(data.returnDepartureTerminal),
    returnArrivalTerminal: normalizeUnknownText(data.returnArrivalTerminal),
    checkedAllowance: normalizeKgValue(data.checkedAllowance),
    carryOnAllowance: normalizeKgValue(data.carryOnAllowance, 7),
    personalAllowance: normalizeKgValue(data.personalAllowance),
    passengerCount: 1,
    seatNumber: normalizeUnknownText(data.seatNumber),
    rawEmailId: source,
  };
};
