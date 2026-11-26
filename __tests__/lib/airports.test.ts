import {
  buildAirlineIndex,
  fold,
  normaliseFlightNumber,
  splitFlightDesignator,
} from '../../src/lib/airports';
import { airportIndex } from './helpers';
import airlines from '../../assets/data/airlines.json';

describe('airport search', () => {
  it('ranks CMB first for "cmb"', () => {
    expect(airportIndex.search('cmb')[0].iata).toBe('CMB');
  });

  it('ranks Colombo Bandaranaike first for "colombo"', () => {
    const r = airportIndex.search('colombo');
    expect(r[0].iata).toBe('CMB');
    expect(r.map((a) => a.iata)).toContain('RML');
  });

  it('matches ICAO, folded city names and name substrings', () => {
    expect(airportIndex.search('vcbi')[0].iata).toBe('CMB');
    expect(airportIndex.search('montreal')[0].iata).toBe('YUL');
    expect(airportIndex.search('heathrow')[0].iata).toBe('LHR');
    expect(airportIndex.search('   ')).toEqual([]);
    expect(airportIndex.search('lon', 5)).toHaveLength(5);
  });

  it('looks up by IATA case-insensitively', () => {
    expect(airportIndex.get('cmb')?.city).toBe('Colombo');
    expect(airportIndex.get('ZZZ')).toBeUndefined();
  });

  it('folds diacritics', () => {
    expect(fold('Montréal')).toBe('montreal');
  });
});

describe('flight designators', () => {
  it('splits airline and number', () => {
    expect(splitFlightDesignator('UL504')).toEqual({ airline: 'UL', number: '504' });
    expect(splitFlightDesignator('ul 0504')).toEqual({ airline: 'UL', number: '504' });
    expect(splitFlightDesignator('6E1234A')).toEqual({ airline: '6E', number: '1234A' });
    expect(splitFlightDesignator('504')).toBeNull();
    expect(splitFlightDesignator('12345')).toBeNull();
  });

  it('normalises flight numbers', () => {
    expect(normaliseFlightNumber('0834')).toBe('834');
    expect(normaliseFlightNumber(' 12 a')).toBe('12A');
    expect(normaliseFlightNumber('')).toBeNull();
    expect(normaliseFlightNumber('X-1')).toBe('X-1');
  });

  it('indexes airlines', () => {
    expect(buildAirlineIndex(airlines).get('UL')?.name).toBe('SriLankan Airlines');
  });
});
