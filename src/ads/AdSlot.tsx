import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { NativeAd } from 'react-native-google-mobile-ads';
import { useDisplayFont, useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, space } from '@/theme/tokens';
import { subscribe, takeAd } from './adCache';
import { sdk } from './sdk';

/**
 * One native ad, drawn as a Ploop card: same surface, border, corners, fonts and coral button
 * as the rest of the app. It always carries an "Ad" badge and Google's AdChoices icon (AdMob
 * requires both). With no ad ready (offline, no fill, no consent) it renders nothing.
 */
export function AdSlot({ style }: { style?: StyleProp<ViewStyle> }) {
  const [ad, setAd] = useState<NativeAd | null>(() => takeAd());

  // No ad yet: wait for the cache to get one (e.g. when the phone comes back online).
  useEffect(() => {
    if (ad) return;
    return subscribe(() => {
      const next = takeAd();
      if (next) setAd(next);
    });
  }, [ad]);

  useEffect(() => () => ad?.destroy(), [ad]);

  if (!ad || !sdk) return null;
  return <AdCard ad={ad} style={style} />;
}

function AdCard({ ad, style }: { ad: NativeAd; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const display = useDisplayFont();
  const by = ad.advertiser ?? ad.store;
  const { NativeAdView, NativeAsset, NativeAssetType } = sdk!;
  return (
    <NativeAdView
      nativeAd={ad}
      style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }, style]}
    >
      <View style={styles.top}>
        <View style={[styles.badge, { borderColor: c.accentText }]}>
          <Text style={[styles.badgeText, { color: c.accentText }]}>Ad</Text>
        </View>
        <Text style={[styles.overline, { color: c.textMuted }]} numberOfLines={1}>
          Sponsored{by ? ` · ${by}` : ''}
        </Text>
      </View>

      <View style={styles.row}>
        {ad.icon?.url ? (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <Image
              source={{ uri: ad.icon.url }}
              style={[styles.icon, { backgroundColor: c.iconBg }]}
            />
          </NativeAsset>
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text
              numberOfLines={2}
              style={[styles.headline, { color: c.text, fontFamily: display.bold }]}
            >
              {ad.headline}
            </Text>
          </NativeAsset>
          {ad.body ? (
            <NativeAsset assetType={NativeAssetType.BODY}>
              <Text numberOfLines={2} style={[styles.body, { color: c.textMuted }]}>
                {ad.body}
              </Text>
            </NativeAsset>
          ) : null}
        </View>
      </View>

      {ad.callToAction ? (
        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <Text style={[styles.cta, { backgroundColor: c.primary, color: c.onPrimary }]}>
            {ad.callToAction}
          </Text>
        </NativeAsset>
      ) : null}
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.lg,
    gap: space.md,
    overflow: 'hidden',
  },
  // Leave room on the right for the AdChoices icon the SDK draws in the corner.
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingRight: space.xl },
  badge: { borderWidth: 1, borderRadius: radius.sm / 2, paddingHorizontal: 5 },
  badgeText: { fontFamily: fonts.semibold, fontSize: 10, lineHeight: 15 },
  overline: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  icon: { width: 48, height: 48, borderRadius: radius.md },
  headline: { fontSize: 16, lineHeight: 21 },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  cta: {
    alignSelf: 'stretch',
    textAlign: 'center',
    overflow: 'hidden',
    borderRadius: radius.pill,
    paddingVertical: 11,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
});
