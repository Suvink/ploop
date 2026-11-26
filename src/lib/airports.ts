import type { Airline, Airport, AirportLookup, AirportRow, Country } from './types';

export function rowToAirport(r: AirportRow): Airport {
  return {
    iata: r[0],
    icao: r[1],
    name: r[2],
    city: r[3],
    country: r[4],
    lat: r[5],
    lon: r[6],
    tz: r[7],
    size: r[8],
  };
}

export interface AirportIndex {
  list: Airport[];
  byIata: Map<string, Airport>;
  get: AirportLookup;
  search: (query: string, limit?: number) => Airport[];
}

const SIZE_RANK = { L: 0, M: 1, S: 2 } as const;

/** Lowercase and strip diacritics so "montreal" matches "Montréal". */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function buildAirportIndex(rows: AirportRow[]): AirportIndex {
  const list = rows.map(rowToAirport);
  const byIata = new Map(list.map((a) => [a.iata, a]));
  const folded = list.map((a) => ({ a, city: fold(a.city), name: fold(a.name) }));

  /**
   * Match tiers: IATA exact (0), ICAO exact (1), city prefix (2), name contains (3).
   * Within a tier rank large > medium > small, then alphabetical by IATA.
   */
  function search(query: string, limit = 20): Airport[] {
    const q = fold(query.trim());
    if (!q) return [];
    const upper = q.toUpperCase();
    const scored: { a: Airport; tier: number }[] = [];
    for (const f of folded) {
      let tier = -1;
      if (f.a.iata === upper) tier = 0;
      else if (f.a.icao === upper) tier = 1;
      else if (f.city.startsWith(q) || f.city.split(/[\s(/-]+/).some((w) => w.startsWith(q)))
        tier = 2;
      else if (f.name.includes(q)) tier = 3;
      else if (q.length <= 3 && f.a.iata.startsWith(upper)) tier = 4;
      if (tier >= 0) scored.push({ a: f.a, tier });
    }
    scored.sort(
      (x, y) =>
        x.tier - y.tier ||
        SIZE_RANK[x.a.size] - SIZE_RANK[y.a.size] ||
        x.a.iata.localeCompare(y.a.iata),
    );
    return scored.slice(0, limit).map((s) => s.a);
  }

  return { list, byIata, get: (iata) => byIata.get(iata.toUpperCase()), search };
}

export function buildAirlineIndex(list: Airline[]): Map<string, Airline> {
  return new Map(list.map((a) => [a.iata, a]));
}

export type CountryMap = Record<string, Country>;

/** "UL504", "UL 504", "ul0504a" → { airline: 'UL', number: '504A' }. Returns null if no match. */
export function splitFlightDesignator(input: string): { airline: string; number: string } | null {
  const m = input
    .trim()
    .toUpperCase()
    .match(/^([A-Z0-9]{2})\s*0*(\d{1,4}[A-Z]?)$/);
  if (!m || /^\d\d$/.test(m[1])) return null;
  return { airline: m[1], number: m[2] };
}

/** Normalise a flight number: strip spaces and leading zeros, keep letter suffix. */
export function normaliseFlightNumber(input: string): string | null {
  const t = input.trim().toUpperCase().replace(/\s+/g, '');
  if (!t) return null;
  const m = t.match(/^0*(\d+)([A-Z]?)$/);
  if (!m) return t;
  return (m[1] || '0') + m[2];
}
