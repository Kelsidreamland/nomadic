import type { FlightMemorySegment } from './flightMemory';

export interface CountryInfo {
  code: string;
  name: string;
  nameEn: string;
  flag: string;
}

export interface RouteMapPoint {
  code: string;
  label: string;
  x: number;
  y: number;
}

interface AirportInfo {
  code: string;
  label: string;
  country: CountryInfo;
  lat: number;
  lon: number;
}

export interface CountryVisit extends CountryInfo {
  visits: number;
}

const countries: Record<string, CountryInfo> = {
  AT: { code: 'AT', name: '奧地利', nameEn: 'Austria', flag: '🇦🇹' },
  CN: { code: 'CN', name: '中國', nameEn: 'China', flag: '🇨🇳' },
  FR: { code: 'FR', name: '法國', nameEn: 'France', flag: '🇫🇷' },
  GR: { code: 'GR', name: '希臘', nameEn: 'Greece', flag: '🇬🇷' },
  HK: { code: 'HK', name: '香港', nameEn: 'Hong Kong', flag: '🇭🇰' },
  ID: { code: 'ID', name: '印尼', nameEn: 'Indonesia', flag: '🇮🇩' },
  JP: { code: 'JP', name: '日本', nameEn: 'Japan', flag: '🇯🇵' },
  KR: { code: 'KR', name: '韓國', nameEn: 'South Korea', flag: '🇰🇷' },
  MY: { code: 'MY', name: '馬來西亞', nameEn: 'Malaysia', flag: '🇲🇾' },
  PT: { code: 'PT', name: '葡萄牙', nameEn: 'Portugal', flag: '🇵🇹' },
  SG: { code: 'SG', name: '新加坡', nameEn: 'Singapore', flag: '🇸🇬' },
  TH: { code: 'TH', name: '泰國', nameEn: 'Thailand', flag: '🇹🇭' },
  TR: { code: 'TR', name: '土耳其', nameEn: 'Turkey', flag: '🇹🇷' },
  TW: { code: 'TW', name: '台灣', nameEn: 'Taiwan', flag: '🇹🇼' },
  UK: { code: 'UK', name: '英國', nameEn: 'United Kingdom', flag: '🇬🇧' },
  US: { code: 'US', name: '美國', nameEn: 'United States', flag: '🇺🇸' },
  VN: { code: 'VN', name: '越南', nameEn: 'Vietnam', flag: '🇻🇳' },
};

const airportByCode: Record<string, AirportInfo> = {
  ATH: { code: 'ATH', label: 'Athens', country: countries.GR, lat: 37.9364, lon: 23.9445 },
  BKK: { code: 'BKK', label: 'Bangkok', country: countries.TH, lat: 13.69, lon: 100.7501 },
  CDG: { code: 'CDG', label: 'Paris', country: countries.FR, lat: 49.0097, lon: 2.5479 },
  DPS: { code: 'DPS', label: 'Bali', country: countries.ID, lat: -8.7482, lon: 115.167 },
  HKG: { code: 'HKG', label: 'Hong Kong', country: countries.HK, lat: 22.308, lon: 113.9185 },
  HND: { code: 'HND', label: 'Tokyo', country: countries.JP, lat: 35.5494, lon: 139.7798 },
  ICN: { code: 'ICN', label: 'Seoul', country: countries.KR, lat: 37.4602, lon: 126.4407 },
  IST: { code: 'IST', label: 'Istanbul', country: countries.TR, lat: 41.2613, lon: 28.7419 },
  JFK: { code: 'JFK', label: 'New York', country: countries.US, lat: 40.6413, lon: -73.7781 },
  KIX: { code: 'KIX', label: 'Osaka', country: countries.JP, lat: 34.4347, lon: 135.244 },
  KUL: { code: 'KUL', label: 'Kuala Lumpur', country: countries.MY, lat: 2.7456, lon: 101.7072 },
  LHR: { code: 'LHR', label: 'London', country: countries.UK, lat: 51.47, lon: -0.4543 },
  LIS: { code: 'LIS', label: 'Lisbon', country: countries.PT, lat: 38.7742, lon: -9.1342 },
  NRT: { code: 'NRT', label: 'Tokyo', country: countries.JP, lat: 35.7719, lon: 140.3929 },
  OKA: { code: 'OKA', label: 'Okinawa', country: countries.JP, lat: 26.1958, lon: 127.646 },
  PEK: { code: 'PEK', label: 'Beijing', country: countries.CN, lat: 40.0799, lon: 116.6031 },
  PVG: { code: 'PVG', label: 'Shanghai', country: countries.CN, lat: 31.1443, lon: 121.8083 },
  SGN: { code: 'SGN', label: 'Ho Chi Minh City', country: countries.VN, lat: 10.8188, lon: 106.6519 },
  SIN: { code: 'SIN', label: 'Singapore', country: countries.SG, lat: 1.3644, lon: 103.9915 },
  TPE: { code: 'TPE', label: 'Taipei', country: countries.TW, lat: 25.0797, lon: 121.2342 },
  TSA: { code: 'TSA', label: 'Taipei', country: countries.TW, lat: 25.0697, lon: 121.5525 },
  VIE: { code: 'VIE', label: 'Vienna', country: countries.AT, lat: 48.1103, lon: 16.5697 },
};

