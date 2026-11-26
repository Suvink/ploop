export type ThemePref = 'system' | 'light' | 'dark';

export interface Settings {
  homeAirport: string | null;
  distanceUnit: 'km' | 'mi';
  passportName: string;
  theme: ThemePref;
  ploopMode: boolean;
  /** 'YYYY-MM-DD' of the first app launch; shown as "Member since" on the passport. */
  memberSince: string | null;
  /** 'YYYY-MM-DD' when the user found The Loop easter egg (unlocks the Cloud Nine stamp). */
  loopFoundOn: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  homeAirport: null,
  distanceUnit: 'km',
  passportName: '',
  theme: 'system',
  ploopMode: false,
  memberSince: null,
  loopFoundOn: null,
};

export type SettingKey = keyof Settings;
export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as SettingKey[];

/** Settings rows hold JSON-encoded values; unknown keys and bad values fall back to defaults. */
export function settingsFromRows(rows: { key: string; value: string }[]): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if (!(SETTING_KEYS as string[]).includes(r.key)) continue;
    try {
      const v: unknown = JSON.parse(r.value);
      const key = r.key as SettingKey;
      const def = DEFAULT_SETTINGS[key];
      if (key === 'homeAirport' && (v === null || typeof v === 'string')) out.homeAirport = v;
      else if (key === 'distanceUnit' && (v === 'km' || v === 'mi')) out.distanceUnit = v;
      else if (key === 'theme' && (v === 'system' || v === 'light' || v === 'dark')) out.theme = v;
      else if (key === 'passportName' && typeof v === 'string') out.passportName = v;
      else if (
        key === 'memberSince' &&
        (v === null || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)))
      )
        out.memberSince = v;
      else if (
        key === 'loopFoundOn' &&
        (v === null || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)))
      )
        out.loopFoundOn = v;
      else if (key === 'ploopMode' && typeof v === typeof def) out.ploopMode = Boolean(v);
    } catch {
      // ignore malformed value
    }
  }
  return out;
}

/**
 * "Member since" for a fresh start: today. Installs from before this setting existed use the
 * day their first flight was logged, the closest thing we have to when they started.
 */
export function initialMemberSince(today: string, flightCreatedAts: string[]): string {
  const earliest = flightCreatedAts
    .map((c) => c.slice(0, 10))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()[0];
  return earliest && earliest < today ? earliest : today;
}
