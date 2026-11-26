import { StyleSheet, View } from 'react-native';
import type { Stats } from '@/lib/stats';
import type { Settings } from '@/lib/settings';
import { formatNumber, formatYearRange } from '@/lib/format';
import { kmToUnit } from '@/lib/geo';
import { Stamp } from '@/components/Stamp';
import { AirlineLogo } from '@/components/AirlineLogo';
import {
  Backdrop,
  IconBubble,
  Pill,
  SAFE_BOTTOM,
  SAFE_TOP,
  SIDE,
  SText,
  StoryCanvas,
  Wordmark,
  type CanvasRef,
  type SIconName,
  type StoryOptions,
  type StoryTheme,
} from './common';
import { fitFontSize, textWidthEm } from './textFit';

const CONTENT_W = 1080 - SIDE * 2;
/** Text area inside a stat card: half the grid, minus padding, icon and gap. */
const CARD_TEXT_W = (CONTENT_W - 24) / 2 - 30 * 2 - 88 - 24;

function StatCard({
  icon,
  value,
  unit,
  label,
  theme,
}: {
  icon: SIconName;
  value: string;
  unit?: string;
  label: string;
  theme: StoryTheme;
}) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <IconBubble theme={theme} name={icon} size={88} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <SText
            display
            bold
            size={fitFontSize(value, CARD_TEXT_W - (unit ? textWidthEm(unit) * 30 + 16 : 0), 78)}
            color={theme.text}
          >
            {value}
          </SText>
          {unit ? (
            <SText bold size={30} color={theme.muted}>
              {unit}
            </SText>
          ) : null}
        </View>
        <SText bold size={24} color={theme.muted} style={{ letterSpacing: 3 }}>
          {label.toUpperCase()}
        </SText>
      </View>
    </View>
  );
}

export function PassportStory({
  stats,
  settings,
  theme,
  options,
  ref,
}: { stats: Stats; settings: Settings; theme: StoryTheme; options: StoryOptions } & {
  ref?: CanvasRef;
}) {
  const name = settings.passportName.trim();
  const title = options.year ? String(options.year) : 'All time';
  const span = options.year
    ? 'My year in the air'
    : formatYearRange(stats.firstDate, stats.lastDate);
  const shown = stats.countries.slice(0, 4);
  const extra = stats.countries.length - shown.length;
  const airlines = stats.airlines.slice(0, 5);
  const hours = Math.round(stats.minutes / 60);

  return (
    <StoryCanvas ref={ref} theme={theme}>
      <Backdrop theme={theme} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Wordmark theme={theme} />
          <Pill theme={theme} icon="book-open" inverted>
            PASSPORT
          </Pill>
        </View>

        <View>
          <SText bold size={28} color={theme.accent} style={{ letterSpacing: 8 }}>
            {name ? 'PASSPORT HOLDER' : 'FLIGHT PASSPORT'}
          </SText>
          <SText
            display
            bold
            size={fitFontSize(name || 'Frequent flyer', CONTENT_W, 84)}
            color={theme.text}
          >
            {name || 'Frequent flyer'}
          </SText>
          <SText
            display
            bold
            size={fitFontSize(title, CONTENT_W, 200)}
            color={theme.text}
            style={{ marginTop: 8 }}
          >
            {title}
          </SText>
          <SText size={40} color={theme.muted}>
            {span}
          </SText>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <StatCard
              theme={theme}
              icon="send"
              value={formatNumber(stats.flightCount)}
              label="Flights"
            />
            <StatCard
              theme={theme}
              icon="flag"
              value={formatNumber(stats.countries.length)}
              label="Countries"
            />
          </View>
          <View style={styles.gridRow}>
            <StatCard
              theme={theme}
              icon="map"
              value={formatNumber(Math.round(kmToUnit(stats.distanceKm, settings.distanceUnit)))}
              unit={settings.distanceUnit}
              label="Distance"
            />
            <StatCard
              theme={theme}
              icon="clock"
              value={formatNumber(hours)}
              unit="h"
              label={stats.minutesEstimated ? 'In the air (est.)' : 'In the air'}
            />
          </View>
        </View>

        {airlines.length > 0 && (
          <View style={{ gap: 20 }}>
            <SText bold size={26} color={theme.muted} style={{ letterSpacing: 5 }}>
              FLEW WITH
            </SText>
            <View style={styles.airlines}>
              {airlines.map((a, i) => (
                <View key={`${a.iata}-${i}`} style={{ alignItems: 'center', gap: 10 }}>
                  <AirlineLogo iata={a.iata} size={112} round />
                  <SText bold size={28} color={theme.text}>
                    {a.count}×
                  </SText>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.stamps}>
          {shown.map((v, i) => (
            <View
              key={`${v.code}-${i}`}
              style={{ marginLeft: i === 0 ? 0 : -40, marginTop: i % 2 ? 40 : 0 }}
            >
              <Stamp
                code={v.code}
                firstDate={v.firstDate}
                size={214}
                hideExactDates={options.hideExactDates}
                color={i % 2 ? theme.text : theme.accent}
              />
            </View>
          ))}
          {extra > 0 && (
            <View style={[styles.more, { backgroundColor: theme.text }]}>
              <SText display bold size={52} color={theme.background}>
                +{extra}
              </SText>
            </View>
          )}
          {shown.length === 0 && (
            <SText size={34} color={theme.muted}>
              Stamps land here as you fly
            </SText>
          )}
        </View>
      </View>
    </StoryCanvas>
  );
}

const styles = StyleSheet.create({
  body: {
    position: 'absolute',
    top: SAFE_TOP,
    bottom: 1920 - SAFE_BOTTOM,
    left: SIDE,
    right: SIDE,
    justifyContent: 'space-between',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { gap: 24 },
  gridRow: { flexDirection: 'row', gap: 24 },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    borderRadius: 44,
    paddingHorizontal: 30,
    paddingVertical: 32,
  },
  airlines: { flexDirection: 'row', gap: 28 },
  stamps: { flexDirection: 'row', alignItems: 'center', minHeight: 250 },
  more: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
});
