import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { DateTime } from 'luxon';
import { getAirport } from '@/data/refdata';
import { formatDate, formatNumber } from '@/lib/format';
import { kmToUnit } from '@/lib/geo';
import type { MapData } from '@/lib/mapData';
import type { Settings } from '@/lib/settings';
import type { Stats } from '@/lib/stats';
import { passportColors as P } from '@/theme/colors';
import { useDisplayFont } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Guilloche } from './Guilloche';
import { WorldMap } from './WorldMap';
import { PlaneIcon } from './PlaneIcon';

const logo = require('../../assets/images/logo.png');

/** 🇱🇰 from "LK". */
export function flagEmoji(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return '🏳️';
  return String.fromCodePoint(...[...code].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

function mrzText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '<');
}

const pad44 = (s: string) => (s + '<'.repeat(44)).slice(0, 44);

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text allowFontScaling={false} style={styles.label}>
        {label}
      </Text>
      <Text allowFontScaling={false} numberOfLines={1} style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

/** Round official seal holding the flight count, inked in coral and slightly askew. */
function Seal({ count, size }: { count: number; size: number }) {
  const d = useDisplayFont();
  const c = size / 2;
  return (
    <View style={{ width: size, height: size, transform: [{ rotate: '-9deg' }] }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={c - 2} stroke={P.seal} strokeWidth={3} fill="none" />
        <Circle
          cx={c}
          cy={c}
          r={c - 9}
          stroke={P.seal}
          strokeWidth={1.2}
          strokeDasharray="3 3"
          fill="none"
        />
      </Svg>
      <View style={styles.sealInner}>
        <Text allowFontScaling={false} style={styles.sealSmall}>
          ★ PLOOP ★
        </Text>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            fontFamily: d.bold,
            fontSize: size * 0.3,
            lineHeight: size * 0.36,
            color: P.seal,
          }}
        >
          {formatNumber(count)}
        </Text>
        <Text allowFontScaling={false} style={styles.sealSmall}>
          {count === 1 ? 'FLIGHT' : 'FLIGHTS'}
        </Text>
      </View>
    </View>
  );
}

function Cell({ icon, label, value }: { icon: IconName | 'plane'; label: string; value: string }) {
  const d = useDisplayFont();
  return (
    <View style={styles.cell}>
      {icon === 'plane' ? (
        <PlaneIcon size={14} color={P.seal} rotate={45} />
      ) : (
        <Icon name={icon} size={14} color={P.seal} />
      )}
      <Text allowFontScaling={false} style={styles.label}>
        {label}
      </Text>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ fontFamily: d.bold, fontSize: 16, color: P.dataInk }}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * The passport data page: warm security paper, a night-sky window with your routes over a
 * dotted world and the flags of visited countries, holder details, an official seal with your
 * flight count, key figures and a machine-readable zone.
 */
