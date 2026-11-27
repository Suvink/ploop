import { useSyncExternalStore } from 'react';
import { getPrivacyOptionsRequired, subscribe } from './adCache';

/** Whether Settings must offer "Ad privacy choices" (EEA, UK and other consent regions). */
export const useAdPrivacyRequired = () =>
  useSyncExternalStore(subscribe, getPrivacyOptionsRequired, () => false);
