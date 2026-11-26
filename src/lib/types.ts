export type AirportSize = 'L' | 'M' | 'S';

export interface Airport {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  tz: string;
  size: AirportSize;
}

export type AirportRow = [
  string,
  string,
  string,
  string,
  string,
  number,
  number,
  string,
  AirportSize,
];

export interface Country {
  name: string;
  continent: string;
}

export interface Airline {
  iata: string;
  icao: string;
  name: string;
  color: string;
}

export type Cabin = 'economy' | 'premium' | 'business' | 'first';
export type FlightSource = 'scan' | 'manual' | 'import';

/** Mirrors the `flights` table row. */
export interface Flight {
  id: string;
  date: string;
  fromIata: string;
  toIata: string;
  airlineIata: string | null;
  flightNumber: string | null;
  depLocal: string | null;
  arrLocal: string | null;
  arrDayOffset: number | null;
  durationMin: number | null;
  seat: string | null;
  cabin: Cabin | string | null;
  aircraftType: string | null;
  registration: string | null;
  notes: string | null;
  /** The pass had no year; `date` is a best guess until the user picks one. */
  yearUnknown: boolean;
  source: FlightSource | string;
  createdAt: string;
  updatedAt: string;
}

export type AirportLookup = (iata: string) => Airport | undefined;
