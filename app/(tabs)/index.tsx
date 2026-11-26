import { useCallback, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useFlights } from '@/hooks/useFlights';
import { useSettings } from '@/hooks/useSettings';
import { useStats, useToday } from '@/hooks/useStats';
import { airlineName, getAirport } from '@/data/refdata';
import {
  explainDays,
  explainEarth,
  explainLongest,
  explainMoon,
  explainNight,
  moonPercentLabel,
} from '@/lib/funFacts';
import {
  formatDate,
  formatDayMonth,
  formatDistance,
  formatMultiplier,
  formatNumber,
} from '@/lib/format';
import { kmToUnit } from '@/lib/geo';
import { appVersion } from '@/lib/version';
import type { Flight } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { Body, Display } from '@/components/Text';
import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Section } from '@/components/Section';
import { Tile, TileGrid } from '@/components/Tile';
import { showExplainer } from '@/components/Explainer';
import { FunIllustration } from '@/components/FunIllustration';
import { LoopTheLoop } from '@/components/LoopTheLoop';
import { useToast } from '@/components/Toast';
import { AirlineLogo } from '@/components/AirlineLogo';
import { Divider } from '@/components/Divider';
import { EmptyState } from '@/components/EmptyState';

const logo = require('../../assets/images/logo.png');

/** Red-eye mode: 2:00–3:59 at night. */
const isRedEye = (hour: number) => hour >= 2 && hour < 4;

