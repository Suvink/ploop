/**
 * Ads that keep working offline.
 *
 * Native ads are loaded ahead of time while the phone is online and kept in a small in-memory
 * cache (and their icons in the image cache). A screen takes a ready ad from the cache, so it
 * shows instantly and still shows if the connection drops. If the cache is empty (offline for
 * a while), the slot simply isn't drawn: no spinners, no gaps. Loading is retried with backoff
 * and whenever the app comes back to the foreground.
 *
 * Google's guidance is to show an ad within an hour of loading it, so older ones are dropped.
 * Ads are never written to disk.
 */
import { AppState, Image } from 'react-native';
import type { NativeAd } from 'react-native-google-mobile-ads';
import { sdk } from './sdk';
import { NATIVE_AD_UNIT } from './config';

const CACHE_SIZE = 3;
const MAX_AGE_MS = 55 * 60 * 1000;
const RETRY_MIN_MS = 30 * 1000;
const RETRY_MAX_MS = 5 * 60 * 1000;

interface Entry {
  ad: NativeAd;
  loadedAt: number;
}

let started = false;
let ready = false;
let privacyOptionsRequired = false;
let cache: Entry[] = [];
let loading = false;
let failures = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

/** Development-only trace, shown in the Metro terminal. */
const log = (...args: unknown[]) => {
  if (__DEV__) console.log('[ads]', ...args);
};

function emit() {
  for (const l of listeners) l();
}

/** Called when the cache gains an ad or the ads state changes. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function prune() {
  const now = Date.now();
  cache = cache.filter((e) => {
    if (now - e.loadedAt < MAX_AGE_MS) return true;
    e.ad.destroy();
    return false;
  });
}

function scheduleRetry() {
  if (retryTimer) return;
  const delay = Math.min(RETRY_MAX_MS, RETRY_MIN_MS * 2 ** Math.max(0, failures - 1));
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void refill();
  }, delay);
}

/** Load ads one at a time until the cache is full. Offline, this fails quietly and retries. */
async function refill() {
  if (!sdk || !ready || loading) return;
  prune();
  loading = true;
  try {
    while (cache.length < CACHE_SIZE) {
      const ad = await sdk.NativeAd.createForAdRequest(NATIVE_AD_UNIT);
      // Warm the image cache now so the icon still draws if we go offline before it's shown.
      if (ad.icon?.url) Image.prefetch(ad.icon.url).catch(() => {});
      cache.push({ ad, loadedAt: Date.now() });
      log(`loaded "${ad.headline}" (${cache.length} ready)`);
      failures = 0;
      emit();
    }
  } catch (e) {
    failures++;
    log('load failed, will retry:', e instanceof Error ? e.message : String(e));
    scheduleRetry();
  } finally {
    loading = false;
  }
}

/** Hand a fresh ad to a slot. The slot owns it and must destroy it when unmounted. */
export function takeAd(): NativeAd | null {
  prune();
  const entry = cache.shift() ?? null;
  void refill();
  return entry?.ad ?? null;
}

async function gatherConsent() {
  if (!sdk) return false;
  const { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus } = sdk;
  // Shows Google's consent form where the law requires it (EEA, UK, Switzerland). Offline, this
  // fails and we fall back to the answer saved from last time.
  try {
    await AdsConsent.gatherConsent();
  } catch (e) {
    // offline or form error: use the stored consent state below
    log('consent form error:', e instanceof Error ? e.message : String(e));
  }
  try {
    const info = await AdsConsent.getConsentInfo();
    log('consent:', info.status, 'canRequestAds:', info.canRequestAds);
    privacyOptionsRequired =
      info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
    // Dev builds only ever load Google's test ads, so show them even if consent isn't set up
    // yet (e.g. no consent message published in AdMob). Release builds respect consent.
    return info.canRequestAds || __DEV__;
  } catch (e) {
    log('consent info error:', e instanceof Error ? e.message : String(e));
    return __DEV__;
  }
}

async function start() {
  if (ready) return;
  if (!(await gatherConsent())) {
    emit();
    return;
  }
  try {
    await sdk!.MobileAds().initialize();
    log('SDK ready, unit', NATIVE_AD_UNIT);
  } catch (e) {
    log('initialize failed:', e instanceof Error ? e.message : String(e));
    // initialize works offline; if it ever throws, try again on the next foreground
    return;
  }
  ready = true;
  emit();
  void refill();
}

/** Call once at app start. Safe to call again; it only starts once. */
export function startAds() {
  if (started || !sdk) return;
  started = true;
  void start();
  AppState.addEventListener('change', (s) => {
    if (s !== 'active') return;
    if (!ready) void start();
    else {
      failures = 0;
      void refill();
    }
  });
}

/** Re-open Google's privacy options form (required in Settings where consent applies). */
export async function showAdPrivacyOptions() {
  if (!sdk) return;
  await sdk.AdsConsent.showPrivacyOptionsForm();
  await gatherConsent();
  emit();
}

/** True where Google requires a "privacy choices" entry point (consent regions). */
export function getPrivacyOptionsRequired() {
  return privacyOptionsRequired;
}
