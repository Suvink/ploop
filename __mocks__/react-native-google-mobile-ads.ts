/** Jest stand-in for the AdMob SDK (a native module). No ads load, so ad slots render nothing. */
export const TestIds = { NATIVE: 'test-native' };
export const NativeAssetType = {
  ADVERTISER: 'advertiser',
  BODY: 'body',
  CALL_TO_ACTION: 'callToAction',
  HEADLINE: 'headline',
  ICON: 'icon',
};
export const AdsConsentPrivacyOptionsRequirementStatus = {
  UNKNOWN: 'UNKNOWN',
  REQUIRED: 'REQUIRED',
  NOT_REQUIRED: 'NOT_REQUIRED',
};
export const AdsConsent = {
  gatherConsent: async () => ({}),
  getConsentInfo: async () => ({
    canRequestAds: false,
    privacyOptionsRequirementStatus: 'NOT_REQUIRED',
  }),
  showPrivacyOptionsForm: async () => ({}),
};
export const MobileAds = () => ({ initialize: async () => [] });
export const NativeAd = {
  createForAdRequest: () => Promise.reject(new Error('no ads in tests')),
};
export const NativeAdView = ({ children }: { children?: unknown }) => children ?? null;
export const NativeAsset = ({ children }: { children?: unknown }) => children ?? null;
