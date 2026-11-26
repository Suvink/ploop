import { useMemo } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFlights } from '@/hooks/useFlights';
import { useSettings } from '@/hooks/useSettings';
import { useToday } from '@/hooks/useStats';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import { FlightRow, flightDistanceKm } from '@/components/FlightRow';
import { Body, Display } from '@/components/Text';
import { IconButton } from '@/components/Button';
import { Divider } from '@/components/Divider';
import { EmptyState } from '@/components/EmptyState';
import { Fab } from '@/components/Fab';
import { showFlightActions } from '@/components/flightActions';
import { formatDistance } from '@/lib/format';
import type { Flight } from '@/lib/types';

interface FlightSection {
  key: string;
  title: string;
  subtitle: string;
  data: Flight[];
}

export default function FlightsScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { flights, loaded } = useFlights();
  const { settings } = useSettings();
  const today = useToday();

  const sections = useMemo<FlightSection[]>(() => {
    const noYear = flights.filter((f) => f.yearUnknown);
    const dated = flights.filter((f) => !f.yearUnknown);
    const upcoming = dated.filter((f) => f.date > today);
    const past = dated.filter((f) => f.date <= today).reverse();
    const out: FlightSection[] = [];
    if (noYear.length) {
      out.push({
        key: 'noyear',
        title: 'Needs a year',
        subtitle: 'The pass didn’t say. Tap to set it.',
        data: [...noYear].reverse(),
      });
    }
    if (upcoming.length) {
      out.push({
        key: 'upcoming',
        title: 'Upcoming',
        subtitle: `${upcoming.length} ${upcoming.length === 1 ? 'flight' : 'flights'}`,
        data: upcoming,
      });
    }
    const byYear = new Map<string, Flight[]>();
    for (const f of past) {
      const y = f.date.slice(0, 4);
      if (!byYear.has(y)) byYear.set(y, []);
      byYear.get(y)!.push(f);
    }
    for (const [year, list] of byYear) {
      const km = list.reduce((s, f) => s + (flightDistanceKm(f) ?? 0), 0);
      out.push({
        key: year,
        title: year,
        subtitle: `${list.length} ${list.length === 1 ? 'flight' : 'flights'} · ${formatDistance(km, settings.distanceUnit)}`,
        data: list,
      });
    }
    return out;
  }, [flights, today, settings.distanceUnit]);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <Display size="lg" accessibilityRole="header">
          Flights
        </Display>
        <IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(f) => f.id}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: insets.bottom + 120 }}
        ItemSeparatorComponent={Divider}
        renderSectionHeader={({ section }) => (
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: c.background, borderBottomColor: c.border },
            ]}
            accessibilityRole="header"
          >
            <Display
              size="xs"
              color={
                section.key === 'upcoming'
                  ? c.accentText
                  : section.key === 'noyear'
                    ? c.warning
                    : c.text
              }
            >
              {section.title}
            </Display>
            <Body variant="caption" muted>
              {section.subtitle}
            </Body>
          </View>
        )}
        renderItem={({ item }) => (
          <FlightRow
            flight={item}
            onPress={() => router.push(`/flight/${item.id}`)}
            onLongPress={() => showFlightActions(item)}
          />
        )}
        ListEmptyComponent={
          loaded ? (
            <EmptyState
              title="Scan your first boarding pass"
              body="Point your camera at the barcode, pick a screenshot, or type a flight in. Everything stays on this phone."
              action="Add a flight"
              onAction={() => router.push('/add')}
            />
          ) : undefined
        }
      />
      {flights.length > 0 && <Fab label="Add flight" onPress={() => router.push('/add')} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingBottom: space.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: space.xl,
    paddingBottom: space.sm,
    borderBottomWidth: 1,
  },
});
