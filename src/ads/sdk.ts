import type * as GoogleMobileAds from 'react-native-google-mobile-ads';

/**
 * Build without ads: set EXPO_PUBLIC_ADS=off when building. Ploop is open source, so anyone who'd
 * rather not see ads can build their own copy this way.
 */
export const ADS_DISABLED = process.env.EXPO_PUBLIC_ADS === 'off';

/**
 * The AdMob SDK, or null when ads are switched off or the installed app binary doesn't include
 * it (an older development build). Ads are optional: without the SDK the app runs normally.
 */
export let sdk: typeof GoogleMobileAds | null = null;
if (!ADS_DISABLED)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- must be lazy to catch a missing native module
    sdk = require('react-native-google-mobile-ads');
  } catch {
    if (__DEV__)
      console.warn(
        'Ads disabled: this build has no AdMob SDK. Rebuild with `npx expo run:android`.',
      );
  }
