import { DateTime } from 'luxon';
import { haversineKm } from './geo';
import type { AirportLookup, Flight } from './types';

export interface DurationResult {
  minutes: number;
  estimated: boolean;
}

type DurationInput = Pick<
  Flight,
  'date' | 'fromIata' | 'toIata' | 'depLocal' | 'arrLocal' | 'arrDayOffset' | 'durationMin'
>;

export function estimateMinutesFromKm(km: number): number {
  return Math.round((km / 800) * 60 + 30);
}

/** Duration from local times; null if it can't be computed sensibly. */
export function durationFromTimes(f: DurationInput, getAirport: AirportLookup): number | null {
  if (!f.depLocal || !f.arrLocal) return null;
  const from = getAirport(f.fromIata);
  const to = getAirport(f.toIata);
  if (!from || !to) return null;
  const dep = DateTime.fromISO(`${f.date}T${f.depLocal}`, { zone: from.tz });
  const arrBase = DateTime.fromISO(`${f.date}T${f.arrLocal}`, { zone: to.tz });
  if (!dep.isValid || !arrBase.isValid) return null;
  let arr = arrBase.plus({ days: f.arrDayOffset ?? 0 });
  if (f.arrDayOffset == null && arr < dep) arr = arr.plus({ days: 1 });
  const minutes = Math.round(arr.diff(dep, 'minutes').minutes);
  if (minutes <= 0 || minutes > 24 * 60) return null;
  return minutes;
}

export function flightDurationMin(
  flight: DurationInput,
  getAirport: AirportLookup,
): DurationResult | null {
  if (flight.durationMin != null && flight.durationMin > 0) {
    return { minutes: flight.durationMin, estimated: false };
  }
  const fromTimes = durationFromTimes(flight, getAirport);
  if (fromTimes != null) return { minutes: fromTimes, estimated: false };
  const from = getAirport(flight.fromIata);
  const to = getAirport(flight.toIata);
  if (!from || !to) return null;
  return { minutes: estimateMinutesFromKm(haversineKm(from, to)), estimated: true };
}
