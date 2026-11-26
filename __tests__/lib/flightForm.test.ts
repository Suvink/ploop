import {
  applyDesignatorSplit,
  duplicateAsReturn,
  emptyForm,
  formFromFlight,
  isDuplicate,
  validateFlightForm,
} from '../../src/lib/flightForm';
import { flight } from './helpers';

const base = { ...emptyForm('2025-03-01'), fromIata: 'cmb', toIata: 'DXB' };

describe('validateFlightForm', () => {
  it('accepts a minimal valid flight', () => {
    const r = validateFlightForm(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.fromIata).toBe('CMB');
      expect(r.value.airlineIata).toBeNull();
      expect(r.value.seat).toBeNull();
    }
  });

  it('requires date, from and to, and from ≠ to', () => {
    const r = validateFlightForm({ ...emptyForm(''), fromIata: 'CMB', toIata: 'CMB' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.date).toBeDefined();
      expect(r.errors.toIata).toMatch(/differ/);
    }
    const r2 = validateFlightForm({ ...emptyForm('2025-01-01') });
    expect(!r2.ok && r2.errors.fromIata && r2.errors.toIata).toBeTruthy();
  });

  it('validates times and duration', () => {
    const r = validateFlightForm({ ...base, depLocal: '25:00', arrLocal: 'x', durationMin: '-3' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.depLocal).toBeDefined();
      expect(r.errors.arrLocal).toBeDefined();
      expect(r.errors.durationMin).toBeDefined();
    }
    const ok = validateFlightForm({
      ...base,
      depLocal: '2145',
      arrLocal: '0:55',
      arrNextDay: true,
      durationMin: '280',
    });
    expect(ok.ok && ok.value).toMatchObject({
      depLocal: '21:45',
      arrLocal: '00:55',
      arrDayOffset: 1,
      durationMin: 280,
    });
  });

  it('splits "UL 504" typed in the flight number field', () => {
    const r = validateFlightForm({ ...base, flightNumber: 'UL 504' });
    expect(r.ok && r.value).toMatchObject({ airlineIata: 'UL', flightNumber: '504' });
    expect(applyDesignatorSplit({ ...base, flightNumber: '504' }).flightNumber).toBe('504');
  });

  it('normalises seat, registration and rejects bad airline codes', () => {
    const r = validateFlightForm({
      ...base,
      seat: '012c',
      registration: '4r-alo',
      aircraftType: ' A330 ',
      notes: ' ',
    });
    expect(r.ok && r.value).toMatchObject({
      seat: '12C',
      registration: '4R-ALO',
      aircraftType: 'A330',
      notes: null,
    });
    const bad = validateFlightForm({ ...base, airlineIata: 'TOOLONG' });
    expect(!bad.ok && bad.errors.airlineIata).toBeTruthy();
  });
});

describe('form helpers', () => {
  const f = flight({
    date: '2025-03-01',
    fromIata: 'CMB',
    toIata: 'DXB',
    airlineIata: 'UL',
    flightNumber: '225',
    arrLocal: '01:00',
    arrDayOffset: 1,
    cabin: 'business',
    durationMin: 200,
  });

  it('round-trips a flight into the form', () => {
    const v = formFromFlight(f);
    expect(v).toMatchObject({
      fromIata: 'CMB',
      arrNextDay: true,
      durationMin: '200',
      cabin: 'business',
    });
  });

  it('duplicates as a return flight', () => {
    expect(duplicateAsReturn(f)).toMatchObject({
      fromIata: 'DXB',
      toIata: 'CMB',
      date: '',
      airlineIata: 'UL',
      flightNumber: '',
    });
  });

  it('detects duplicates', () => {
    expect(
      isDuplicate([f], { date: '2025-03-01', fromIata: 'CMB', toIata: 'DXB', flightNumber: '225' }),
    ).toBe(true);
    expect(
      isDuplicate([f], { date: '2025-03-02', fromIata: 'CMB', toIata: 'DXB', flightNumber: '225' }),
    ).toBe(false);
  });
});
