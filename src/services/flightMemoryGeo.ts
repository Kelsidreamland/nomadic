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
  lat: number;
  lon: number;
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
  AE: { code: 'AE', name: '阿拉伯聯合大公國', nameEn: 'United Arab Emirates', flag: '🇦🇪' },
  AT: { code: 'AT', name: '奧地利', nameEn: 'Austria', flag: '🇦🇹' },
  AU: { code: 'AU', name: '澳洲', nameEn: 'Australia', flag: '🇦🇺' },
  BE: { code: 'BE', name: '比利時', nameEn: 'Belgium', flag: '🇧🇪' },
  CA: { code: 'CA', name: '加拿大', nameEn: 'Canada', flag: '🇨🇦' },
  CH: { code: 'CH', name: '瑞士', nameEn: 'Switzerland', flag: '🇨🇭' },
  CN: { code: 'CN', name: '中國', nameEn: 'China', flag: '🇨🇳' },
  CZ: { code: 'CZ', name: '捷克', nameEn: 'Czechia', flag: '🇨🇿' },
  DE: { code: 'DE', name: '德國', nameEn: 'Germany', flag: '🇩🇪' },
  DK: { code: 'DK', name: '丹麥', nameEn: 'Denmark', flag: '🇩🇰' },
  ES: { code: 'ES', name: '西班牙', nameEn: 'Spain', flag: '🇪🇸' },
  FI: { code: 'FI', name: '芬蘭', nameEn: 'Finland', flag: '🇫🇮' },
  FR: { code: 'FR', name: '法國', nameEn: 'France', flag: '🇫🇷' },
  GR: { code: 'GR', name: '希臘', nameEn: 'Greece', flag: '🇬🇷' },
  HK: { code: 'HK', name: '香港', nameEn: 'Hong Kong', flag: '🇭🇰' },
  HU: { code: 'HU', name: '匈牙利', nameEn: 'Hungary', flag: '🇭🇺' },
  ID: { code: 'ID', name: '印尼', nameEn: 'Indonesia', flag: '🇮🇩' },
  IE: { code: 'IE', name: '愛爾蘭', nameEn: 'Ireland', flag: '🇮🇪' },
  IN: { code: 'IN', name: '印度', nameEn: 'India', flag: '🇮🇳' },
  IT: { code: 'IT', name: '義大利', nameEn: 'Italy', flag: '🇮🇹' },
  JP: { code: 'JP', name: '日本', nameEn: 'Japan', flag: '🇯🇵' },
  KR: { code: 'KR', name: '韓國', nameEn: 'South Korea', flag: '🇰🇷' },
  MX: { code: 'MX', name: '墨西哥', nameEn: 'Mexico', flag: '🇲🇽' },
  MY: { code: 'MY', name: '馬來西亞', nameEn: 'Malaysia', flag: '🇲🇾' },
  NL: { code: 'NL', name: '荷蘭', nameEn: 'Netherlands', flag: '🇳🇱' },
  NO: { code: 'NO', name: '挪威', nameEn: 'Norway', flag: '🇳🇴' },
  NZ: { code: 'NZ', name: '紐西蘭', nameEn: 'New Zealand', flag: '🇳🇿' },
  PH: { code: 'PH', name: '菲律賓', nameEn: 'Philippines', flag: '🇵🇭' },
  PL: { code: 'PL', name: '波蘭', nameEn: 'Poland', flag: '🇵🇱' },
  PT: { code: 'PT', name: '葡萄牙', nameEn: 'Portugal', flag: '🇵🇹' },
  QA: { code: 'QA', name: '卡達', nameEn: 'Qatar', flag: '🇶🇦' },
  SE: { code: 'SE', name: '瑞典', nameEn: 'Sweden', flag: '🇸🇪' },
  SG: { code: 'SG', name: '新加坡', nameEn: 'Singapore', flag: '🇸🇬' },
  TH: { code: 'TH', name: '泰國', nameEn: 'Thailand', flag: '🇹🇭' },
  TR: { code: 'TR', name: '土耳其', nameEn: 'Turkey', flag: '🇹🇷' },
  TW: { code: 'TW', name: '台灣', nameEn: 'Taiwan', flag: '🇹🇼' },
  UK: { code: 'UK', name: '英國', nameEn: 'United Kingdom', flag: '🇬🇧' },
  US: { code: 'US', name: '美國', nameEn: 'United States', flag: '🇺🇸' },
  VN: { code: 'VN', name: '越南', nameEn: 'Vietnam', flag: '🇻🇳' },
};

