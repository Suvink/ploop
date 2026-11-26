import Constants from 'expo-constants';

/** App version from package.json (wired through app.config.js). */
export function appVersion(): string {
  return Constants.expoConfig?.version ?? '';
}
