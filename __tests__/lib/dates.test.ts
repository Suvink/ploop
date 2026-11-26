import { DateTime } from 'luxon';
import {
  inferDate,
  isValidIsoDate,
  isValidTime,
  normaliseTime,
  todayIso,
} from '../../src/lib/dates';

const d = (iso: string) => DateTime.fromISO(iso);

describe('inferDate', () => {
  it('handles a just-scanned upcoming flight', () => {
    // 2025-08-10, flight on day 226 (14 Aug 2025)
    expect(inferDate(226, d('2025-08-10'))).toBe('2025-08-14');
  });

  it("handles last month's flight", () => {
    expect(inferDate(196, d('2025-08-10'))).toBe('2025-07-15');
  });

  it('handles a flight from 11 months ago across New Year', () => {
    // today 2026-01-20; day 50 of 2025 = 19 Feb 2025 (~335 days ago, outside window);
    // day 60 of 2025 = 1 Mar 2025 (325 days ago) — inside window.
    expect(inferDate(60, d('2026-01-20'))).toBe('2025-03-01');
  });

  it('prefers an upcoming flight just after New Year', () => {
    expect(inferDate(5, d('2025-12-28'))).toBe('2026-01-05');
  });

  it('respects leap years (day 226 = 13 Aug in a leap year)', () => {
    expect(inferDate(226, d('2024-08-10'))).toBe('2024-08-13');
  });

  it('handles day 366 (skips non-leap years)', () => {
    expect(inferDate(366, d('2025-03-01'))).toBe('2024-12-31');
    expect(inferDate(366, d('2024-12-20'))).toBe('2024-12-31');
  });

  it('falls back to the closest candidate when none is in the window', () => {
    // today 2025-06-15; day 220 → 2025-08-08 is +54 days (outside), 2024-08-07 is -312 (inside).
    expect(inferDate(220, d('2025-06-15'))).toBe('2024-08-07');
    // day 200 → 2025-07-19 is +34 (outside); 2024-07-18 is -332 (outside) → closest = 2025-07-19.
    expect(inferDate(200, d('2025-06-15'))).toBe('2025-07-19');
  });

  it('throws for an impossible day', () => {
    expect(() => inferDate(400, d('2025-01-01'))).toThrow(RangeError);
  });
});

describe('date helpers', () => {
  it('validates ISO dates and times', () => {
    expect(isValidIsoDate('2025-02-28')).toBe(true);
    expect(isValidIsoDate('2025-02-30')).toBe(false);
    expect(isValidIsoDate('25-02-28')).toBe(false);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(todayIso(d('2025-05-06T10:00'))).toBe('2025-05-06');
  });

  it('normalises lenient time input', () => {
    expect(normaliseTime('7:30')).toBe('07:30');
    expect(normaliseTime('0730')).toBe('07:30');
    expect(normaliseTime('730')).toBe('07:30');
    expect(normaliseTime('2560')).toBeNull();
    expect(normaliseTime('abc')).toBeNull();
    expect(normaliseTime('')).toBeNull();
  });
});
