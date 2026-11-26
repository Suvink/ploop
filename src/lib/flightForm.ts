import { isValidIsoDate, normaliseTime } from './dates';
import { normaliseFlightNumber, splitFlightDesignator } from './airports';
import { normaliseSeat } from './bcbp';
import type { Cabin, Flight } from './types';

/** Raw strings as typed in the form. */
export interface FlightFormValues {
  date: string;
  fromIata: string;
  toIata: string;
  airlineIata: string;
  flightNumber: string;
  depLocal: string;
  arrLocal: string;
  arrNextDay: boolean;
  seat: string;
  cabin: Cabin | null;
  aircraftType: string;
  registration: string;
  notes: string;
  durationMin?: string;
  /** The date came from a pass without a year; cleared once the user picks a date. */
  yearUnknown?: boolean;
}

export type FlightFields = Omit<Flight, 'id' | 'source' | 'createdAt' | 'updatedAt'>;

export type FormErrors = Partial<Record<keyof FlightFormValues, string>>;

export function emptyForm(date = ''): FlightFormValues {
  return {
    date,
    fromIata: '',
    toIata: '',
    airlineIata: '',
    flightNumber: '',
    depLocal: '',
    arrLocal: '',
    arrNextDay: false,
    seat: '',
    cabin: null,
    aircraftType: '',
    registration: '',
    notes: '',
    durationMin: '',
  };
}

export function formFromFlight(f: Flight): FlightFormValues {
  return {
    date: f.date,
    fromIata: f.fromIata,
    toIata: f.toIata,
    airlineIata: f.airlineIata ?? '',
    flightNumber: f.flightNumber ?? '',
    depLocal: f.depLocal ?? '',
    arrLocal: f.arrLocal ?? '',
    arrNextDay: (f.arrDayOffset ?? 0) > 0,
    seat: f.seat ?? '',
    cabin: (f.cabin as Cabin | null) ?? null,
    aircraftType: f.aircraftType ?? '',
    registration: f.registration ?? '',
    notes: f.notes ?? '',
    durationMin: f.durationMin != null ? String(f.durationMin) : '',
    yearUnknown: f.yearUnknown,
  };
}

/** If the flight-number field holds "UL504"/"UL 504", split it into airline + number. */
export function applyDesignatorSplit(v: FlightFormValues): FlightFormValues {
  const split = splitFlightDesignator(v.flightNumber);
  if (!split) return v;
  return { ...v, airlineIata: split.airline, flightNumber: split.number };
}

const nil = (s: string) => (s.trim() ? s.trim() : null);

export function validateFlightForm(
  input: FlightFormValues,
): { ok: true; value: FlightFields } | { ok: false; errors: FormErrors } {
  const v = applyDesignatorSplit(input);
  const errors: FormErrors = {};
  const from = v.fromIata.trim().toUpperCase();
  const to = v.toIata.trim().toUpperCase();
  if (!isValidIsoDate(v.date.trim())) errors.date = 'Enter a valid date';
  if (!/^[A-Z0-9]{3}$/.test(from)) errors.fromIata = 'Choose a departure airport';
  if (!/^[A-Z0-9]{3}$/.test(to)) errors.toIata = 'Choose an arrival airport';
  if (!errors.fromIata && !errors.toIata && from === to)
    errors.toIata = 'Arrival must differ from departure';
  const dep = v.depLocal.trim() ? normaliseTime(v.depLocal) : null;
  const arr = v.arrLocal.trim() ? normaliseTime(v.arrLocal) : null;
  if (v.depLocal.trim() && !dep) errors.depLocal = 'Use HH:mm';
  if (v.arrLocal.trim() && !arr) errors.arrLocal = 'Use HH:mm';
  const airline = v.airlineIata.trim().toUpperCase();
  if (airline && !/^[A-Z0-9]{2,3}$/.test(airline)) errors.airlineIata = 'Use a 2-letter code';
  let durationMin: number | null = null;
  if (v.durationMin?.trim()) {
    const n = Number(v.durationMin.trim());
    if (!Number.isInteger(n) || n <= 0 || n > 24 * 60) errors.durationMin = 'Minutes, 1–1440';
    else durationMin = n;
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      date: v.date.trim(),
      fromIata: from,
      toIata: to,
      airlineIata: airline || null,
      flightNumber: normaliseFlightNumber(v.flightNumber),
      depLocal: dep,
      arrLocal: arr,
      arrDayOffset: arr ? (v.arrNextDay ? 1 : null) : null,
      durationMin,
      seat: v.seat.trim() ? (normaliseSeat(v.seat) ?? v.seat.trim().toUpperCase()) : null,
      cabin: v.cabin,
      aircraftType: nil(v.aircraftType),
      registration: nil(v.registration)?.toUpperCase() ?? null,
      notes: nil(v.notes),
      yearUnknown: Boolean(v.yearUnknown),
    },
  };
}

/** Return flight: swap from/to, clear date and per-flight details. */
export function duplicateAsReturn(f: Flight): FlightFormValues {
  return {
    ...emptyForm(''),
    fromIata: f.toIata,
    toIata: f.fromIata,
    airlineIata: f.airlineIata ?? '',
    cabin: (f.cabin as Cabin | null) ?? null,
  };
}

export function isDuplicate(
  existing: Pick<Flight, 'date' | 'fromIata' | 'toIata' | 'flightNumber'>[],
  c: Pick<Flight, 'date' | 'fromIata' | 'toIata' | 'flightNumber'>,
): boolean {
  return existing.some(
    (f) =>
      f.date === c.date &&
      f.fromIata === c.fromIata &&
      f.toIata === c.toIata &&
      (f.flightNumber ?? '') === (c.flightNumber ?? ''),
  );
}
