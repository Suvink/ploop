import { flightDurationMin } from './duration';
import { haversineKm } from './geo';
import type { CountryMap } from './airports';
import type { AirportLookup, Flight } from './types';

export interface CountryVisit {
  code: string;
  firstDate: string;
}
export interface Counted<K extends string> {
  key: K;
  count: number;
}
export interface RouteCount {
  a: string;
  b: string;
  count: number;
}

export interface Stats {
  flightCount: number;
  upcomingCount: number;
  distanceKm: number;
  minutes: number;
  minutesEstimated: boolean;
  airports: string[];
  countries: CountryVisit[];
  continents: string[];
  airlines: { iata: string; count: number }[];
  /** Distinct airlines flown. */
  airlineCount: number;
  aircraft: { type: string; count: number }[];
  routes: RouteCount[];
  /** Most-used airports (each departure and arrival counts once). */
  topAirports: { iata: string; count: number }[];
  longest: string | null;
  longestKm: number | null;
  shortest: string | null;
  shortestKm: number | null;
  windowShare: number | null;
  nightShare: number | null;
  nightCount: number;
  funFacts: { earthLaps: number; moonPct: number; days: number };
  years: number[];
  firstDate: string | null;
  lastDate: string | null;
}

export interface StatsRange {
  year?: number;
}

const EARTH_CIRCUMFERENCE_KM = 40075;
const MOON_DISTANCE_KM = 384400;
const WINDOW_LETTERS = new Set(['A', 'F', 'K', 'L']);

function topN<T extends string>(counts: Map<T, number>, n = 5): [T, number][] {
  return [...counts.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, n);
}

function inc<T>(m: Map<T, number>, k: T) {
  m.set(k, (m.get(k) ?? 0) + 1);
}

export function isNightDeparture(depLocal: string): boolean {
  const h = Number(depLocal.slice(0, 2));
  return h >= 22 || h < 6;
}

export function seatLetter(seat: string | null): string | null {
  if (!seat) return null;
  const m = seat
    .trim()
    .toUpperCase()
    .match(/([A-Z])$/);
  return m ? m[1] : null;
}

export function routeKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function computeStats(
  flights: Flight[],
  getAirport: AirportLookup,
  countries: CountryMap,
  range: StatsRange,
  today: string,
): Stats {
  const past = flights.filter((f) => f.date <= today);
  // Flights whose pass had no year count towards all-time totals but not towards a year.
  const years = [
    ...new Set(past.filter((f) => !f.yearUnknown).map((f) => Number(f.date.slice(0, 4)))),
  ].sort((a, b) => b - a);
  const inRange = (f: Flight) =>
    range.year == null || (!f.yearUnknown && f.date.startsWith(`${range.year}-`));
  const upcomingCount = flights.filter((f) => f.date > today && inRange(f)).length;
  const list = past
    .filter(inRange)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

  let distanceKm = 0;
  let minutes = 0;
  let minutesEstimated = false;
  const airportSet = new Set<string>();
  const countryFirst = new Map<string, string>();
  const continentSet = new Set<string>();
  const airlineCounts = new Map<string, number>();
  const aircraftCounts = new Map<string, number>();
  const routeCounts = new Map<string, number>();
  const airportCounts = new Map<string, number>();
  let longest: { id: string; km: number } | null = null;
  let shortest: { id: string; km: number } | null = null;
  let seatTotal = 0;
  let windowCount = 0;
  let timedTotal = 0;
  let nightCount = 0;

  for (const f of list) {
    const from = getAirport(f.fromIata);
    const to = getAirport(f.toIata);
    airportSet.add(f.fromIata);
    airportSet.add(f.toIata);
    inc(airportCounts, f.fromIata);
    inc(airportCounts, f.toIata);
    for (const ap of [from, to]) {
      if (!ap) continue;
      if (!countryFirst.has(ap.country)) countryFirst.set(ap.country, f.date);
      const continent = countries[ap.country]?.continent;
      if (continent) continentSet.add(continent);
    }
    if (from && to) {
      const km = haversineKm(from, to);
      distanceKm += km;
      if (!longest || km > longest.km) longest = { id: f.id, km };
      if (!shortest || km < shortest.km) shortest = { id: f.id, km };
    }
    const d = flightDurationMin(f, getAirport);
    if (d) {
      minutes += d.minutes;
      if (d.estimated) minutesEstimated = true;
    }
    if (f.airlineIata) inc(airlineCounts, f.airlineIata);
    if (f.aircraftType?.trim()) inc(aircraftCounts, f.aircraftType.trim());
    const [ra, rb] = routeKey(f.fromIata, f.toIata);
    inc(routeCounts, `${ra}-${rb}`);
    const letter = seatLetter(f.seat);
    if (letter) {
      seatTotal++;
      if (WINDOW_LETTERS.has(letter)) windowCount++;
    }
    if (f.depLocal) {
      timedTotal++;
      if (isNightDeparture(f.depLocal)) nightCount++;
    }
  }

  return {
    flightCount: list.length,
    upcomingCount,
    distanceKm,
    minutes,
    minutesEstimated,
    airports: [...airportSet],
    countries: [...countryFirst.entries()].map(([code, firstDate]) => ({ code, firstDate })),
    continents: [...continentSet],
    airlines: topN(airlineCounts).map(([iata, count]) => ({ iata, count })),
    airlineCount: airlineCounts.size,
    aircraft: topN(aircraftCounts).map(([type, count]) => ({ type, count })),
    routes: topN(routeCounts).map(([k, count]) => {
      const [a, b] = k.split('-');
      return { a, b, count };
    }),
    topAirports: topN(airportCounts).map(([iata, count]) => ({ iata, count })),
    longest: longest?.id ?? null,
    longestKm: longest?.km ?? null,
    shortest: shortest?.id ?? null,
    shortestKm: shortest?.km ?? null,
    windowShare: seatTotal ? windowCount / seatTotal : null,
    nightShare: timedTotal ? nightCount / timedTotal : null,
    nightCount,
    funFacts: {
      earthLaps: distanceKm / EARTH_CIRCUMFERENCE_KM,
      moonPct: (distanceKm / MOON_DISTANCE_KM) * 100,
      days: minutes / 1440,
    },
    years,
    firstDate: list[0]?.date ?? null,
    lastDate: list[list.length - 1]?.date ?? null,
  };
}

/** FNV-1a over id + updatedAt of every flight; cheap cache key. */
export function flightsHash(flights: Pick<Flight, 'id' | 'updatedAt'>[]): string {
  let h = 0x811c9dc5;
  for (const f of flights) {
    const s = f.id + f.updatedAt;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
  }
  return `${flights.length}:${(h >>> 0).toString(16)}`;
}

const cache = new Map<string, Stats>();
const CACHE_MAX = 16;

/** Memoised computeStats, keyed by a hash of flight ids/updatedAt, range and today. */
export function computeStatsMemo(
  flights: Flight[],
  getAirport: AirportLookup,
  countries: CountryMap,
  range: StatsRange,
  today: string,
): Stats {
  const key = `${flightsHash(flights)}|${range.year ?? 'all'}|${today}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const stats = computeStats(flights, getAirport, countries, range, today);
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
  cache.set(key, stats);
  return stats;
}
