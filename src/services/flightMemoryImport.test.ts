import { describe, expect, it } from 'vitest';
import { parseFlightMemoryCsv } from './flightMemoryImport';

describe('parseFlightMemoryCsv', () => {
  it('imports simple CSV rows into flight memory records', () => {
    const result = parseFlightMemoryCsv(`departureDate,departureTime,departureAirport,arrivalAirport,destination,airline,flightNumber
2026-04-18,09:20,TPE,SIN,Singapore,EVA Air,BR225
2026/02/06,07:40,TPE,ICN,Seoul,Korean Air,KE186`);

    expect(result.errors).toEqual([]);
    expect(result.flights).toMatchObject([
      {
        id: 'csv-flight-1-2026-04-18-TPE-SIN',
        departureDate: '2026-04-18',
        departureTime: '09:20',
        departureAirport: 'TPE',
        arrivalAirport: 'SIN',
        destination: 'Singapore',
        airline: 'EVA Air',
        flightNumber: 'BR225',
        checkedAllowance: 0,
      },
      {
        id: 'csv-flight-2-2026-02-06-TPE-ICN',
        departureDate: '2026-02-06',
        arrivalAirport: 'ICN',
      },
    ]);
  });

  it('accepts Traditional Chinese column labels and reports skipped rows', () => {
    const result = parseFlightMemoryCsv(`出發日期,起飛時間,出發機場,抵達機場,目的地,航空公司,航班編號
2025-11-03,23:55,TPE,LHR,London,China Airlines,CI081
,09:00,TPE,NRT,Tokyo,EVA Air,BR198`);

    expect(result.flights).toHaveLength(1);
    expect(result.flights[0]).toMatchObject({
      departureDate: '2025-11-03',
      departureAirport: 'TPE',
      arrivalAirport: 'LHR',
    });
    expect(result.errors).toEqual(['第 3 列缺少出發日期、出發機場或抵達機場，已略過。']);
  });
});
