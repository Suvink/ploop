import { routeKey } from './stats';
import type { Airport, AirportLookup, Flight } from './types';

export interface MapData {
  routes: { a: Airport; b: Airport }[];
  airports: Airport[];
  visited: Set<string>;
}

/** Distinct undirected routes and airports for past flights in range (unknown airports skipped). */
export function buildMapData(
  flights: Flight[],
  getAirport: AirportLookup,
  range: { year?: number },
  today: string,
): MapData {
  const seen = new Set<string>();
  const routes: MapData['routes'] = [];
  const airports = new Map<string, Airport>();
  const visited = new Set<string>();
  for (const f of flights) {
    if (f.date > today) continue;
    if (range.year != null && (f.yearUnknown || !f.date.startsWith(`${range.year}-`))) continue;
    const a = getAirport(f.fromIata);
    const b = getAirport(f.toIata);
    for (const ap of [a, b]) {
      if (ap) {
        airports.set(ap.iata, ap);
        visited.add(ap.country);
      }
    }
    if (!a || !b) continue;
    const [x, y] = routeKey(a.iata, b.iata);
    const k = `${x}-${y}`;
    if (seen.has(k)) continue;
    seen.add(k);
    routes.push({ a, b });
  }
  return { routes, airports: [...airports.values()], visited };
}
