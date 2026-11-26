import {
  formatDate,
  formatDistance,
  formatDuration,
  formatMultiplier,
  formatNumber,
  formatPercent,
  formatShortDate,
  formatTotalTime,
  formatYearRange,
} from '../../src/lib/format';

describe('format', () => {
  it('numbers', () => {
    expect(formatNumber(168240)).toBe('168,240');
    expect(formatNumber(1234.5, 1)).toBe('1,234.5');
    expect(formatNumber(2.0, 1)).toBe('2');
  });
  it('distance', () => {
    expect(formatDistance(168240, 'km')).toBe('168,240 km');
    expect(formatDistance(1609.344, 'mi')).toBe('1,000 mi');
  });
  it('durations', () => {
    expect(formatDuration(445)).toBe('7h 25m');
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(120)).toBe('2h');
    expect(formatTotalTime(600)).toBe('10h');
    expect(formatTotalTime(60 * 250)).toBe('250 h');
  });
  it('dates', () => {
    expect(formatDate('2025-08-14')).toBe('14 Aug 2025');
    expect(formatDate('2025-08-14', true)).toBe('Aug 2025');
    expect(formatDate('nope')).toBe('nope');
    expect(formatShortDate('2025-08-14')).toBe('Thu, 14 Aug');
    expect(formatShortDate('bad')).toBe('bad');
    expect(formatYearRange('2021-01-01', '2025-01-01')).toBe('2021–2025');
    expect(formatYearRange('2025-01-01', '2025-03-01')).toBe('2025');
    expect(formatYearRange(null, null)).toBe('—');
  });
  it('misc', () => {
    expect(formatPercent(0.314)).toBe('31%');
    expect(formatMultiplier(0.84)).toBe('0.8×');
    expect(formatMultiplier(12.4)).toBe('12×');
  });
});