const airportByCode: Record<string, AirportInfo> = {
  AKL: { code: 'AKL', label: 'Auckland', country: countries.NZ, lat: -37.0082, lon: 174.785 },
  AMS: { code: 'AMS', label: 'Amsterdam', country: countries.NL, lat: 52.3105, lon: 4.7683 },
  ARN: { code: 'ARN', label: 'Stockholm', country: countries.SE, lat: 59.6498, lon: 17.9238 },
  ATH: { code: 'ATH', label: 'Athens', country: countries.GR, lat: 37.9364, lon: 23.9445 },
  AUH: { code: 'AUH', label: 'Abu Dhabi', country: countries.AE, lat: 24.4539, lon: 54.3773 },
  BCN: { code: 'BCN', label: 'Barcelona', country: countries.ES, lat: 41.2974, lon: 2.0833 },
  BER: { code: 'BER', label: 'Berlin', country: countries.DE, lat: 52.3667, lon: 13.5033 },
  BKK: { code: 'BKK', label: 'Bangkok', country: countries.TH, lat: 13.69, lon: 100.7501 },
  BOM: { code: 'BOM', label: 'Mumbai', country: countries.IN, lat: 19.0896, lon: 72.8656 },
  BRU: { code: 'BRU', label: 'Brussels', country: countries.BE, lat: 50.9014, lon: 4.4844 },
  BUD: { code: 'BUD', label: 'Budapest', country: countries.HU, lat: 47.4298, lon: 19.2611 },
  CDG: { code: 'CDG', label: 'Paris', country: countries.FR, lat: 49.0097, lon: 2.5479 },
  CEB: { code: 'CEB', label: 'Cebu', country: countries.PH, lat: 10.3075, lon: 123.9794 },
  CGK: { code: 'CGK', label: 'Jakarta', country: countries.ID, lat: -6.1275, lon: 106.6537 },
  CPH: { code: 'CPH', label: 'Copenhagen', country: countries.DK, lat: 55.6181, lon: 12.6561 },
  DEL: { code: 'DEL', label: 'Delhi', country: countries.IN, lat: 28.5562, lon: 77.1 },
  DOH: { code: 'DOH', label: 'Doha', country: countries.QA, lat: 25.2731, lon: 51.6081 },
  DPS: { code: 'DPS', label: 'Bali', country: countries.ID, lat: -8.7482, lon: 115.167 },
  DUB: { code: 'DUB', label: 'Dublin', country: countries.IE, lat: 53.4213, lon: -6.2701 },
  DXB: { code: 'DXB', label: 'Dubai', country: countries.AE, lat: 25.2532, lon: 55.3657 },
  FCO: { code: 'FCO', label: 'Rome', country: countries.IT, lat: 41.8003, lon: 12.2389 },
  FRA: { code: 'FRA', label: 'Frankfurt', country: countries.DE, lat: 50.0379, lon: 8.5622 },
  HEL: { code: 'HEL', label: 'Helsinki', country: countries.FI, lat: 60.3172, lon: 24.9633 },
  HKG: { code: 'HKG', label: 'Hong Kong', country: countries.HK, lat: 22.308, lon: 113.9185 },
  HND: { code: 'HND', label: 'Tokyo', country: countries.JP, lat: 35.5494, lon: 139.7798 },
  ICN: { code: 'ICN', label: 'Seoul', country: countries.KR, lat: 37.4602, lon: 126.4407 },
  IST: { code: 'IST', label: 'Istanbul', country: countries.TR, lat: 41.2613, lon: 28.7419 },
  JFK: { code: 'JFK', label: 'New York', country: countries.US, lat: 40.6413, lon: -73.7781 },
  KIX: { code: 'KIX', label: 'Osaka', country: countries.JP, lat: 34.4347, lon: 135.244 },
  KUL: { code: 'KUL', label: 'Kuala Lumpur', country: countries.MY, lat: 2.7456, lon: 101.7072 },
  LAX: { code: 'LAX', label: 'Los Angeles', country: countries.US, lat: 33.9416, lon: -118.4085 },
  LHR: { code: 'LHR', label: 'London', country: countries.UK, lat: 51.47, lon: -0.4543 },
  LIS: { code: 'LIS', label: 'Lisbon', country: countries.PT, lat: 38.7742, lon: -9.1342 },
  MAD: { code: 'MAD', label: 'Madrid', country: countries.ES, lat: 40.4983, lon: -3.5676 },
  MEL: { code: 'MEL', label: 'Melbourne', country: countries.AU, lat: -37.669, lon: 144.841 },
  MNL: { code: 'MNL', label: 'Manila', country: countries.PH, lat: 14.5086, lon: 121.0198 },
  MUC: { code: 'MUC', label: 'Munich', country: countries.DE, lat: 48.3538, lon: 11.7861 },
  MXP: { code: 'MXP', label: 'Milan', country: countries.IT, lat: 45.6306, lon: 8.7281 },
  NRT: { code: 'NRT', label: 'Tokyo', country: countries.JP, lat: 35.7719, lon: 140.3929 },
  OKA: { code: 'OKA', label: 'Okinawa', country: countries.JP, lat: 26.1958, lon: 127.646 },
  OSL: { code: 'OSL', label: 'Oslo', country: countries.NO, lat: 60.1939, lon: 11.1004 },
  PEK: { code: 'PEK', label: 'Beijing', country: countries.CN, lat: 40.0799, lon: 116.6031 },
  PRG: { code: 'PRG', label: 'Prague', country: countries.CZ, lat: 50.1008, lon: 14.26 },
  PVG: { code: 'PVG', label: 'Shanghai', country: countries.CN, lat: 31.1443, lon: 121.8083 },
  SFO: { code: 'SFO', label: 'San Francisco', country: countries.US, lat: 37.6213, lon: -122.379 },
  SGN: { code: 'SGN', label: 'Ho Chi Minh City', country: countries.VN, lat: 10.8188, lon: 106.6519 },
  SIN: { code: 'SIN', label: 'Singapore', country: countries.SG, lat: 1.3644, lon: 103.9915 },
  SYD: { code: 'SYD', label: 'Sydney', country: countries.AU, lat: -33.9399, lon: 151.1753 },
  TPE: { code: 'TPE', label: 'Taipei', country: countries.TW, lat: 25.0797, lon: 121.2342 },
  TSA: { code: 'TSA', label: 'Taipei', country: countries.TW, lat: 25.0697, lon: 121.5525 },
  VIE: { code: 'VIE', label: 'Vienna', country: countries.AT, lat: 48.1103, lon: 16.5697 },
  WAW: { code: 'WAW', label: 'Warsaw', country: countries.PL, lat: 52.1657, lon: 20.9671 },
  YVR: { code: 'YVR', label: 'Vancouver', country: countries.CA, lat: 49.1967, lon: -123.1815 },
  YYZ: { code: 'YYZ', label: 'Toronto', country: countries.CA, lat: 43.6777, lon: -79.6248 },
  ZRH: { code: 'ZRH', label: 'Zurich', country: countries.CH, lat: 47.4582, lon: 8.5555 },
};

