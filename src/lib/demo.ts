/**
 * Deterministic fake flight log for development (Passport and story visual checks).
 * All data is invented. Used by scripts/seed-demo.ts and the dev-only Settings action.
 */
import { DateTime } from 'luxon';
import type { Cabin, Flight } from './types';

type Route = [
  from: string,
  to: string,
  airline: string,
  aircraft: string,
  dep: string,
  arr: string,
  nextDay: boolean,
];

const TRIPS: Route[][] = [
  [
    ['CMB', 'DXB', 'UL', 'A330-300', '21:45', '00:55', true],
    ['DXB', 'CMB', 'UL', 'A330-300', '03:10', '09:15', false],
  ],
  [
    ['CMB', 'SIN', 'UL', 'A321neo', '00:50', '07:15', false],
    ['SIN', 'CMB', 'UL', 'A321neo', '09:00', '10:30', false],
  ],
  [
    ['CMB', 'DOH', 'QR', 'B787-9', '04:10', '06:55', false],
    ['DOH', 'LHR', 'QR', 'A350-1000', '08:15', '13:05', false],
    ['LHR', 'DOH', 'QR', 'A350-1000', '15:40', '00:45', true],
    ['DOH', 'CMB', 'QR', 'B787-9', '02:10', '09:05', false],
  ],
  [
    ['CMB', 'BKK', 'TG', 'A350-900', '01:15', '06:00', false],
    ['BKK', 'CMB', 'TG', 'A350-900', '21:10', '22:55', false],
  ],
  [
    ['CMB', 'DEL', 'AI', 'A320neo', '10:30', '13:55', false],
    ['DEL', 'CMB', 'AI', 'A320neo', '19:20', '22:45', false],
  ],
  [
    ['CMB', 'MLE', 'UL', 'A320', '10:30', '11:30', false],
    ['MLE', 'CMB', 'UL', 'A320', '12:30', '15:25', false],
  ],
  [
    ['CMB', 'SIN', 'SQ', 'A350-900', '01:25', '07:50', false],
    ['SIN', 'SYD', 'SQ', 'A380-800', '20:55', '07:00', true],
    ['SYD', 'LAX', 'QF', 'B787-9', '21:30', '16:00', false],
    ['LAX', 'NRT', 'NH', 'B777-300ER', '11:55', '15:40', true],
    ['NRT', 'CMB', 'UL', 'A330-300', '11:40', '17:55', false],
  ],
  [
    ['CMB', 'IST', 'TK', 'A330-300', '05:15', '11:40', false],
    ['IST', 'CDG', 'TK', 'A321neo', '14:10', '16:40', false],
    ['CDG', 'IST', 'TK', 'B737 MAX 9', '19:20', '23:40', false],
    ['IST', 'CMB', 'TK', 'A330-300', '01:50', '13:15', false],
  ],
  [
    ['CMB', 'KUL', 'MH', 'B737-800', '00:35', '06:25', false],
    ['KUL', 'CMB', 'MH', 'B737-800', '21:05', '22:35', false],
  ],
  [
    ['CMB', 'DXB', 'EK', 'B777-300ER', '04:30', '07:30', false],
    ['DXB', 'JFK', 'EK', 'A380-800', '08:30', '14:30', false],
    ['JFK', 'YUL', 'AC', 'E175', '17:00', '18:25', false],
    ['YUL', 'FRA', 'AC', 'B787-9', '21:30', '10:45', true],
    ['FRA', 'GVA', 'LH', 'A320', '13:10', '14:15', false],
    ['GVA', 'DXB', 'EK', 'B777-300ER', '15:00', '23:10', false],
    ['DXB', 'CMB', 'EK', 'B777-300ER', '02:40', '08:45', false],
  ],
  [
    ['CMB', 'HKG', 'CX', 'A330-300', '00:15', '07:55', false],
    ['HKG', 'CMB', 'CX', 'A330-300', '18:35', '21:45', false],
  ],
  [
    ['CMB', 'BOM', 'UL', 'A320neo', '09:20', '12:00', false],
    ['BOM', 'CMB', 'UL', 'A320neo', '13:15', '15:55', false],
  ],
];

const SEATS = ['14A', '22C', '31K', '7F', '41A', '18D', '3A', '27L', '12C', '36H', '9A', '44K'];
const CABINS: Cabin[] = ['economy', 'economy', 'economy', 'economy', 'premium', 'business'];

/** Small seeded PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uuidFrom(r: () => number): string {
  const hex = Array.from({ length: 32 }, () => Math.floor(r() * 16).toString(16));
  hex[12] = '4';
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const s = hex.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

export function generateDemoFlights(today: DateTime, target = 120, seed = 42): Flight[] {
  const r = rng(seed);
  const flights: Flight[] = [];
  const start = today.minus({ years: 5 }).startOf('month');
  const spanDays = Math.floor(today.diff(start, 'days').days);
  const now = today.toUTC().toISO()!;
  let guard = 0;
  while (flights.length < target && guard++ < 1000) {
    const trip = TRIPS[Math.floor(r() * TRIPS.length)];
    let day = start.plus({ days: Math.floor(r() * (spanDays - 30)) });
    const cabin = CABINS[Math.floor(r() * CABINS.length)];
    for (const [from, to, airline, aircraft, dep, arr, nextDay] of trip) {
      const num = String(100 + Math.floor(r() * 800));
      flights.push({
        yearUnknown: false,
        id: uuidFrom(r),
        date: day.toISODate()!,
        fromIata: from,
        toIata: to,
        airlineIata: airline,
        flightNumber: num,
        depLocal: r() < 0.85 ? dep : null,
        arrLocal: null,
        arrDayOffset: null,
        durationMin: null,
        seat: r() < 0.8 ? SEATS[Math.floor(r() * SEATS.length)] : null,
        cabin,
        aircraftType: r() < 0.9 ? aircraft : null,
        registration: null,
        notes: null,
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      });
      const f = flights[flights.length - 1];
      if (f.depLocal) {
        f.arrLocal = arr;
        f.arrDayOffset = nextDay ? 1 : 0;
      }
      day = day.plus({ days: nextDay ? 1 + Math.floor(r() * 6) : Math.floor(r() * 8) });
    }
  }
  // Two upcoming flights.
  flights.push(
    {
      ...flights[0],
      id: uuidFrom(r),
      date: today.plus({ days: 12 }).toISODate()!,
      fromIata: 'CMB',
      toIata: 'SIN',
      airlineIata: 'SQ',
      flightNumber: '469',
      seat: '31A',
    },
    {
      ...flights[0],
      id: uuidFrom(r),
      date: today.plus({ days: 19 }).toISODate()!,
      fromIata: 'SIN',
      toIata: 'CMB',
      airlineIata: 'SQ',
      flightNumber: '468',
      seat: '30K',
    },
  );
  return flights;
}
