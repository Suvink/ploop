import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import type { Flight } from '@/lib/types';
import type { Settings } from '@/lib/settings';
import {
  formatDate,
  formatDayMonth,
  formatDistance,
  formatDuration,
  formatNumber,
} from '@/lib/format';
import { flightDurationMin } from '@/lib/duration';
import { haversineKm, kmToUnit } from '@/lib/geo';
import { airlineName, countryName, getAirport } from '@/data/refdata';
import { WorldMap } from '@/components/WorldMap';
import { AirlineLogo } from '@/components/AirlineLogo';
import { CABIN_OPTIONS } from '@/lib/cabins';
import { fitFontSize } from './textFit';
import { code128Safe, code128Width, encodeCode128B } from '@/lib/code128';
import {
  Backdrop,
  Pill,
  SAFE_BOTTOM,
  SAFE_TOP,
  SIDE,
  STORY_W,
  SIcon,
  SText,
  StoryCanvas,
  Wordmark,
  type CanvasRef,
  type SIconName,
  type StoryOptions,
  type StoryTheme,
} from './common';

const CARD_W = STORY_W - SIDE * 2;
const PAD = 56;
const CARD_TOP = SAFE_TOP + 110;
const PLANE = 84;
const ROUTE_GAP = 16;
/** Text width in a detail cell (two per row; icon 40 + gap 18). */
const CELL_TEXT_W = (CARD_W - PAD * 2 - 40) / 2 - 40 - 18;
/** Width of each airport column beside the plane. */
const COL_W = (CARD_W - PAD * 2 - PLANE - ROUTE_GAP * 2) / 2;

function Cell({
  icon,
  label,
  value,
  theme,
}: {
  icon: SIconName;
  label: string;
  value: string;
  theme: StoryTheme;
}) {
  return (
    <View style={styles.cell}>
      <SIcon name={icon} size={40} color={theme.accent} />
      <View style={{ flex: 1 }}>
        <SText bold size={22} color={theme.muted} style={{ letterSpacing: 3 }}>
          {label.toUpperCase()}
        </SText>
        <SText display bold size={fitFontSize(value, CELL_TEXT_W, 44)} color={theme.text}>
          {value}
        </SText>
      </View>
    </View>
  );
}

/**
 * A real, scannable Code 128 barcode. It encodes only the route and distance (e.g.
 * "Flew 3,284 km, CMB to DXB"), never anything personal, and prints the same text below it.
 */
function FlightBarcode({ text, width, color }: { text: string; width: number; color: string }) {
  const bars = useMemo(() => {
    const widths = encodeCode128B(text);
    const modules = code128Width(widths);
    // Whole-pixel modules keep the bars crisp in the exported PNG.
    const unit = Math.max(1, Math.floor(width / modules));
    const out: { x: number; w: number }[] = [];
    let x = 10 * unit;
    widths.forEach((w, i) => {
      if (i % 2 === 0) out.push({ x, w: w * unit });
      x += w * unit;
    });
    return { out, total: modules * unit };
  }, [text, width]);
  return (
    <Svg width={bars.total} height={96} accessibilityLabel={text}>
      {bars.out.map((b) => (
        <Rect key={b.x} x={b.x} y={0} width={b.w} height={96} fill={color} />
      ))}
    </Svg>
  );
}