const airportAliases: Array<[string, string]> = [
  ['tokyo', 'NRT'],
  ['東京', 'NRT'],
  ['narita', 'NRT'],
  ['成田', 'NRT'],
  ['haneda', 'HND'],
  ['羽田', 'HND'],
  ['taipei', 'TPE'],
  ['台北', 'TPE'],
  ['臺北', 'TPE'],
  ['taoyuan', 'TPE'],
  ['桃園', 'TPE'],
  ['seoul', 'ICN'],
  ['incheon', 'ICN'],
  ['首爾', 'ICN'],
  ['仁川', 'ICN'],
  ['singapore', 'SIN'],
  ['新加坡', 'SIN'],
  ['bangkok', 'BKK'],
  ['曼谷', 'BKK'],
  ['hong kong', 'HKG'],
  ['香港', 'HKG'],
  ['dubai', 'DXB'],
  ['杜拜', 'DXB'],
  ['sydney', 'SYD'],
  ['雪梨', 'SYD'],
  ['amsterdam', 'AMS'],
  ['阿姆斯特丹', 'AMS'],
  ['rome', 'FCO'],
  ['羅馬', 'FCO'],
  ['manila', 'MNL'],
  ['馬尼拉', 'MNL'],
  ['los angeles', 'LAX'],
  ['la ', 'LAX'],
  ['london', 'LHR'],
  ['倫敦', 'LHR'],
  ['paris', 'CDG'],
  ['巴黎', 'CDG'],
  ['kuala lumpur', 'KUL'],
  ['吉隆坡', 'KUL'],
  ['ho chi minh', 'SGN'],
  ['胡志明', 'SGN'],
  ['bali', 'DPS'],
  ['峇里', 'DPS'],
  ['osaka', 'KIX'],
  ['大阪', 'KIX'],
];

const getAirportAliasCode = (value?: string) => {
  const normalized = (value || '').trim().toLowerCase();
  if (!normalized) return undefined;
  return airportAliases.find(([alias]) => normalized.includes(alias))?.[1];
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
  const normalized = (value || '').trim().toUpperCase();
  const code = getAirportCode(value);
  if (normalized.length === 3 && code) return airportByCode[code];
  return airportByCode[getAirportAliasCode(value) || ''] || (code ? airportByCode[code] : undefined);
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
    lat: airport.lat,
    lon: airport.lon,
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
