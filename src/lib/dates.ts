import { DateTime } from 'luxon';

const MIN_OFFSET = -330;
const MAX_OFFSET = 30;

/**
 * Infer the full date for a BCBP day-of-year, relative to `today`.
 * Tries last year, this year and next year; prefers a candidate within [-330, +30] days
 * of today (closest wins), otherwise the closest overall.
 */
export function inferDate(dayOfYear: number, today: DateTime): string {
  const base = today.startOf('day');
  const candidates: { date: DateTime; offset: number }[] = [];
  for (const year of [base.year - 1, base.year, base.year + 1]) {
    const daysInYear = DateTime.local(year).isInLeapYear ? 366 : 365;
    if (dayOfYear < 1 || dayOfYear > daysInYear) continue;
    const date = DateTime.fromObject({ year, ordinal: dayOfYear }, { zone: base.zone });
    const offset = Math.round(date.diff(base, 'days').days);
    candidates.push({ date, offset });
  }
  if (candidates.length === 0) throw new RangeError(`Invalid day of year: ${dayOfYear}`);
  const inWindow = candidates.filter((c) => c.offset >= MIN_OFFSET && c.offset <= MAX_OFFSET);
  const pool = inWindow.length ? inWindow : candidates;
  pool.sort((a, b) => Math.abs(a.offset) - Math.abs(b.offset));
  return pool[0].date.toISODate()!;
}

export function todayIso(now: DateTime = DateTime.local()): string {
  return now.toISODate()!;
}

export function isValidIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return DateTime.fromISO(s).isValid;
}

export function isValidTime(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

/** Lenient time input: "730" → "07:30", "7:5" → null, "23:59" → "23:59". */
export function normaliseTime(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  let m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) m = t.match(/^(\d{1,2})(\d{2})$/);
  if (!m) return null;
  const out = `${m[1].padStart(2, '0')}:${m[2]}`;
  return isValidTime(out) ? out : null;
}
