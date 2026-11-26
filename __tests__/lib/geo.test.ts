import { greatCirclePoints, haversineKm, kmToUnit, splitAntimeridian } from '../../src/lib/geo';
import { getAirport } from './helpers';

describe('geo', () => {
  it('computes haversine distances', () => {
    const cmb = getAirport('CMB')!;
    const dxb = getAirport('DXB')!;
    expect(haversineKm(cmb, dxb)).toBeGreaterThan(3250);
    expect(haversineKm(cmb, dxb)).toBeLessThan(3300);
    expect(haversineKm(cmb, cmb)).toBe(0);
  });

  it('builds great-circle points', () => {
    const pts = greatCirclePoints({ lat: 0, lon: 0 }, { lat: 0, lon: 90 }, 4);
    expect(pts).toHaveLength(5);
    expect(pts[2][0]).toBeCloseTo(45);
    expect(pts[2][1]).toBeCloseTo(0);
  });

  it('splits SYD–LAX at the antimeridian', () => {
    const pts = greatCirclePoints(getAirport('SYD')!, getAirport('LAX')!);
    const segs = splitAntimeridian(pts);
    expect(segs).toHaveLength(2);
    expect(segs[0][segs[0].length - 1][0]).toBe(180);
    expect(segs[1][0][0]).toBe(-180);
    expect(segs[0][segs[0].length - 1][1]).toBeCloseTo(segs[1][0][1]);
    for (const s of segs) {
      for (let i = 1; i < s.length; i++) expect(Math.abs(s[i][0] - s[i - 1][0])).toBeLessThan(180);
    }
  });

  it('splits westbound crossings too and leaves normal routes alone', () => {
    const segs = splitAntimeridian([
      [-170, 10],
      [170, 12],
    ]);
    expect(segs).toHaveLength(2);
    expect(segs[0][1][0]).toBe(-180);
    expect(segs[1][0][0]).toBe(180);
    expect(
      splitAntimeridian(greatCirclePoints(getAirport('CMB')!, getAirport('DXB')!)),
    ).toHaveLength(1);
    expect(splitAntimeridian([])).toEqual([]);
  });

  it('converts units', () => {
    expect(kmToUnit(1.609344, 'mi')).toBeCloseTo(1);
    expect(kmToUnit(5, 'km')).toBe(5);
  });
});
