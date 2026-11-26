import { Pressable, StyleSheet, View } from 'react-native';
import { getAirport } from '@/data/refdata';
import { haversineKm } from '@/lib/geo';
import { formatDayMonth, formatDistance, formatShortDate } from '@/lib/format';
import type { Flight } from '@/lib/types';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import { Body, Display } from './Text';
import { Icon } from './Icon';
import { AirlineLogo } from './AirlineLogo';

export function flightDistanceKm(f: Pick<Flight, 'fromIata' | 'toIata'>): number | null {
  const a = getAirport(f.fromIata);
  const b = getAirport(f.toIata);
  return a && b ? haversineKm(a, b) : null;
}

export function FlightRow({
  flight,
  onPress,
  onLongPress,
}: {
  flight: Flight;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const { c } = useTheme();
  const { settings } = useSettings();
  const from = getAirport(flight.fromIata);
  const to = getAirport(flight.toIata);
  const km = flightDistanceKm(flight);
  const designator = [flight.airlineIata, flight.flightNumber].filter(Boolean).join(' ');
  const dateLabel = flight.yearUnknown ? formatDayMonth(flight.date) : formatShortDate(flight.date);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${dateLabel}${flight.yearUnknown ? ', year not set' : ''}, ${from?.city ?? flight.fromIata} to ${to?.city ?? flight.toIata}${designator ? `, ${designator}` : ''}`}
      accessibilityHint="Opens the flight. Long press for more actions."
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
    >
      <AirlineLogo iata={flight.airlineIata} size={40} />
      <View style={styles.main}>
        <View style={styles.top}>
          <Body variant="caption" muted>
            {dateLabel}
            {flight.yearUnknown ? (
              <Body variant="caption" color={c.warning}>
                {'  ·  add year'}
              </Body>
            ) : null}
          </Body>
          <Body variant="caption" muted>
            {[designator, km != null ? formatDistance(km, settings.distanceUnit) : null]
              .filter(Boolean)
              .join('  ·  ')}
          </Body>
        </View>
        <View style={styles.route}>
          <Display size="md" style={styles.code}>
            {flight.fromIata}
          </Display>
          <Icon name="arrow-right" size={18} color={c.textMuted} />
          <Display size="md" style={styles.code}>
            {flight.toIata}
          </Display>
        </View>
        <Body variant="caption" muted numberOfLines={1}>
          {(from?.city || 'Unknown') + '  →  ' + (to?.city || 'Unknown')}
        </Body>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: space.lg, flexDirection: 'row', gap: space.md, alignItems: 'center' },
  main: { flex: 1, gap: 4 },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  route: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  code: { fontVariant: ['tabular-nums'], letterSpacing: 1 },
});
