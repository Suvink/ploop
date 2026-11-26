import { useMemo } from 'react';
import { DateTime } from 'luxon';
import { computeStatsMemo, type Stats } from '@/lib/stats';
import { countries, getAirport } from '@/data/refdata';
import { useFlights } from './useFlights';

export function useToday(): string {
  return DateTime.local().toISODate()!;
}

export function useStats(year?: number): { stats: Stats; loaded: boolean } {
  const { flights, loaded } = useFlights();
  const today = useToday();
  const stats = useMemo(
    () => computeStatsMemo(flights, getAirport, countries, { year }, today),
    [flights, year, today],
  );
  return { stats, loaded };
}
