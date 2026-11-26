import { geoInterpolate } from 'd3-geo';

export interface LatLon {
  lat: number;
  lon: number;
}

export const EARTH_RADIUS_KM = 6371.0088;
export const KM_PER_MILE = 1.609344;

const rad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(a: LatLon, b: LatLon): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** n+1 points along the great circle from a to b, as [lon, lat]. */
export function greatCirclePoints(a: LatLon, b: LatLon, n = 64): [number, number][] {
  const interp = geoInterpolate([a.lon, a.lat], [b.lon, b.lat]);
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) pts.push(interp(i / n) as [number, number]);
  return pts;
}

/**
 * Split a [lon, lat] polyline wherever it crosses the antimeridian (longitude jump > 180°),
 * inserting interpolated points at ±180 so each segment reaches the map edge.
 */
export function splitAntimeridian(points: [number, number][]): [number, number][][] {
  if (points.length === 0) return [];
  const segments: [number, number][][] = [[points[0]]];
  for (let i = 1; i < points.length; i++) {
    const [lon1, lat1] = points[i - 1];
    const [lon2, lat2] = points[i];
    if (Math.abs(lon2 - lon1) > 180) {
      const edge1 = lon1 > 0 ? 180 : -180;
      const edge2 = -edge1;
      // Unwrap lon2 to be continuous with lon1, then find where it crosses the edge.
      const lon2u = lon2 + (lon1 > 0 ? 360 : -360);
      const t = (edge1 - lon1) / (lon2u - lon1);
      const latX = lat1 + t * (lat2 - lat1);
      segments[segments.length - 1].push([edge1, latX]);
      segments.push([[edge2, latX]]);
    }
    segments[segments.length - 1].push(points[i]);
  }
  return segments;
}

export function kmToUnit(km: number, unit: 'km' | 'mi'): number {
  return unit === 'mi' ? km / KM_PER_MILE : km;
}
