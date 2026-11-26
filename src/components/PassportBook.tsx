import { useRef, useState, useMemo, type ComponentRef } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import type { Settings } from '@/lib/settings';
import type { Stats } from '@/lib/stats';
import { passportColors as P } from '@/theme/colors';
import { useDisplayFont } from '@/theme/ThemeProvider';
import { fonts, radius, space } from '@/theme/tokens';
import { CloudNineStamp, Stamp, seeded } from './Stamp';
import { Guilloche } from './Guilloche';
import { DataPage } from './DataPage';
import type { MapData } from '@/lib/mapData';
import { captureView, saveToGallery, shareImage } from '@/stories/exportStory';
import { Button } from './Button';
import { useToast } from './Toast';
import { showDialog } from './Dialog';

type PageView = ComponentRef<typeof View>;

function pageName(p: PageItem): string {
  if (p.key === 'cover') return 'cover';
  if (p.key === 'bio') return 'passport page';
  return 'page' in p ? `visa page ${p.page}` : 'page';
}

const grain = require('../../assets/images/grain.png');
const STAMPS_PER_PAGE = 6;
const RATIO = 1.5;

/** Foil globe with an orbiting plane, for the cover. */
export function Emblem({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={62} stroke={color} strokeWidth={3} fill="none" />
      <Ellipse cx={100} cy={100} rx={26} ry={62} stroke={color} strokeWidth={2} fill="none" />
      <Ellipse cx={100} cy={100} rx={48} ry={62} stroke={color} strokeWidth={1.5} fill="none" />
      <Line x1={100} y1={38} x2={100} y2={162} stroke={color} strokeWidth={2} />
      <Line x1={38} y1={100} x2={162} y2={100} stroke={color} strokeWidth={2} />
      <Path
        d="M48 70 Q100 82 152 70 M48 130 Q100 118 152 130"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
      <Ellipse
        cx={100}
        cy={100}
        rx={92}
        ry={30}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="6 6"
        fill="none"
        transform="rotate(-18 100 100)"
      />
      <G transform="translate(176 66) rotate(-30)">
        <Path
          d="M-14 0 L14 0 M3 0 L-5 -11 M3 0 L-5 11 M-11 0 L-15 -5 M-11 0 L-15 5"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
      </G>
      {[
        [30, 30],
        [168, 160],
        [40, 170],
      ].map(([x, y]) => (
        <Path
          key={`${x}-${y}`}
          d={`M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y} L${x + 2} ${y + 2} L${x} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y - 2} Z`}
          fill={color}
        />
      ))}
    </Svg>
  );
}

