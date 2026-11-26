import { scanFromURLAsync, type BarcodeScanningResult, type BarcodeType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { firstBoardingPass } from '@/lib/scan';
import type { ParsedBoardingPass } from '@/lib/bcbp';

export const BARCODE_TYPES: BarcodeType[] = ['pdf417', 'aztec', 'qr', 'datamatrix'];

/**
 * Candidate strings for one decoded barcode. On Android `data` is ML Kit's displayValue, which can
 * differ from the encoded text; BCBP relies on exact character positions, so try `raw` first.
 */
export function barcodeStrings(r: Pick<BarcodeScanningResult, 'data' | 'raw'>): string[] {
  return [
    ...new Set([r.raw, r.data].filter((s): s is string => typeof s === 'string' && s.length > 0)),
  ];
}

/** Dev-only summary of a decoded barcode that never prints the passenger name. */
export function describeBarcode(r: Pick<BarcodeScanningResult, 'data' | 'raw' | 'type'>): string {
  const s = r.raw ?? r.data ?? '';
  return `type=${r.type} len=${s.length} head=${JSON.stringify(s.slice(0, 2))} rawDiffers=${r.raw != null && r.raw !== r.data}`;
}

export type ScreenshotResult =
  | { kind: 'cancelled' }
  | { kind: 'found'; pass: ParsedBoardingPass }
  | { kind: 'none' }
  | { kind: 'error'; message: string };

/**
 * Pick a screenshot from the library and decode its barcodes on-device.
 * expo-camera's scanFromURLAsync uses Google ML Kit on Android (PDF417 + Aztec supported).
 * If a device ever fails here, swap this function for @react-native-ml-kit/barcode-scanning.
 */
export async function scanScreenshot(): Promise<ScreenshotResult> {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    allowsEditing: false,
  });
  if (picked.canceled || !picked.assets?.[0]) return { kind: 'cancelled' };
  try {
    const results = await scanFromURLAsync(picked.assets[0].uri, BARCODE_TYPES);
    if (__DEV__) results.forEach((r) => console.log('[scan] screenshot', describeBarcode(r)));
    const pass = firstBoardingPass(results.flatMap(barcodeStrings));
    return pass ? { kind: 'found', pass } : { kind: 'none' };
  } catch (e) {
    return { kind: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}
