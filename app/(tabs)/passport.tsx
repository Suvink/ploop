import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useFlights } from '@/hooks/useFlights';
import { useSettings } from '@/hooks/useSettings';
import { useStats, useToday } from '@/hooks/useStats';
import { continentName, countryName, getAirport } from '@/data/refdata';
import { buildMapData } from '@/lib/mapData';
import { formatDate, formatDistance, formatNumber, formatPercent } from '@/lib/format';
import type { Flight } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import { Body, Display } from '@/components/Text';
import { ChipRow } from '@/components/Chip';
import { IconButton } from '@/components/Button';
import { Section } from '@/components/Section';
import { PassportBook } from '@/components/PassportBook';
import { WorldMap } from '@/components/WorldMap';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Tile, TileGrid } from '@/components/Tile';
import { showDialog } from '@/components/Dialog';
import { flagEmoji } from '@/components/DataPage';
import { Divider } from '@/components/Divider';
import type { CountryVisit } from '@/lib/stats';

function CountryList({ countries }: { countries: CountryVisit[] }) {
  return (
    <View>
      {[...countries]
        .sort((a, b) => countryName(a.code).localeCompare(countryName(b.code)))
        .map((v, i) => (
          <View key={`${v.code}-${i}`}>
            {i > 0 && <Divider />}
            <View style={styles.country}>
              <Body style={{ fontSize: 22, lineHeight: 28 }}>{flagEmoji(v.code)}</Body>
              <Body variant="strong" style={{ flex: 1 }} numberOfLines={1}>
                {countryName(v.code)}
              </Body>
              <Body variant="caption" muted>
                {formatDate(v.firstDate)}
              </Body>
            </View>
          </View>
        ))}
    </View>
  );
}

export default function PassportScreen() {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const [year, setYear] = useState<number | 'all'>('all');
  const { flights, loaded } = useFlights();
  const { settings } = useSettings();
  const today = useToday();
  const range = year === 'all' ? undefined : year;
  const { stats } = useStats(range);
  const { stats: allStats } = useStats(undefined);
  const map = useMemo(
    () => buildMapData(flights, getAirport, { year: range }, today),
    [flights, range, today],
  );
  const byId = useMemo(() => new Map(flights.map((f) => [f.id, f])), [flights]);

  const yearOptions = useMemo(
    () => [
      { value: 'all' as const, label: 'All time' },
      ...allStats.years.map((y) => ({ value: y, label: String(y) })),
    ],
    [allStats.years],
  );
  const mapWidth = width - space.xl * 2;
  const unit = settings.distanceUnit;
  const longest = stats.longest ? byId.get(stats.longest) : undefined;
  const shortest = stats.shortest ? byId.get(stats.shortest) : undefined;
  const openFlight = (f?: Flight) => (f ? () => router.push(`/flight/${f.id}`) : undefined);
  const route = (f?: Flight) => (f ? `${f.fromIata}–${f.toIata}` : '—');

  return (
    <Screen top tab>
      <View style={styles.header}>
        <Display size="lg" accessibilityRole="header">
          Passport
        </Display>
        <IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />
      </View>

      {loaded && allStats.flightCount === 0 ? (
        <EmptyState
          title="Your passport is empty"
          body="Add flights you’ve taken and they’ll turn into stats, stamps and a map here."
          action="Add a flight"
          onAction={() => router.push('/add')}
        />
      ) : (
        <>
          <View style={{ marginTop: space.md, marginBottom: space.xl }}>
            <ChipRow options={yearOptions} value={year} onChange={setYear} />
          </View>

          <PassportBook
            stats={stats}
            settings={settings}
            map={map}
            year={range}
            yearLabel={year === 'all' ? 'All time' : String(year)}
            gutter={space.xl}
          />
          <Body variant="caption" muted style={{ textAlign: 'center', marginTop: space.sm }}>
            Swipe back for the cover, forward for your stamps
            {stats.upcomingCount > 0
              ? ` · ${stats.upcomingCount} upcoming ${stats.upcomingCount === 1 ? 'flight' : 'flights'} not counted yet`
              : ''}
          </Body>

          <Section title="Map">
            <WorldMap
              width={mapWidth}
              routes={map.routes}
              dots={map.airports}
              visited={map.visited}
              animate
              colors={{ land: c.mapLand, visited: c.textMuted, arc: c.mapArc, dot: c.mapDot }}
            />
            <Body variant="caption" muted style={{ marginTop: space.sm }}>
              {formatNumber(map.routes.length)} routes · {formatNumber(stats.airports.length)}{' '}
              airports · {stats.continents.map(continentName).join(', ') || 'no continents yet'}
            </Body>
          </Section>

          <Section title="Records">
            <TileGrid>
              <Tile
                icon="maximize-2"
                value={route(longest)}
                label="Longest flight"
                detail={stats.longestKm != null ? formatDistance(stats.longestKm, unit) : undefined}
                onPress={openFlight(longest)}
              />
              <Tile
                icon="minimize-2"
                value={route(shortest)}
                label="Shortest flight"
                detail={
                  stats.shortestKm != null ? formatDistance(stats.shortestKm, unit) : undefined
                }
                onPress={openFlight(shortest)}
              />
              <Tile
                icon="sun"
                value={stats.windowShare != null ? formatPercent(stats.windowShare) : '—'}
                label="Window seats (approx.)"
              />
              <Tile
                icon="moon"
                value={formatNumber(stats.nightCount)}
                label={`Night departures${stats.nightShare != null ? ` · ${formatPercent(stats.nightShare)}` : ''}`}
              />
              {stats.aircraft[0] && (
                <Tile
                  icon="wind"
                  value={stats.aircraft[0].type}
                  label={`Top aircraft · ${stats.aircraft[0].count}×`}
                />
              )}
              <Tile
                icon="flag"
                info
                value={formatNumber(stats.countries.length)}
                label="Countries visited"
                detail={stats.countries
                  .slice(0, 6)
                  .map((v) => flagEmoji(v.code))
                  .join(' ')}
                onPress={() =>
                  showDialog({
                    icon: 'flag',
                    title: `${stats.countries.length} ${stats.countries.length === 1 ? 'country' : 'countries'} visited`,
                    message:
                      'Every country you’ve landed in or taken off from, with the date of your first visit.',
                    body: <CountryList countries={stats.countries} />,
                  })
                }
              />
              <Tile
                icon="globe"
                info
                value={formatNumber(stats.continents.length)}
                label={stats.continents.length === 1 ? 'Continent explored' : 'Continents explored'}
                detail={
                  stats.continents.length
                    ? `of 7 · ${Math.round((stats.continents.length / 7) * 100)}%`
                    : undefined
                }
                onPress={() =>
                  showDialog({
                    icon: 'globe',
                    title: `${stats.continents.length} of 7 continents`,
                    message: stats.continents.length
                      ? `You’ve touched down in ${stats.continents.map(continentName).join(', ')}.`
                      : 'No continents yet. The world is waiting.',
                    body:
                      stats.continents.length < 7 ? (
                        <Body muted>
                          Still to go:{' '}
                          {['AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA']
                            .filter((k) => !stats.continents.includes(k))
                            .map(continentName)
                            .join(', ')}
                          . Antarctica counts, but good luck finding a gate.
                        </Body>
                      ) : undefined,
                  })
                }
              />
            </TileGrid>
          </Section>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  country: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
});