export function FlightStory({
  flight,
  settings,
  theme,
  options,
  ref,
}: { flight: Flight | null; settings: Settings; theme: StoryTheme; options: StoryOptions } & {
  ref?: CanvasRef;
}) {
  if (!flight) {
    return (
      <StoryCanvas ref={ref} theme={theme}>
        <View style={{ position: 'absolute', top: SAFE_TOP, left: SIDE }}>
          <SText display size={60} color={theme.muted}>
            Pick a flight
          </SText>
        </View>
      </StoryCanvas>
    );
  }
  const from = getAirport(flight.fromIata);
  const to = getAirport(flight.toIata);
  const km = from && to ? haversineKm(from, to) : null;
  const dur = flightDurationMin(flight, getAirport);
  const designator = [flight.airlineIata, flight.flightNumber].filter(Boolean).join(' ');
  const airline = airlineName(flight.airlineIata);
  const cabin = CABIN_OPTIONS.find((o) => o.value === flight.cabin)?.label;
  const date = flight.yearUnknown
    ? formatDayMonth(flight.date)
    : formatDate(flight.date, options.hideExactDates);

  const cells: { icon: SIconName; label: string; value: string }[] = [];
  cells.push({ icon: 'calendar', label: 'Date', value: date });
  if (designator) cells.push({ icon: 'hash', label: 'Flight', value: designator });
  if (km != null)
    cells.push({
      icon: 'map',
      label: 'Distance',
      value: formatDistance(km, settings.distanceUnit),
    });
  if (dur)
    cells.push({
      icon: 'clock',
      label: dur.estimated ? 'Duration (est.)' : 'Duration',
      value: formatDuration(dur.minutes),
    });
  if (flight.seat) cells.push({ icon: 'user', label: 'Seat', value: flight.seat });
  if (flight.aircraftType)
    cells.push({ icon: 'wind', label: 'Aircraft', value: flight.aircraftType });
  else if (flight.depLocal)
    cells.push({ icon: 'sunrise', label: 'Departs', value: flight.depLocal });

  const flown =
    km != null
      ? `${formatNumber(Math.round(kmToUnit(km, settings.distanceUnit)))} ${settings.distanceUnit}`
      : null;
  // Easter egg: flight number 404 can't be found, obviously.
  const is404 = (flight.flightNumber ?? '').replace(/^0+/, '') === '404';
  const barcodeText = is404
    ? 'Destination: lost'
    : flown
      ? `Flew ${flown}, ${flight.fromIata} to ${flight.toIata}`
      : `Flew ${flight.fromIata} to ${flight.toIata}`;
  const headline = is404 ? 'Flight not found' : (airline ?? 'My flight');
  const subline = is404
    ? `ERROR 404${designator ? `  ·  ${designator}` : ''}`
    : [designator, cabin].filter(Boolean).join('  ·  ').toUpperCase() || 'ON BOARD';
  // Both codes share one size, the largest at which the wider of the two fits its column.
  const codeSize = Math.min(
    fitFontSize(flight.fromIata, COL_W, 156),
    fitFontSize(flight.toIata, COL_W, 156),
  );
  const city = (a: typeof from) => (a ? `${a.city || a.name}` : '');
  return (
    <StoryCanvas ref={ref} theme={theme}>
      <Backdrop theme={theme} />
      <View style={styles.head}>
        <Wordmark theme={theme} />
        <Pill theme={theme} icon="navigation" inverted>
          BOARDING PASS
        </Pill>
      </View>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.cardHead}>
          <AirlineLogo iata={flight.airlineIata} size={104} />
          <View style={{ flex: 1 }}>
            <SText
              display
              bold
              size={fitFontSize(headline, CARD_W - PAD * 2 - 104 - 28, 40)}
              color={theme.text}
            >
              {headline}
            </SText>
            <SText bold size={26} color={theme.muted} style={{ letterSpacing: 3 }}>
              {subline}
            </SText>
          </View>
        </View>

        <View style={styles.route}>
          <View style={{ width: COL_W }}>
            <SText display bold size={codeSize} color={theme.text}>
              {flight.fromIata}
            </SText>
            <SText size={30} color={theme.muted} numberOfLines={2}>
              {city(from)}
              {from ? `, ${countryName(from.country)}` : ''}
            </SText>
          </View>
          <View style={[styles.plane, { backgroundColor: theme.accent }]}>
            <SIcon name="send" size={46} color={theme.onAccent} />
          </View>
          <View style={{ width: COL_W, alignItems: 'flex-end' }}>
            <SText display bold size={codeSize} color={theme.text} style={{ textAlign: 'right' }}>
              {flight.toIata}
            </SText>
            <SText size={30} color={theme.muted} numberOfLines={2} style={{ textAlign: 'right' }}>
              {city(to)}
              {to ? `, ${countryName(to.country)}` : ''}
            </SText>
          </View>
        </View>

        {from && to && (
          <WorldMap
            width={CARD_W}
            height={330}
            routes={[{ a: from, b: to }]}
            dots={[from, to]}
            visited={new Set([from.country, to.country])}
            fit="routes"
            strokeScale={3.4}
            colors={{
              land: theme.mapLand,
              visited: theme.mapVisited,
              arc: theme.accent,
              dot: theme.text,
            }}
          />
        )}

        <Svg width={CARD_W} height={60}>
          <Circle cx={0} cy={30} r={30} fill={theme.background} />
          <Circle cx={CARD_W} cy={30} r={30} fill={theme.background} />
          <Line
            x1={50}
            y1={30}
            x2={CARD_W - 50}
            y2={30}
            stroke={theme.muted}
            strokeWidth={3}
            strokeDasharray="14 14"
          />
        </Svg>

        <View style={styles.cells}>
          {cells.slice(0, 6).map((c, i) => (
            <Cell key={`${c.label}-${i}`} theme={theme} {...c} />
          ))}
        </View>

        <View style={styles.stripes}>
          <FlightBarcode
            text={code128Safe(barcodeText)}
            width={CARD_W - PAD * 2}
            color={theme.text}
          />
          <SText bold size={24} color={theme.muted} style={{ letterSpacing: 4, marginTop: 14 }}>
            {barcodeText.toUpperCase()}
          </SText>
        </View>
      </View>
    </StoryCanvas>
  );
}

const styles = StyleSheet.create({
  head: {
    position: 'absolute',
    top: SAFE_TOP,
    left: SIDE,
    right: SIDE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  card: {
    position: 'absolute',
    top: CARD_TOP,
    bottom: 1920 - SAFE_BOTTOM,
    left: SIDE,
    right: SIDE,
    borderRadius: 56,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
    paddingHorizontal: PAD,
    paddingTop: PAD,
  },
  route: { flexDirection: 'row', alignItems: 'center', gap: ROUTE_GAP, paddingHorizontal: PAD },
  plane: {
    width: PLANE,
    height: PLANE,
    borderRadius: PLANE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  cells: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: PAD,
    rowGap: 30,
    columnGap: 40,
  },
  cell: { width: (CARD_W - PAD * 2 - 40) / 2, flexDirection: 'row', alignItems: 'center', gap: 18 },
  stripes: { paddingHorizontal: PAD, paddingBottom: PAD, alignItems: 'center' },
});
