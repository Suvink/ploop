import { randomUUID } from 'expo-crypto';
import { eq, inArray } from 'drizzle-orm';
import { db } from './client';
import { flights, settings } from './schema';
import type { FlightFields } from '@/lib/flightForm';
import type { Flight, FlightSource } from '@/lib/types';
import type { Settings, SettingKey } from '@/lib/settings';

const nowIso = () => new Date().toISOString();

export async function insertFlights(
  items: FlightFields[],
  source: FlightSource,
): Promise<string[]> {
  const now = nowIso();
  const rows = items.map((f) => ({
    ...f,
    id: randomUUID(),
    source,
    createdAt: now,
    updatedAt: now,
  }));
  if (rows.length) await db.insert(flights).values(rows);
  return rows.map((r) => r.id);
}

export async function updateFlight(id: string, fields: FlightFields): Promise<void> {
  await db
    .update(flights)
    .set({ ...fields, updatedAt: nowIso() })
    .where(eq(flights.id, id));
}

export async function deleteFlight(id: string): Promise<void> {
  await db.delete(flights).where(eq(flights.id, id));
}

export async function getAllFlights(): Promise<Flight[]> {
  return db.select().from(flights);
}

export async function setSetting<K extends SettingKey>(key: K, value: Settings[K]): Promise<void> {
  const v = JSON.stringify(value);
  await db
    .insert(settings)
    .values({ key, value: v })
    .onConflictDoUpdate({ target: settings.key, set: { value: v } });
}

export async function getSettingRows() {
  return db.select().from(settings);
}

/** Writes a planned import inside one transaction. */
export async function applyImport(
  toInsert: Flight[],
  toUpdate: Flight[],
  mode: 'merge' | 'replace',
  newSettings: Partial<Settings>,
): Promise<void> {
  await db.transaction(async (tx) => {
    if (mode === 'replace') await tx.delete(flights);
    for (let i = 0; i < toInsert.length; i += 200) {
      await tx.insert(flights).values(toInsert.slice(i, i + 200));
    }
    for (const f of toUpdate) {
      await tx.update(flights).set(f).where(eq(flights.id, f.id));
    }
    for (const [key, value] of Object.entries(newSettings)) {
      const v = JSON.stringify(value);
      await tx
        .insert(settings)
        .values({ key, value: v })
        .onConflictDoUpdate({ target: settings.key, set: { value: v } });
    }
  });
}

export async function deleteFlights(ids: string[]): Promise<void> {
  if (ids.length) await db.delete(flights).where(inArray(flights.id, ids));
}
