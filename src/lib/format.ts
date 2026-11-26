import { DateTime } from 'luxon';
import { kmToUnit } from './geo';

export type DistanceUnit = 'km' | 'mi';

export function formatNumber(n: number, maxFractionDigits = 0): string {
  const fixed = n.toFixed(maxFractionDigits);
  const [int, frac] = fixed.split('.');
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac && Number(frac) !== 0 ? `${withCommas}.${frac.replace(/0+$/, '')}` : withCommas;
}

export function formatDistance(km: number, unit: DistanceUnit): string {
  return `${formatNumber(Math.round(kmToUnit(km, unit)))} ${unit}`;
}

/** 445 → "7h 25m", 45 → "45m", 120 → "2h". */
export function formatDuration(minutes: number): string {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}

/** Large totals: under 100 h → "42h 10m"; otherwise "1,234 h". */
export function formatTotalTime(minutes: number): string {
  if (minutes < 100 * 60) return formatDuration(minutes);
  return `${formatNumber(Math.round(minutes / 60))} h`;
}

/** "14 Aug 2026" or, with hideExactDates, "Aug 2026". */
export function formatDate(iso: string, hideExactDates = false): string {
  const d = DateTime.fromISO(iso);
  if (!d.isValid) return iso;
  return d.toFormat(hideExactDates ? 'LLL yyyy' : 'd LLL yyyy');
}

/** "Fri, 14 Aug" for list rows. */
export function formatShortDate(iso: string): string {
  const d = DateTime.fromISO(iso);
  return d.isValid ? d.toFormat('ccc, d LLL') : iso;
}

/** "14 Aug" — for dates whose year isn't known. */
export function formatDayMonth(iso: string): string {
  const d = DateTime.fromISO(iso);
  return d.isValid ? d.toFormat('d LLL') : iso;
}

export function formatYearRange(first: string | null, last: string | null): string {
  if (!first || !last) return '—';
  const a = first.slice(0, 4);
  const b = last.slice(0, 4);
  return a === b ? a : `${a}–${b}`;
}

export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

export function formatMultiplier(x: number): string {
  return `${x < 10 ? x.toFixed(1) : formatNumber(Math.round(x))}×`;
}