function greeting(hour: number) {
  if (hour < 5) return 'Up Late';
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function relativeDays(date: string, today: string): string {
  const d = Math.round(DateTime.fromISO(date).diff(DateTime.fromISO(today), 'days').days);
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  if (d === -1) return 'yesterday';
  return d > 0 ? `in ${d} days` : `${-d} days ago`;
}

function HeroFlight({
  flight,
  upcoming,
  today,
}: {
  flight: Flight;
  upcoming: boolean;
  today: string;
}) {
  const { c } = useTheme();
  const from = getAirport(flight.fromIata);
  const to = getAirport(flight.toIata);
  const designator = [flight.airlineIata, flight.flightNumber].filter(Boolean).join(' ');
  const when = flight.yearUnknown ? formatDayMonth(flight.date) : formatDate(flight.date);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${upcoming ? 'Next flight' : 'Last flight'}: ${flight.fromIata} to ${flight.toIata}, ${when}`}
      onPress={() => router.push(`/flight/${flight.id}`)}
      style={({ pressed }) => [
        styles.hero,
        { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={styles.heroTop}>
        <Body variant="overline" color={upcoming ? c.accentText : c.textMuted}>
          {upcoming ? 'Next flight' : 'Last flight'}
          {flight.yearUnknown ? '' : ` · ${relativeDays(flight.date, today)}`}
        </Body>
        <AirlineLogo iata={flight.airlineIata} size={36} />
      </View>
      <View style={styles.heroRoute}>
        <View style={{ flex: 1 }}>
          <Display size="xl" bold>
            {flight.fromIata}
          </Display>
          <Body variant="caption" muted numberOfLines={1}>
            {from ? from.city || from.name : 'Unknown'}
          </Body>
        </View>
        <View style={[styles.planeDot, { backgroundColor: c.primary }]}>
          <Icon name="send" size={18} color={c.onPrimary} />
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Display size="xl" bold>
            {flight.toIata}
          </Display>
          <Body variant="caption" muted numberOfLines={1}>
            {to ? to.city || to.name : 'Unknown'}
          </Body>
        </View>
      </View>
      <Divider />
      <View style={styles.heroMeta}>
        <Body variant="label">{when}</Body>
        <Body variant="label" muted numberOfLines={1} style={{ flexShrink: 1 }}>
          {[designator, airlineName(flight.airlineIata)].filter(Boolean).join('  ·  ')}
        </Body>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { c } = useTheme();
  const { flights, loaded } = useFlights();
  const { settings, update } = useSettings();
  const toast = useToast();
  const { stats } = useStats(undefined);
  const today = useToday();
  const unit = settings.distanceUnit;
  const first = settings.passportName.trim().split(/\s+/)[0];
  const hour = DateTime.local().hour;
  const redEye = isRedEye(hour);

  // Easter egg: tap the logo 7 times (a nod to the 747) to loop the loop.
  const taps = useRef<number[]>([]);
  const [looping, setLooping] = useState(false);
  const onLogoTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 3000), now];
    if (taps.current.length >= 7 && !looping) {
      taps.current = [];
      setLooping(true);
    }
  };
  const loopDone = useCallback(() => {
    setLooping(false);
    if (!settings.loopFoundOn) {
      update('loopFoundOn', DateTime.local().toISODate()!).catch(() => {});
      toast('You found The Loop! A new stamp just landed in your passport.');
    } else {
      toast('Wheee! Still got it.');
    }
  }, [settings.loopFoundOn, update, toast]);

  const { next, last, noYear } = useMemo(() => {
    const dated = flights.filter((f) => !f.yearUnknown);
    const past = flights.filter((f) => f.date <= today);
    return {
      next: dated.find((f) => f.date > today),
      last: past[past.length - 1],
      noYear: flights.filter((f) => f.yearUnknown).length,
    };
  }, [flights, today]);

  const longest = useMemo(
    () => (stats.longest ? flights.find((f) => f.id === stats.longest) : undefined),
    [flights, stats.longest],
  );
  const longestRoute = longest ? `${longest.fromIata}–${longest.toIata}` : '';

  return (
    <Screen top tab>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Pressable onPress={onLogoTap} hitSlop={8} accessibilityLabel="Ploop">
            <Image source={logo} style={{ width: 34, height: 34 }} />
          </Pressable>
          <Display size="md" bold>
            Ploop
          </Display>
        </View>
        <IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />
      </View>

      <View style={{ marginTop: space.lg, gap: 4 }}>
        <Display size="lg" accessibilityRole="header">
          {redEye ? 'Can’t sleep? Same. ✈️' : `${greeting(hour)}${first ? `, ${first}` : ''}`}
        </Display>
        <Body muted>
          {stats.flightCount > 0
            ? `${formatNumber(stats.flightCount)} flights, ${formatNumber(stats.countries.length)} countries and counting.`
            : 'Your sky is wide open.'}
        </Body>
        {redEye && (
          <View style={{ marginTop: space.md }}>
            <FunIllustration kind="night" />
          </View>
        )}
      </View>
      <LoopTheLoop visible={looping} onDone={loopDone} />

      {loaded && flights.length === 0 ? (
        <EmptyState
          title="Scan your first boarding pass"
          body="Point your camera at the barcode, pick a screenshot, or type a flight in. Everything stays on this phone."
          action="Add a flight"
          onAction={() => router.push('/add')}
        />
      ) : (
        <>
          {(next || last) && (
            <View style={{ marginTop: space.xl }}>
              <HeroFlight flight={(next ?? last)!} upcoming={!!next} today={today} />
            </View>
          )}

          <View style={styles.actions}>
            <Button
              label="Scan pass"
              icon="maximize"
              variant="primary"
              onPress={() => router.push('/add/scan')}
              style={{ flex: 1 }}
            />
            <Button
              label="Add flight"
              icon="plus"
              onPress={() => router.push('/add')}
              style={{ flex: 1 }}
            />
          </View>

          {noYear > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.navigate('/flights')}
              style={[styles.nudge, { borderColor: c.warning }]}
            >
              <Icon name="calendar" size={18} color={c.warning} />
              <Body color={c.warning} style={{ flex: 1 }}>
                {noYear === 1 ? '1 flight needs' : `${noYear} flights need`} a year. The boarding
                pass didn’t say.
              </Body>
              <Icon name="chevron-right" size={18} color={c.warning} />
            </Pressable>
          )}

          <Section title="At a glance">
            <TileGrid>
              <Tile icon="send" value={formatNumber(stats.flightCount)} label="Flights" />
              <Tile
                icon="map"
                value={formatNumber(Math.round(kmToUnit(stats.distanceKm, unit)))}
                label={`${unit === 'km' ? 'Kilometres' : 'Miles'} flown`}
              />
              <Tile
                icon="clock"
                value={formatNumber(Math.round(stats.minutes / 60))}
                label={`Hours in the air${stats.minutesEstimated ? ' (est.)' : ''}`}
              />
              <Tile
                icon="flag"
                value={formatNumber(stats.countries.length)}
                label={`Countries · ${formatNumber(stats.airports.length)} airports`}
              />
            </TileGrid>
          </Section>

          {stats.airlines.length > 0 && (
            <Section title="Your airlines">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: space.md, paddingRight: space.xl }}
              >
                {stats.airlines.map((a, i) => (
                  <View
                    key={`${a.iata}-${i}`}
                    style={[styles.airline, { backgroundColor: c.surface, borderColor: c.border }]}
                  >
                    <AirlineLogo iata={a.iata} size={52} />
                    <Body variant="label" numberOfLines={2} style={{ textAlign: 'center' }}>
                      {airlineName(a.iata)}
                    </Body>
                    <Body variant="caption" muted>
                      {a.count} {a.count === 1 ? 'flight' : 'flights'}
                    </Body>
                  </View>
                ))}
              </ScrollView>
            </Section>
          )}

          <Section title="Fun facts">
            <TileGrid>
              <Tile
                icon="globe"
                accent
                info
                value={formatMultiplier(stats.funFacts.earthLaps)}
                label="Around the Earth"
                onPress={() =>
                  showExplainer(
                    explainEarth(stats, unit),
                    'globe',
                    <FunIllustration kind="earth" />,
                  )
                }
              />
              <Tile
                icon="moon"
                accent
                info
                value={moonPercentLabel(stats.funFacts.moonPct)}
                label="Of the way to the Moon"
                onPress={() =>
                  showExplainer(
                    explainMoon(stats, unit),
                    'moon',
                    <FunIllustration kind="moon" progress={stats.funFacts.moonPct / 100} />,
                  )
                }
              />
              <Tile
                icon="sunrise"
                accent
                info
                value={stats.funFacts.days.toFixed(1)}
                label={`Days spent flying${stats.minutesEstimated ? ' (est.)' : ''}`}
                onPress={() =>
                  showExplainer(explainDays(stats), 'sunrise', <FunIllustration kind="days" />)
                }
              />
              {longest && stats.longestKm != null ? (
                <Tile
                  icon="maximize-2"
                  accent
                  info
                  value={longestRoute}
                  label={`Longest hop · ${formatDistance(stats.longestKm, unit)}`}
                  onPress={() =>
                    showExplainer(
                      explainLongest(longestRoute, stats.longestKm!, unit),
                      'maximize-2',
                      <FunIllustration kind="longest" />,
                    )
                  }
                />
              ) : (
                <Tile
                  icon="star"
                  accent
                  info
                  value={formatNumber(stats.nightCount)}
                  label="Night departures"
                  onPress={() =>
                    showExplainer(explainNight(stats), 'star', <FunIllustration kind="night" />)
                  }
                />
              )}
            </TileGrid>
          </Section>
        </>
      )}
      <Body variant="caption" muted style={styles.version}>
        Ploop v{appVersion()}
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  version: { textAlign: 'center', marginTop: space.xl },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  hero: { borderRadius: radius.lg, borderWidth: 1, padding: space.xl, gap: space.lg },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroRoute: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  heroMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  planeDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    marginTop: space.lg,
  },
  airline: {
    width: 120,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.md,
    alignItems: 'center',
    gap: space.sm,
  },
});
