import { z } from 'zod';
import type { Settings } from './settings';
import type { Flight } from './types';

export const BACKUP_APP = 'flight-passport';
export const BACKUP_VERSION = 1;

const nullableStr = z
  .string()
  .nullable()
  .optional()
  .transform((v) => v ?? null);
const nullableInt = z
  .number()
  .int()
  .nullable()
  .optional()
  .transform((v) => v ?? null);

export const flightSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fromIata: z.string().regex(/^[A-Z0-9]{3}$/),
  toIata: z.string().regex(/^[A-Z0-9]{3}$/),
  airlineIata: nullableStr,
  flightNumber: nullableStr,
  depLocal: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  arrLocal: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  arrDayOffset: nullableInt,
  durationMin: nullableInt,
  seat: nullableStr,
  cabin: z
    .enum(['economy', 'premium', 'business', 'first'])
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  aircraftType: nullableStr,
  registration: nullableStr,
  notes: nullableStr,
  yearUnknown: z
    .boolean()
    .optional()
    .transform((v) => v ?? false),
  source: z.string().default('import'),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const settingsSchema = z
  .object({
    homeAirport: z.string().nullable(),
    distanceUnit: z.enum(['km', 'mi']),
    passportName: z.string(),
    theme: z.enum(['system', 'light', 'dark']),
    ploopMode: z.boolean(),
    memberSince: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    loopFoundOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
  })
  .partial();

export const backupSchema = z.object({
  app: z.literal(BACKUP_APP),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  settings: settingsSchema.default({}),
  flights: z.array(z.unknown()),
});

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  settings: Settings;
  flights: Flight[];
}

export function buildBackup(settings: Settings, flights: Flight[], now: Date): BackupFile {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    settings,
    flights,
  };
}

export interface ImportReport {
  added: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface ImportPlan {
  toInsert: Flight[];
  toUpdate: Flight[];
  settings: Partial<Settings>;
  report: ImportReport;
}

export class BackupFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupFormatError';
  }
}

/**
 * Validate a backup and decide what to write.
 * merge: insert unknown ids, update when the incoming updatedAt is newer, skip otherwise.
 * replace: every valid flight is inserted (caller wipes existing flights first).
 */
export function planImport(
  text: string,
  existing: Pick<Flight, 'id' | 'updatedAt'>[],
  mode: 'merge' | 'replace',
): ImportPlan {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new BackupFormatError('The file is not valid JSON.');
  }
  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) {
    throw new BackupFormatError('This file is not a Ploop backup (or is from a newer version).');
  }
  const report: ImportReport = { added: 0, updated: 0, skipped: 0, errors: [] };
  const toInsert: Flight[] = [];
  const toUpdate: Flight[] = [];
  const existingById = new Map(
    mode === 'merge' ? existing.map((f) => [f.id, f.updatedAt] as const) : [],
  );
  const seen = new Set<string>();

  parsed.data.flights.forEach((raw, i) => {
    const r = flightSchema.safeParse(raw);
    if (!r.success) {
      report.errors.push(`Flight #${i + 1}: ${r.error.issues[0]?.path.join('.') || 'invalid'}`);
      return;
    }
    const f = r.data as Flight;
    if (seen.has(f.id)) {
      report.skipped++;
      return;
    }
    seen.add(f.id);
    const current = existingById.get(f.id);
    if (current === undefined) {
      toInsert.push(f);
      report.added++;
    } else if (f.updatedAt > current) {
      toUpdate.push(f);
      report.updated++;
    } else {
      report.skipped++;
    }
  });

  return { toInsert, toUpdate, settings: parsed.data.settings, report };
}