function ChipIcon({ color }: { color: string }) {
  return (
    <Svg width={44} height={28} viewBox="0 0 44 28">
      <Rect x={1} y={1} width={42} height={26} rx={5} stroke={color} strokeWidth={2} fill="none" />
      <Circle cx={22} cy={14} r={7} stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

function Cover({ w, h, year }: { w: number; h: number; year: string }) {
  const d = useDisplayFont();
  const foil = { color: P.foil, textAlign: 'center' as const };
  return (
    <View style={[styles.page, { width: w, height: h, backgroundColor: P.cover }]}>
      <Image
        source={grain}
        resizeMode="repeat"
        style={[StyleSheet.absoluteFill, { opacity: 0.25 }]}
      />
      <View style={[styles.spine, { backgroundColor: P.coverDeep }]} />
      <View style={[styles.coverInner, { borderColor: P.foilDim }]}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text
            allowFontScaling={false}
            style={[foil, { fontFamily: d.bold, fontSize: 22, letterSpacing: 8 }]}
          >
            PLOOP
          </Text>
          <Text
            allowFontScaling={false}
            style={[foil, { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 3 }]}
          >
            REPUBLIC OF THE SKIES
          </Text>
        </View>
        <Emblem size={w * 0.5} color={P.foil} />
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text
            allowFontScaling={false}
            style={[foil, { fontFamily: d.bold, fontSize: 30, letterSpacing: 10 }]}
          >
            PASSPORT
          </Text>
          <Text
            allowFontScaling={false}
            style={[foil, { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 3 }]}
          >
            PASSEPORT · PASAPORTE · {year.toUpperCase()}
          </Text>
        </View>
        <ChipIcon color={P.foil} />
      </View>
    </View>
  );
}

function VisaPage({
  w,
  h,
  stamps,
  page,
  cloudNine,
}: {
  w: number;
  h: number;
  stamps: Stats['countries'];
  page: number;
  /** Date The Loop was found; shows the Cloud Nine stamp on this page. */
  cloudNine?: string | null;
}) {
  const cellW = (w - 24) / 2;
  const cellH = (h - 70) / 3;
  const size = Math.min(cellW, cellH) * 0.86;
  return (
    <View style={[styles.page, { width: w, height: h, backgroundColor: P.page }]}>
      <Guilloche width={w} height={h} lines={14} colors={[P.guilloche2]} />
      <View style={styles.visaHead}>
        <Text allowFontScaling={false} style={styles.fieldLabel}>
          Visas · Entries
        </Text>
        <Text allowFontScaling={false} style={styles.fieldLabel}>
          {page}
        </Text>
      </View>
      {stamps.length === 0 && !cloudNine ? (
        <View style={styles.visaEmpty}>
          <Text allowFontScaling={false} style={[styles.fieldLabel, { textAlign: 'center' }]}>
            Stamps land here as you fly
          </Text>
        </View>
      ) : (
        <View style={styles.visaGrid}>
          {stamps.map((s, i) => {
            const dx = (seeded(s.code, 3) - 0.5) * cellW * 0.16;
            const dy = (seeded(s.code, 4) - 0.5) * cellH * 0.16;
            return (
              <View
                key={`${s.code}-${i}`}
                style={{
                  width: cellW,
                  height: cellH,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ translateX: dx }, { translateY: dy }],
                }}
              >
                <Stamp code={s.code} firstDate={s.firstDate} size={size} />
              </View>
            );
          })}
          {cloudNine && stamps.length < STAMPS_PER_PAGE && (
            <View
              style={{
                width: cellW,
                height: cellH,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CloudNineStamp date={cloudNine} size={size * 1.05} />
            </View>
          )}
        </View>
      )}
      {cloudNine && stamps.length >= STAMPS_PER_PAGE && (
        // Page is full: stamp it over the corner, like a hurried officer would.
        <View style={styles.cloudCorner} pointerEvents="none">
          <CloudNineStamp date={cloudNine} size={size * 0.9} rotate={-12} />
        </View>
      )}
    </View>
  );
}

function PageFrame({
  index,
  x,
  pageW,
  children,
}: {
  index: number;
  x: SharedValue<number>;
  pageW: number;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const input = [(index - 1) * pageW, index * pageW, (index + 1) * pageW];
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${interpolate(x.value, input, [28, 0, -28], 'clamp')}deg` },
        { scale: interpolate(x.value, input, [0.9, 1, 0.9], 'clamp') },
      ],
      opacity: interpolate(x.value, input, [0.5, 1, 0.5], 'clamp'),
    };
  });
  return (
    <Animated.View style={[{ width: pageW, alignItems: 'center' }, style]}>
      {children}
    </Animated.View>
  );
}

type PageItem =
  { key: 'cover' } | { key: 'bio' } | { key: string; stamps: Stats['countries']; page: number };

/** A swipeable passport: cover, data page, then visa pages full of stamps. */
export function PassportBook({
  stats,
  settings,
  map,
  yearLabel,
  year,
  gutter,
}: {
  stats: Stats;
  settings: Settings;
  map: MapData;
  yearLabel: string;
  year?: number;
  /** Horizontal screen padding the book should bleed into. */
  gutter: number;
}) {
  const { width } = useWindowDimensions();
  const display = useDisplayFont();
  const pageW = width;
  const w = width - gutter * 2;
  const h = Math.round(w * RATIO);
  const x = useSharedValue(pageW); // starts on the data page (index 1)
  // Open on the data page; swipe back for the cover, forward for the visa pages.
  const [index, setIndex] = useState(1);
  const onScroll = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
  });
  const toast = useToast();
  const views = useRef(new Map<number, PageView>());
  const [busy, setBusy] = useState<'save' | 'share' | 'all' | null>(null);

  const pages = useMemo<PageItem[]>(() => {
    const out: PageItem[] = [{ key: 'cover' }, { key: 'bio' }];
    const n = Math.max(1, Math.ceil(stats.countries.length / STAMPS_PER_PAGE));
    for (let i = 0; i < n; i++) {
      out.push({
        key: `visa-${i}`,
        stamps: stats.countries.slice(i * STAMPS_PER_PAGE, (i + 1) * STAMPS_PER_PAGE),
        page: i + 1,
      });
    }
    return out;
  }, [stats.countries]);

  const current = pages[Math.min(index, pages.length - 1)];

  const run = async (kind: 'save' | 'share' | 'all') => {
    setBusy(kind);
    try {
      if (kind === 'all') {
        let saved = 0;
        for (let i = 0; i < pages.length; i++) {
          const uri = await captureView(views.current.get(i) ?? null);
          if ((await saveToGallery(uri)) === 'denied') {
            toast('Allow photo access to save your passport');
            return;
          }
          saved++;
        }
        toast(`Saved ${saved} pages to Photos`);
        return;
      }
      const uri = await captureView(views.current.get(index) ?? null);
      if (kind === 'save') {
        const r = await saveToGallery(uri);
        toast(r === 'saved' ? `Saved your ${pageName(current)}` : 'Allow photo access to save it');
      } else {
        await shareImage(uri, 'Share your passport');
      }
    } catch (e) {
      showDialog({
        icon: 'alert-triangle',
        title: 'Couldn’t export',
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ marginHorizontal: -gutter }}>
      <Animated.FlatList
        // Remount on a font change (Ploop mode) so Android remeasures every label.
        key={display.bold}
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => p.key}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / pageW))}
        getItemLayout={(_, i) => ({ length: pageW, offset: pageW * i, index: i })}
        initialScrollIndex={1}
        // Keep every page mounted so "Save all" can capture pages that are off screen.
        initialNumToRender={pages.length}
        windowSize={pages.length * 2 + 1}
        removeClippedSubviews={false}
        renderItem={({ item, index: i }) => (
          <PageFrame index={i} x={x} pageW={pageW}>
            <View
              collapsable={false}
              ref={(v) => {
                if (v) views.current.set(i, v);
                else views.current.delete(i);
              }}
            >
              {item.key === 'cover' ? (
                <Cover w={w} h={h} year={yearLabel} />
              ) : item.key === 'bio' ? (
                <DataPage
                  w={w}
                  h={h}
                  stats={stats}
                  settings={settings}
                  map={map}
                  yearLabel={yearLabel}
                  year={year}
                />
              ) : (
                'stamps' in item && (
                  <VisaPage
                    w={w}
                    h={h}
                    stamps={item.stamps}
                    page={item.page}
                    cloudNine={i === pages.length - 1 ? settings.loopFoundOn : null}
                  />
                )
              )}
            </View>
          </PageFrame>
        )}
      />
      <View style={styles.dots} accessibilityLabel={`Page ${index + 1} of ${pages.length}`}>
        {pages.map((p, i) => (
          <View
            key={p.key}
            style={[
              styles.dot,
              { backgroundColor: i === index ? P.foil : P.foilDim, width: i === index ? 18 : 6 },
            ]}
          />
        ))}
      </View>
      <View style={[styles.actions, { paddingHorizontal: gutter }]}>
        <Button
          label="Save"
          icon="download"
          onPress={() => run('save')}
          loading={busy === 'save'}
          disabled={!!busy}
          accessibilityHint={`Saves the ${pageName(current)} to your photos`}
          style={{ flex: 1 }}
        />
        <Button
          label="Share"
          icon="share-2"
          variant="primary"
          onPress={() => run('share')}
          loading={busy === 'share'}
          disabled={!!busy}
          style={{ flex: 1 }}
        />
      </View>
      <Button
        label={`Save all ${pages.length} pages`}
        icon="layers"
        variant="ghost"
        onPress={() => run('all')}
        loading={busy === 'all'}
        disabled={!!busy}
        style={{ marginHorizontal: gutter, marginTop: space.xs }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 14 },
  coverInner: {
    flex: 1,
    margin: 18,
    marginLeft: 26,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: space.xl,
  },
  bioBody: { flex: 1, padding: space.lg, gap: space.md },
  bioHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headText: { fontSize: 16, letterSpacing: 5, color: P.ink },
  bioRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  bioMain: { flexDirection: 'row', gap: space.md },
  photo: {
    width: '34%',
    aspectRatio: 0.78,
    borderWidth: 1,
    borderRadius: radius.sm,
    backgroundColor: P.cover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: P.inkMuted,
  },
  statStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: space.sm,
  },
  mrz: { borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  visaHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  visaGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  cloudCorner: { position: 'absolute', right: 6, bottom: 10 },
  visaEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: space.lg,
  },
  dot: { height: 6, borderRadius: 3 },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
});
