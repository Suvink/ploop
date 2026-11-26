import {
  computeStats,
  computeStatsMemo,
  flightsHash,
  isNightDeparture,
  routeKey,
  seatLetter,
} from '../../src/lib/stats';
import { countries, flight, getAirport } from './helpers';

const TODAY = '2025-06-01';

const log = [
  flight({
    id: 'a',
    date: '2023-03-01',
    fromIata: 'CMB',
    toIata: 'DXB',
    airlineIata: 'UL',
    seat: '14A',
    depLocal: '23:00',
    aircraftType: 'A330-300',
  }),
  flight({
    id: 'b',
    date: '2023-03-10',
    fromIata: 'DXB',
    toIata: 'CMB',
    airlineIata: 'UL',
    seat: '22C',
    depLocal: '09:00',
    aircraftType: 'A330-300',
  }),
  flight({
    id: 'c',
    date: '2024-07-01',
    fromIata: 'SYD',
    toIata: 'LAX',
    airlineIata: 'QF',
    seat: '40K',
    depLocal: '21:30',
    arrLocal: '16:00',
    arrDayOffset: 0,
  }),
  flight({
    id: 'd',
    date: '2024-08-01',
    fromIata: 'CMB',
    toIata: 'MLE',
    airlineIata: 'UL',
    seat: '3F',
    durationMin: 75,
  }),
  flight({
    id: 'e',
    date: '2024-09-01',
    fromIata: 'CMB',
    toIata: 'DXB',
    airlineIata: 'EK',
    depLocal: '04:30',
  }),
  flight({ id: 'up', date: '2025-07-01', fromIata: 'CMB', toIata: 'SIN', airlineIata: 'SQ' }),
];

describe('computeStats', () => {
  const all = computeStats(log, getAirport, countries, {}, TODAY);

  it('counts only past flights and reports upcoming separately', () => {
    expect(all.flightCount).toBe(5);
    expect(all.upcomingCount).toBe(1);
  });

  it('collects airports, countries (ordered by first visit) and continents', () => {
    expect(new Set(all.airports)).toEqual(new Set(['CMB', 'DXB', 'SYD', 'LAX', 'MLE']));
    expect(all.countries.map((c) => c.code)).toEqual(['LK', 'AE', 'AU', 'US', 'MV']);
    expect(all.countries[0]).toEqual({ code: 'LK', firstDate: '2023-03-01' });
    expect(new Set(all.continents)).toEqual(new Set(['AS', 'OC', 'NA']));
  });

  it('counts routes undirected', () => {
    expect(all.routes[0]).toEqual({ a: 'CMB', b: 'DXB', count: 3 });
    expect(routeKey('DXB', 'CMB')).toEqual(['CMB', 'DXB']);
  });

  it('ranks airlines and aircraft', () => {
    expect(all.airlines[0]).toEqual({ iata: 'UL', count: 3 });
    expect(all.aircraft).toEqual([{ type: 'A330-300', count: 2 }]);
  });

  it('finds longest and shortest', () => {
    expect(all.longest).toBe('c');
    expect(all.shortest).toBe('d');
  });

  it('computes distance, time and estimation flag', () => {
    expect(all.distanceKm).toBeGreaterThan(12000 + 3 * 3200);
    expect(all.minutes).toBeGreaterThan(810 + 75);
    expect(all.minutesEstimated).toBe(true);
    expect(all.funFacts.earthLaps).toBeCloseTo(all.distanceKm / 40075);
    expect(all.funFacts.moonPct).toBeCloseTo((all.distanceKm / 384400) * 100);
    expect(all.funFacts.days).toBeCloseTo(all.minutes / 1440);
  });

  it('computes window and night shares', () => {
    // seats: 14A (win), 22C, 40K (win), 3F (win) → 3/4
    expect(all.windowShare).toBeCloseTo(0.75);
    // timed: 23:00 (night), 09:00, 21:30, 04:30 (night) → 2/4
    expect(all.nightShare).toBeCloseTo(0.5);
    expect(all.nightCount).toBe(2);
  });

  it('filters by year', () => {
    const y = computeStats(log, getAirport, countries, { year: 2024 }, TODAY);
    expect(y.flightCount).toBe(3);
    expect(y.firstDate).toBe('2024-07-01');
    expect(y.lastDate).toBe('2024-09-01');
    expect(y.years).toEqual([2024, 2023]);
    const y2 = computeStats(log, getAirport, countries, { year: 2025 }, TODAY);
    expect(y2.flightCount).toBe(0);
    expect(y2.upcomingCount).toBe(1);
    expect(y2.windowShare).toBeNull();
    expect(y2.nightShare).toBeNull();
    expect(y2.longest).toBeNull();
  });

  it('memoises by flight hash', () => {
    const a = computeStatsMemo(log, getAirport, countries, {}, TODAY);
    const b = computeStatsMemo([...log], getAirport, countries, {}, TODAY);
    expect(a).toBe(b);
    const changed = log.map((f, i) => (i === 0 ? { ...f, updatedAt: '2025-01-01' } : f));
    expect(flightsHash(changed)).not.toBe(flightsHash(log));
    expect(computeStatsMemo(changed, getAirport, countries, {}, TODAY)).not.toBe(a);
  });

  it('runs fast for 2,000 flights', () => {
    const many = Array.from({ length: 2000 }, (_, i) => ({ ...log[i % 5], id: `m${i}` }));
    const t = performance.now();
    computeStats(many, getAirport, countries, {}, TODAY);
    expect(performance.now() - t).toBeLessThan(500);
  });

  it('helpers', () => {
    expect(isNightDeparture('22:00')).toBe(true);
    expect(isNightDeparture('05:59')).toBe(true);
    expect(isNightDeparture('06:00')).toBe(false);
    expect(seatLetter('12a')).toBe('A');
    expect(seatLetter(null)).toBeNull();
    expect(seatLetter('12')).toBeNull();
  });
});
