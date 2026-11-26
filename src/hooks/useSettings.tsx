import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '@/db/client';
import { settings as settingsTable } from '@/db/schema';
import { setSetting } from '@/db/repo';
import { DEFAULT_SETTINGS, settingsFromRows, type Settings } from '@/lib/settings';

interface SettingsContextValue {
  settings: Settings;
  loaded: boolean;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  update: async () => {},
});

/**
 * Settings come from SQLite, but changes are applied to local state first so the UI reacts
 * instantly even if the database change notification is late or missed.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data, updatedAt } = useLiveQuery(db.select().from(settingsTable));
  const [overrides, setOverrides] = useState<Partial<Settings>>({});
  const loaded = updatedAt !== undefined;

  const fromDb = useMemo(() => settingsFromRows(data ?? []), [data]);
  // Drop an override once the database has caught up with it, so a late or stale read can
  // never flip a switch back.
  const caughtUp = (Object.keys(overrides) as (keyof Settings)[]).filter(
    (k) => fromDb[k] === overrides[k],
  );
  if (caughtUp.length) {
    const next = { ...overrides };
    caughtUp.forEach((k) => delete next[k]);
    setOverrides(next);
  }

  const settings = useMemo(() => ({ ...fromDb, ...overrides }), [fromDb, overrides]);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setOverrides((o) => ({ ...o, [key]: value }));
    return setSetting(key, value).catch((e) => {
      // Keep the UI honest if the write failed.
      setOverrides((o) => {
        const next = { ...o };
        delete next[key];
        return next;
      });
      throw e;
    });
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, loaded, update }),
    [settings, loaded, update],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
