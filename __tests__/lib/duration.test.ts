import {
  durationFromTimes,
  estimateMinutesFromKm,
  flightDurationMin,
} from '../../src/lib/duration';
import { flight, getAirport } from './helpers';

describe('flightDurationMin', () => {
  it('uses the user override first', () => {
    const f = flight({
      date: '2025-01-01',
      fromIata: 'CMB',
      toIata: 'DXB',
      durationMin: 290,
      depLocal: '10:00',
      arrLocal: '11:00',
    });
    expect(flightDurationMin(f, getAirport)).toEqual({ minutes: 290, estimated: false });
  });

  it('uses local times with IANA zones', () => {
    // CMB (+05:30) 21:45 → DXB (+04:00) 00:55 next day = 4h40m
    const f = flight({
      date: '2025-01-01',
      fromIata: 'CMB',
      toIata: 'DXB',
      depLocal: '21:45',
      arrLocal: '00:55',
    });
    expect(flightDurationMin(f, getAirport)).toEqual({ minutes: 280, estimated: false });
  });

  it('respects an explicit day offset', () => {
    const f = flight({
      date: '2025-01-01',
      fromIata: 'YUL',
      toIata: 'FRA',
      depLocal: '21:30',
      arrLocal: '10:45',
      arrDayOffset: 1,
    });
    expect(flightDurationMin(f, getAirport)).toEqual({ minutes: 435, estimated: false });
  });

  it('handles arrival on the previous calendar day (date line)', () => {
    // SYD 21:30 (+11 in Jan) → LAX 16:00 same date (-08) = 13h30m
    const f = flight({
      date: '2025-01-10',
      fromIata: 'SYD',
      toIata: 'LAX',
      depLocal: '21:30',
      arrLocal: '16:00',
      arrDayOffset: 0,
    });
    expect(flightDurationMin(f, getAirport)).toEqual({ minutes: 810, estimated: false });
  });

  it('falls back to a distance estimate', () => {
    const f = flight({ date: '2025-01-01', fromIata: 'CMB', toIata: 'DXB' });
    const r = flightDurationMin(f, getAirport)!;
    expect(r.estimated).toBe(true);
    expect(r.minutes).toBeGreaterThan(270);
    expect(r.minutes).toBeLessThan(280);
  });

  it('estimates when explicit offset gives a negative duration', () => {
    const f = flight({
      date: '2025-01-01',
      fromIata: 'CMB',
      toIata: 'DXB',
      depLocal: '21:45',
      arrLocal: '00:55',
      arrDayOffset: 0,
    });
    expect(durationFromTimes(f, getAirport)).toBeNull();
    expect(flightDurationMin(f, getAirport)?.estimated).toBe(true);
  });

  it('returns null for unknown airports', () => {
    const f = flight({
      date: '2025-01-01',
      fromIata: 'ZZZ',
      toIata: 'DXB',
      depLocal: '10:00',
      arrLocal: '12:00',
    });
    expect(flightDurationMin(f, getAirport)).toBeNull();
  });

  it('estimate formula', () => {
    expect(estimateMinutesFromKm(800)).toBe(90);
    expect(estimateMinutesFromKm(0)).toBe(30);
  });
});
