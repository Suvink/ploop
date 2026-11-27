import { sdk } from './sdk';

/**
 * AdMob native ad unit. Dev builds always use Google's test unit (never click your own live
 * ads). Release builds read EXPO_PUBLIC_ADMOB_NATIVE_UNIT, set as an EAS environment variable, and fall back to the
 * test unit so a build without it shows test ads instead of breaking.
 */
export const NATIVE_AD_UNIT: string =
  !__DEV__ && process.env.EXPO_PUBLIC_ADMOB_NATIVE_UNIT
    ? process.env.EXPO_PUBLIC_ADMOB_NATIVE_UNIT
    : (sdk?.TestIds.NATIVE ?? '');
