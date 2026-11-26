import { StyleSheet, View } from 'react-native';
import type { Stats } from '@/lib/stats';
import type { Settings } from '@/lib/settings';
import type { MapData } from '@/lib/mapData';
import { formatNumber, formatYearRange } from '@/lib/format';
import { kmToUnit } from '@/lib/geo';
import { WorldMap } from '@/components/WorldMap';
import { AirlineLogo } from '@/components/AirlineLogo';
import {
  Backdrop,
  IconBubble,
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
import { fitFontSize } from './textFit';

/** Text width inside one of the three stat cards. */
const FIG_TEXT_W = (1080 - SIDE * 2 - 24 * 2) / 3 - 28 * 2;

const MAP_TOP = 560;
const MAP_H = 640;

function Fig({
  icon,
  value,
  label,
  theme,
}: {
  icon: SIconName;
  value: string;
  label: string;
  theme: StoryTheme;
}) {
  return (
    <View style={[styles.fig, { backgroundColor: theme.card }]}>
      <IconBubble theme={theme} name={icon} size={72} />
      <SText display bold size={fitFontSize(value, FIG_TEXT_W, 72)} color={theme.text}>
        {value}
      </SText>
      <SText bold size={22} color={theme.muted} style={{ letterSpacing: 3 }}>
        {label.toUpperCase()}
      </SText>
    </View>
  );
}

export function MapStory({
  stats,
  map,
  settings,
  theme,
  options,
  ref,
}: { stats: Stats; map: MapData; settings: Settings; theme: StoryTheme; options: StoryOptions } & {
  ref?: CanvasRef;
}) {
  const when = options.year
    ? String(options.year)
    : formatYearRange(stats.firstDate, stats.lastDate);
  const routes = stats.routes.slice(0, 3);
  const airlines = stats.airlines.slice(0, 4);
  return (
    <StoryCanvas ref={ref} theme={theme}>
      <Backdrop theme={theme} />
      <View style={{ position: 'absolute', top: MAP_TOP, left: 0 }}>
        <WorldMap
          width={STORY_W}
          height={MAP_H}
          routes={map.routes}
          dots={map.airports}
          visited={map.visited}
          fit={map.routes.length ? 'routes' : 'world'}
          strokeScale={2.4}
          colors={{
            land: theme.mapLand,
            visited: theme.mapVisited,
            arc: theme.accent,
            dot: theme.text,
          }}
        />
      </View>

      <View style={styles.head}>
        <View style={styles.row}>
          <Wordmark theme={theme} />
          <Pill theme={theme} icon="calendar" inverted>
            {when.toUpperCase()}
          </Pill>
        </View>
        <SText display bold size={112} color={theme.text} style={{ marginTop: 36 }}>
          Where I flew
        </SText>
        <SText size={36} color={theme.muted}>
          {formatNumber(map.routes.length)} routes · {formatNumber(stats.airports.length)} airports
          · {formatNumber(stats.continents.length)}{' '}
          {stats.continents.length === 1 ? 'continent' : 'continents'}
        </SText>
      </View>

      <View style={styles.footer}>
        <View style={styles.figs}>
          <Fig theme={theme} icon="send" value={formatNumber(stats.flightCount)} label="Flights" />
          <Fig
            theme={theme}
            icon="map"
            value={formatNumber(Math.round(kmToUnit(stats.distanceKm, settings.distanceUnit)))}
            label={settings.distanceUnit === 'km' ? 'Kilometres' : 'Miles'}
          />
          <Fig
            theme={theme}
            icon="flag"
            value={formatNumber(stats.countries.length)}
            label="Countries"
          />
        </View>
        <View style={styles.bottomRow}>
          <View style={{ flex: 1, gap: 14 }}>
            {routes.map((r, i) => (
              <View key={`${r.a}-${r.b}-${i}`} style={styles.route}>
                <SIcon name="repeat" size={30} color={theme.accent} />
                <SText display bold size={40} color={theme.text}>
                  {r.a} – {r.b}
                </SText>
                <SText bold size={30} color={theme.muted}>
                  {r.count}×
                </SText>
              </View>
            ))}
          </View>
          {airlines.length > 0 && (
            <View style={styles.logos}>
              {airlines.map((a, i) => (
                <View key={`${a.iata}-${i}`} style={{ marginLeft: i === 0 ? 0 : -24 }}>
                  <AirlineLogo iata={a.iata} size={96} round />
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </StoryCanvas>
  );
}

const styles = StyleSheet.create({
  head: { position: 'absolute', top: SAFE_TOP, left: SIDE, right: SIDE },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footer: {
    position: 'absolute',
    bottom: 1920 - SAFE_BOTTOM,
    left: SIDE,
    right: SIDE,
    gap: 36,
  },
  figs: { flexDirection: 'row', gap: 24 },
  fig: { flex: 1, borderRadius: 40, padding: 28, gap: 10 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  route: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  logos: { flexDirection: 'row' },
});
