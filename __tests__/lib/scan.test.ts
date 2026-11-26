import { DateTime } from 'luxon';
import { dateFromIssue, firstBoardingPass, legToForm } from '../../src/lib/scan';
import { validateFlightForm } from '../../src/lib/flightForm';
import { generateDemoFlights } from '../../src/lib/demo';

const RAW =
  'M2SMITH/JANE MS       EXYZ789 YULFRAAC 0834 226F001A0025 100DEF456 FRAGVALH 3664 227C012C0002 100';

describe('scan → flight', () => {
  it('finds the first barcode that is a boarding pass', () => {
    expect(firstBoardingPass(['https://x.y', 'hello', RAW])?.legs).toHaveLength(2);
    expect(firstBoardingPass(['nope'])).toBeNull();
  });

  it('converts legs to form values with inferred dates and cabins', () => {
    const pass = firstBoardingPass([RAW])!;
    const today = DateTime.fromISO('2025-08-10');
    const v = legToForm(pass.legs[0], today);
    expect(v).toMatchObject({
      date: '2025-08-14',
      fromIata: 'YUL',
      toIata: 'FRA',
      airlineIata: 'AC',
      flightNumber: '834',
      seat: '1A',
      cabin: 'first',
    });
    expect(legToForm({ ...pass.legs[1], dayOfYear: null }, today).date).toBe('2025-08-10');
  });

  it('uses the current year when the pass has no issue date', () => {
    const pass = firstBoardingPass([RAW])!;
    expect(pass.issued).toBeNull();
    const v = legToForm(pass.legs[0], DateTime.fromISO('2026-01-10'), pass.issued);
    expect(v.date).toBe('2026-08-14');
    expect(v.yearUnknown).toBe(false);
  });

  it('takes the year from the pass issue date when present', () => {
    const raw =
      'M1DESMARAIS/LUC       EABC123 YULFRAAC 0834 226F001A0025 14D>6181WW6225BAC 00141234560032A0141234567890 1AC AC 1234567890123    20KYLX58ZDEF456 FRAGVALH';
    const pass = firstBoardingPass([raw])!;
    expect(pass.issued).toEqual({ yearDigit: 6, dayOfYear: 225 });
    const v = legToForm(pass.legs[0], DateTime.fromISO('2026-11-26'), pass.issued);
    expect(v.date).toBe('2026-08-14');
    expect(v.yearUnknown).toBe(false);
    // Implausible issue years (here 2026 seen from 2031) fall back to the current year.
    expect(legToForm(pass.legs[0], DateTime.fromISO('2031-01-05'), pass.issued).date).toBe(
      '2031-08-14',
    );
  });

  it('ignores a junk issue year (digit 0 → 2020) and uses the current year', () => {
    const pass = firstBoardingPass([
      'M1DESMARAIS/LUC       EABC123 YULFRAAC 0834 226F001A0025 14D>6181WW0225BAC 00141234560032A0141234567890 1AC AC 1234567890123    20KYLX58ZDEF456 FRAGVALH',
    ])!;
    expect(pass.issued).toEqual({ yearDigit: 0, dayOfYear: 225 });
    expect(legToForm(pass.legs[0], DateTime.fromISO('2026-11-26'), pass.issued).date).toBe(
      '2026-08-14',
    );
  });

  it('rolls into the next year when the pass was issued in late December', () => {
    const today = DateTime.fromISO('2026-03-01');
    expect(dateFromIssue(2, { yearDigit: 5, dayOfYear: 365 }, today)).toBe('2026-01-02');
    expect(dateFromIssue(365, { yearDigit: 5, dayOfYear: 365 }, today)).toBe('2025-12-31');
    // Day 366 in a non-leap year is not a real date.
    expect(dateFromIssue(366, { yearDigit: 5, dayOfYear: 360 }, today)).toBeNull();
  });

  it('never carries passenger name, PNR, check-in sequence or raw barcode into stored data', () => {
    const pass = firstBoardingPass([RAW])!;
    const today = DateTime.fromISO('2025-08-10');
    const rows = pass.legs.map((l) => {
      const r = validateFlightForm(legToForm(l, today));
      if (!r.ok) throw new Error('invalid');
      return { id: 'x', source: 'scan', createdAt: 'now', updatedAt: 'now', ...r.value };
    });
    const dump = JSON.stringify(rows);
    for (const secret of ['SMITH', 'JANE', 'XYZ789', 'DEF456', '0025', '0002', RAW]) {
      expect(dump).not.toContain(secret);
    }
  });
});

describe('demo data', () => {
  it('generates ~120 deterministic flights over 5 years', () => {
    const today = DateTime.fromISO('2025-06-01');
    const a = generateDemoFlights(today);
    const b = generateDemoFlights(today);
    expect(a.length).toBeGreaterThanOrEqual(120);
    expect(a.map((f) => f.id)).toEqual(b.map((f) => f.id));
    expect(new Set(a.map((f) => f.date.slice(0, 4))).size).toBeGreaterThanOrEqual(5);
  });
});
