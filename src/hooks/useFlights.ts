import { useMemo } from 'react';
import { asc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '@/db/client';
import { flights } from '@/db/schema';
import type { Flight } from '@/lib/types';

export function useFlights(): { flights: Flight[]; loaded: boolean } {
  const { data, updatedAt } = useLiveQuery(
    db.select().from(flights).orderBy(asc(flights.date), asc(flights.createdAt)),
  );
  return { flights: data ?? [], loaded: updatedAt !== undefined };
}

export function useFlight(id: string | undefined): { flight: Flight | null; loaded: boolean } {
  const { data, updatedAt } = useLiveQuery(
    db
      .select()
      .from(flights)
      .where(eq(flights.id, id ?? '')),
    [id],
  );
  return useMemo(
    () => ({ flight: data?.[0] ?? null, loaded: updatedAt !== undefined }),
    [data, updatedAt],
  );
}
