import { buildAirportIndex } from '../../src/lib/airports';
import type { AirportRow, Flight } from '../../src/lib/types';
import airportsJson from '../../assets/data/airports.json';
import countriesJson from '../../assets/data/countries.json';

export const airportIndex = buildAirportIndex(airportsJson as AirportRow[]);
export const getAirport = airportIndex.get;
export const countries = countriesJson as Record<string, { name: string; continent: string }>;

let n = 0;
export function flight(p: Partial<Flight> & Pick<Flight, 'date' | 'fromIata' | 'toIata'>): Flight {
  n++;
  return {
    id: p.id ?? `f${n}`,
    airlineIata: null,
    flightNumber: null,
    depLocal: null,
    arrLocal: null,
    arrDayOffset: null,
    durationMin: null,
    seat: null,
    cabin: null,
    aircraftType: null,
    registration: null,
    notes: null,
    yearUnknown: false,
    source: 'manual',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...p,
  };
}