export function DataPage({
  w,
  h,
  stats,
  settings,
  map,
  yearLabel,
  year,
}: {
  w: number;
  h: number;
  stats: Stats;
  settings: Settings;
  map: MapData;
  yearLabel: string;
  year?: number;
}) {
  const d = useDisplayFont();
  const name = settings.passportName.trim();
  const home = settings.homeAirport ? getAirport(settings.homeAirport) : undefined;
  const unit = settings.distanceUnit;
  const today = DateTime.local().toISODate()!;
  const winW = w - 28;
  const winH = Math.round(h * 0.3);
  const flags = stats.countries.slice(0, 10);
  const moreFlags = stats.countries.length - flags.length;
  const mrzSize = Math.min(12.5, (w - 28) / 44 / 0.61);
  const line1 = pad44(`P<PLP${mrzText(name) || 'FREQUENT<FLYER'}`);
  const core = `${String(stats.flightCount).padStart(4, '0')}FLT<${Math.round(stats.distanceKm)}KM<${stats.countries.length}CTY<${year ?? 'ALL'}`;
  // Found The Loop? A secret tag rides along at the end of the code line.
  const line2 = settings.loopFoundOn
    ? (core + '<'.repeat(44)).slice(0, 44 - 14) + '<<LOOPDELOOP<<'
    : pad44(core);

  return (
    <View style={[styles.page, { width: w, height: h }]}>
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="paper" x1="0" y1="0" x2="0.3" y2="1">
            <Stop offset="0" stopColor={P.dataA} />
            <Stop offset="0.55" stopColor={P.dataB} />
            <Stop offset="1" stopColor={P.dataC} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={h} fill="url(#paper)" />
      </Svg>
      <Guilloche width={w} height={h} lines={18} />

      <View style={styles.head}>
        <Image source={logo} style={{ width: 24, height: 24 }} />
        <Text allowFontScaling={false} style={[styles.brand, { fontFamily: d.bold }]}>
          PLOOP
        </Text>
        <View style={{ flex: 1 }} />
        <Text allowFontScaling={false} style={styles.label}>
          P · PLP · {yearLabel.toUpperCase()}
        </Text>
      </View>

      <View style={[styles.window, { width: winW, height: winH }]}>
        <WorldMap
          width={winW}
          height={winH}
          routes={map.routes}
          dots={map.airports}
          visited={map.visited}
          dotted
          strokeScale={1.2}
          colors={{
            land: P.windowLand,
            visited: P.windowVisited,
            arc: P.windowArc,
            dot: P.windowVisited,
          }}
        />
        <Text allowFontScaling={false} style={styles.windowTag}>
          {formatNumber(map.routes.length)} {map.routes.length === 1 ? 'ROUTE' : 'ROUTES'}
        </Text>
        <View style={styles.flags}>
          {flags.map((c, i) => (
            <Text key={`${c.code}-${i}`} allowFontScaling={false} style={styles.flag}>
              {flagEmoji(c.code)}
            </Text>
          ))}
          {moreFlags > 0 && (
            <Text allowFontScaling={false} style={styles.more}>
              +{moreFlags}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.body}>
        <View style={{ flex: 1, gap: 7 }}>
          <Field label="Holder / Titulaire" value={name || 'Frequent flyer'} />
          <Field
            label="Home airport"
            value={home ? `${home.iata} · ${home.city || home.name}` : 'Not set'}
          />
          <Field label="Member since" value={formatDate(settings.memberSince ?? today)} />
          <Field label="Issued" value={formatDate(today)} />
        </View>
        <Seal count={stats.flightCount} size={Math.round(Math.min(112, w * 0.32))} />
      </View>

      <View style={styles.cells}>
        <Cell
          icon="map"
          label={unit === 'km' ? 'Km' : 'Miles'}
          value={formatNumber(Math.round(kmToUnit(stats.distanceKm, unit)))}
        />
        <Cell icon="clock" label="Hours" value={formatNumber(Math.round(stats.minutes / 60))} />
        <Cell icon="map-pin" label="Airports" value={formatNumber(stats.airports.length)} />
        <Cell icon="plane" label="Airlines" value={formatNumber(stats.airlineCount)} />
      </View>

      <View style={styles.mrz}>
        {[line1, line2].map((l, i) => (
          <Text
            key={i}
            allowFontScaling={false}
            numberOfLines={1}
            style={{
              fontFamily: 'monospace',
              fontSize: mrzSize,
              color: P.dataInk,
              letterSpacing: 0.3,
            }}
          >
            {l}
          </Text>
        ))}
      </View>
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
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  brand: { fontSize: 15, letterSpacing: 5, color: P.dataInk },
  label: {
    fontFamily: fonts.medium,
    fontSize: 8.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: P.dataMuted,
  },
  value: { fontFamily: fonts.semibold, fontSize: 13, color: P.dataInk },
  window: {
    alignSelf: 'center',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: P.windowBg,
  },
  windowTag: {
    position: 'absolute',
    top: 8,
    left: 10,
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: P.windowArc,
    opacity: 0.8,
  },
  flags: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  flag: { fontSize: 15, lineHeight: 19 },
  more: { fontFamily: fonts.semibold, fontSize: 10, color: P.windowArc, marginLeft: 4 },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  sealInner: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  sealSmall: { fontFamily: fonts.semibold, fontSize: 8, letterSpacing: 1.5, color: P.seal },
  cells: {
    flexDirection: 'row',
    marginHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: P.dataMuted,
  },
  cell: { flex: 1, alignItems: 'center', gap: 1 },
  mrz: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
});
