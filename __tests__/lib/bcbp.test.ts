import {
  NotBcbpError,
  cabinFromCompartment,
  normaliseSeat,
  parseBcbp,
  tryParseBcbp,
} from '../../src/lib/bcbp';

const ONE = 'M1LASTNAME/FIRSTNAME  EABC123 YULFRAAC 0834 226F001A0025 100';
const TWO =
  'M2LASTNAME/FIRSTNAME  EABC123 YULFRAAC 0834 226F001A0025 100DEF456 FRAGVALH 3664 227C012C0002 100';

describe('parseBcbp', () => {
  it('parses a single-leg pass', () => {
    const p = parseBcbp(ONE);
    expect(p.partial).toBe(false);
    expect(p.legs).toHaveLength(1);
    expect(p.legs[0]).toEqual({
      from: 'YUL',
      to: 'FRA',
      carrier: 'AC',
      flightNumber: '834',
      dayOfYear: 226,
      compartment: 'F',
      seat: '1A',
    });
  });

  it('parses a two-leg pass', () => {
    const p = parseBcbp(TWO);
    expect(p.partial).toBe(false);
    expect(p.legs).toHaveLength(2);
    expect(p.legs[1]).toEqual({
      from: 'FRA',
      to: 'GVA',
      carrier: 'LH',
      flightNumber: '3664',
      dayOfYear: 227,
      compartment: 'C',
      seat: '12C',
    });
  });

  it('skips the variable-size field (hex) before the next leg', () => {
    // First leg has a 0x0A (10) char conditional section.
    const raw =
      'M2LASTNAME/FIRSTNAME  EABC123 YULFRAAC 0834 226F001A0025 10A>123456789DEF456 FRAGVALH 3664 227C012C0002 100';
    const p = parseBcbp(raw);
    expect(p.legs[1].from).toBe('FRA');
    expect(p.legs[1].to).toBe('GVA');
  });

  it('throws NotBcbpError for non-M strings', () => {
    expect(() => parseBcbp('https://example.com')).toThrow(NotBcbpError);
    expect(() => parseBcbp('X1LASTNAME')).toThrow(NotBcbpError);
    expect(() => parseBcbp('M9LASTNAME/FIRSTNAME  E')).toThrow(NotBcbpError);
    expect(() => parseBcbp('')).toThrow(NotBcbpError);
    expect(tryParseBcbp('hello')).toBeNull();
  });

  it('throws when no leg can be read', () => {
    expect(() => parseBcbp('M1LASTNAME/FIRSTNAME  EABC')).toThrow(NotBcbpError);
  });

  it('marks truncated strings as partial', () => {
    const p = parseBcbp(ONE.slice(0, 50));
    expect(p.partial).toBe(true);
    expect(p.legs[0].from).toBe('YUL');
    expect(p.legs[0].to).toBe('FRA');
  });

  it('marks missing later legs as partial', () => {
    const p = parseBcbp('M2' + ONE.slice(2));
    expect(p.partial).toBe(true);
    expect(p.legs).toHaveLength(1);
  });

  it('returns null for blank, INF and GATE seats', () => {
    expect(parseBcbp(ONE.replace('001A', '    ')).legs[0].seat).toBeNull();
    expect(normaliseSeat('INF ')).toBeNull();
    expect(normaliseSeat('GATE')).toBeNull();
    expect(normaliseSeat('0000')).toBeNull();
    expect(normaliseSeat(null)).toBeNull();
    expect(normaliseSeat('012C')).toBe('12C');
  });

  it('upper-cases lowercase input', () => {
    const p = parseBcbp(ONE.toLowerCase());
    expect(p.legs[0].from).toBe('YUL');
    expect(p.legs[0].carrier).toBe('AC');
  });

  it('keeps flight number letter suffix and handles bad day-of-year', () => {
    const p = parseBcbp(ONE.replace('0834 ', '0123A').replace('226F', '   F'));
    expect(p.legs[0].flightNumber).toBe('123A');
    expect(p.legs[0].dayOfYear).toBeNull();
  });

  it('strips scanner prefixes (symbology id, BOM, whitespace)', () => {
    expect(parseBcbp(']L2' + ONE).legs[0].from).toBe('YUL');
    expect(parseBcbp('\uFEFF' + ONE).legs[0].to).toBe('FRA');
    expect(parseBcbp('\n  ' + ONE).legs[0].carrier).toBe('AC');
  });

  it('falls back to pattern parsing when spaces were collapsed', () => {
    const collapsed = ONE.replace(/ +/g, ' ');
    const p = parseBcbp(collapsed);
    expect(p.partial).toBe(true);
    expect(p.legs[0]).toMatchObject({
      from: 'YUL',
      to: 'FRA',
      carrier: 'AC',
      flightNumber: '834',
      dayOfYear: 226,
      compartment: 'F',
      seat: '1A',
    });
    const two = parseBcbp(TWO.replace(/ +/g, ' '));
    expect(two.legs.map((l) => `${l.from}${l.to}`)).toEqual(['YULFRA', 'FRAGVA']);
  });

  it('handles a short name field and left-aligned flight number', () => {
    const p = parseBcbp('M1DOE/JOHN EABC123 CMBDXBUL 225 045Y032A0001 100');
    expect(p.legs[0]).toMatchObject({
      from: 'CMB',
      to: 'DXB',
      carrier: 'UL',
      flightNumber: '225',
      dayOfYear: 45,
      seat: '32A',
    });
  });

  it('parses a realistic pass with conditional and airline-use data', () => {
    const raw =
      'M1DESMARAIS/LUC       EABC123 YULFRAAC 0834 226F001A0025 14D>6181WW6225BAC 00141234560032A0141234567890 1AC AC 1234567890123    20KYLX58ZDEF456 FRAGVALH';
    const p = parseBcbp(raw);
    expect(p.partial).toBe(false);
    expect(p.legs[0]).toMatchObject({ from: 'YUL', to: 'FRA', flightNumber: '834', seat: '1A' });
  });

  it('never returns the passenger name or PNR', () => {
    const json = JSON.stringify(parseBcbp(TWO));
    expect(json).not.toContain('LASTNAME');
    expect(json).not.toContain('ABC123');
    expect(json).not.toContain('DEF456');
  });
});

describe('cabinFromCompartment', () => {
  it.each([
    ['F', 'first'],
    ['A', 'first'],
    ['P', 'first'],
    ['J', 'business'],
    ['C', 'business'],
    ['Z', 'business'],
    ['W', 'premium'],
    ['E', 'premium'],
    ['Y', 'economy'],
    ['M', 'economy'],
    [null, 'economy'],
  ])('%s → %s', (code, cabin) => {
    expect(cabinFromCompartment(code)).toBe(cabin);
  });
});