const countryAliases: Array<[string, CountryInfo]> = [
  ['tokyo', countries.JP],
  ['osaka', countries.JP],
  ['okinawa', countries.JP],
  ['東京', countries.JP],
  ['大阪', countries.JP],
  ['首爾', countries.KR],
  ['seoul', countries.KR],
  ['singapore', countries.SG],
  ['新加坡', countries.SG],
  ['bangkok', countries.TH],
  ['曼谷', countries.TH],
  ['london', countries.UK],
  ['倫敦', countries.UK],
  ['paris', countries.FR],
  ['巴黎', countries.FR],
  ['new york', countries.US],
  ['紐約', countries.US],
  ['lisbon', countries.PT],
  ['里斯本', countries.PT],
  ['istanbul', countries.TR],
  ['伊斯坦堡', countries.TR],
  ['athens', countries.GR],
  ['雅典', countries.GR],
  ['bali', countries.ID],
  ['峇里', countries.ID],
  ['hong kong', countries.HK],
  ['香港', countries.HK],
  ['kuala lumpur', countries.MY],
  ['吉隆坡', countries.MY],
  ['ho chi minh', countries.VN],
  ['胡志明', countries.VN],
  ['taipei', countries.TW],
  ['台北', countries.TW],
  ['臺北', countries.TW],
];

export const getAirportCode = (value?: string) => {
  const match = (value || '').trim().toUpperCase().match(/[A-Z]{3}/);
  return match?.[0];
};

export const getAirportInfo = (value?: string) => {
  const code = getAirportCode(value);
  return code ? airportByCode[code] : undefined;
};

export const getCountryForValue = (value?: string) => {
  const airport = getAirportInfo(value);
  if (airport) return airport.country;

  const normalized = (value || '').trim().toLowerCase();
  if (!normalized) return undefined;
  return countryAliases.find(([alias]) => normalized.includes(alias))?.[1];
};

export const getCountryForMemorySegment = (segment: FlightMemorySegment) => {
  const travelSide = segment.kind === 'return' ? segment.from : segment.to;
  return getCountryForValue(travelSide) || getCountryForValue(segment.destination);
};

export const getRouteMapPoint = (value?: string): RouteMapPoint | undefined => {
  const airport = getAirportInfo(value);
  if (!airport) return undefined;

  return {
    code: airport.code,
    label: airport.label,
    x: ((airport.lon + 180) / 360) * 100,
    y: ((90 - airport.lat) / 180) * 100,
  };
};

export const getCountryVisits = (segments: FlightMemorySegment[]): CountryVisit[] => {
  const visitsByCountry = new Map<string, CountryVisit>();

  for (const segment of segments) {
    const country = getCountryForMemorySegment(segment);
    if (!country) continue;

    const current = visitsByCountry.get(country.code);
    visitsByCountry.set(country.code, {
      ...country,
      visits: (current?.visits || 0) + 1,
    });
  }

  return Array.from(visitsByCountry.values()).sort((a, b) => {
    if (b.visits !== a.visits) return b.visits - a.visits;
    return a.name.localeCompare(b.name);
  });
};
