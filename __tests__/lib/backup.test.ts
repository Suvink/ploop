import { BackupFormatError, buildBackup, planImport } from '../../src/lib/backup';
import { DEFAULT_SETTINGS, settingsFromRows } from '../../src/lib/settings';
import { flight } from './helpers';

const a = flight({
  id: 'a',
  date: '2025-01-01',
  fromIata: 'CMB',
  toIata: 'DXB',
  updatedAt: '2025-01-01T00:00:00Z',
});
const b = flight({
  id: 'b',
  date: '2025-01-05',
  fromIata: 'DXB',
  toIata: 'CMB',
  updatedAt: '2025-01-05T00:00:00Z',
});

describe('backup', () => {
  const file = JSON.stringify(
    buildBackup({ ...DEFAULT_SETTINGS, homeAirport: 'CMB' }, [a, b], new Date('2025-02-01')),
  );

  it('builds the documented envelope', () => {
    const j = JSON.parse(file);
    expect(j).toMatchObject({
      app: 'flight-passport',
      version: 1,
      exportedAt: '2025-02-01T00:00:00.000Z',
    });
    expect(j.flights).toHaveLength(2);
  });

  it('merges by id with newer updatedAt winning', () => {
    const existing = [
      { id: 'a', updatedAt: '2024-12-01T00:00:00Z' }, // older → updated
      { id: 'b', updatedAt: '2025-03-01T00:00:00Z' }, // newer locally → skipped
    ];
    const plan = planImport(file, existing, 'merge');
    expect(plan.report).toEqual({ added: 0, updated: 1, skipped: 1, errors: [] });
    expect(plan.toUpdate.map((f) => f.id)).toEqual(['a']);
    expect(plan.settings.homeAirport).toBe('CMB');
  });

  it('replace mode inserts everything', () => {
    const plan = planImport(file, [{ id: 'a', updatedAt: 'z' }], 'replace');
    expect(plan.toInsert).toHaveLength(2);
    expect(plan.report.added).toBe(2);
  });

  it('reports invalid flights and duplicate ids', () => {
    const j = JSON.parse(file);
    j.flights.push({ id: 'bad', date: 'yesterday' }, a);
    const plan = planImport(JSON.stringify(j), [], 'merge');
    expect(plan.report.added).toBe(2);
    expect(plan.report.skipped).toBe(1);
    expect(plan.report.errors).toHaveLength(1);
  });

  it('fills optional fields with null', () => {
    const j = {
      app: 'flight-passport',
      version: 1,
      exportedAt: 'x',
      flights: [
        {
          id: 'z',
          date: '2025-01-01',
          fromIata: 'CMB',
          toIata: 'DXB',
          createdAt: 'x',
          updatedAt: 'x',
        },
      ],
    };
    const plan = planImport(JSON.stringify(j), [], 'merge');
    expect(plan.toInsert[0]).toMatchObject({
      seat: null,
      cabin: null,
      source: 'import',
      arrDayOffset: null,
    });
    expect(plan.settings).toEqual({});
  });

  it('rejects non-backups', () => {
    expect(() => planImport('not json', [], 'merge')).toThrow(BackupFormatError);
    expect(() => planImport('{"app":"other"}', [], 'merge')).toThrow(BackupFormatError);
  });
});

describe('settingsFromRows', () => {
  it('decodes JSON values and ignores junk', () => {
    const s = settingsFromRows([
      { key: 'homeAirport', value: '"CMB"' },
      { key: 'distanceUnit', value: '"mi"' },
      { key: 'theme', value: '"dark"' },
      { key: 'ploopMode', value: 'true' },
      { key: 'passportName', value: '"Ada"' },
      { key: 'unknown', value: '1' },
      { key: 'distanceUnit', value: '"parsecs"' },
      { key: 'theme', value: '{bad json' },
    ]);
    expect(s).toEqual({
      homeAirport: 'CMB',
      distanceUnit: 'mi',
      theme: 'dark',
      ploopMode: true,
      passportName: 'Ada',
      memberSince: null,
      loopFoundOn: null,
    });
  });
});

describe('member since', () => {
  const { initialMemberSince } = jest.requireActual('../../src/lib/settings');
  it('is today on a fresh install', () => {
    expect(initialMemberSince('2026-11-26', [])).toBe('2026-11-26');
  });
  it('falls back to the first logged flight on older installs', () => {
    expect(
      initialMemberSince('2026-11-26', ['2025-03-02T10:00:00.000Z', '2024-12-31T23:00:00.000Z']),
    ).toBe('2024-12-31');
  });
});
