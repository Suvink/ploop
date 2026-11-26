/** Bundled reference data, loaded once into memory. */
import { buildAirlineIndex, buildAirportIndex, type CountryMap } from '@/lib/airports';
import type { Airline, AirportRow } from '@/lib/types';
import airportsJson from '../../assets/data/airports.json';
import airlinesJson from '../../assets/data/airlines.json';
import countriesJson from '../../assets/data/countries.json';
import { AIRLINE_LOGOS } from './airlineLogos';

export const airports = buildAirportIndex(airportsJson as AirportRow[]);
export const airlines = buildAirlineIndex(airlinesJson as Airline[]);
export const countries = countriesJson as CountryMap;

export const getAirport = airports.get;

export function countryName(code: string): string {
  return countries[code]?.name ?? code;
}

export function airportLabel(iata: string): string {
  const a = getAirport(iata);
  return a ? `${a.city || a.name}` : 'Unknown airport';
}

export function airlineName(iata: string | null): string | null {
  if (!iata) return null;
  return airlines.get(iata)?.name ?? iata;
}

const CONTINENTS: Record<string, string> = {
  AF: 'Africa',
  AN: 'Antarctica',
  AS: 'Asia',
  EU: 'Europe',
  NA: 'North America',
  OC: 'Oceania',
  SA: 'South America',
};
export const continentName = (c: string) => CONTINENTS[c] ?? c;

/** Bundled logo image for an airline, if we have one. */
export function airlineLogo(iata: string | null | undefined): number | undefined {
  return iata ? AIRLINE_LOGOS[iata.toUpperCase()] : undefined;
}

export function airlineColor(iata: string | null | undefined): string | undefined {
  return iata ? airlines.get(iata.toUpperCase())?.color : undefined;
}
