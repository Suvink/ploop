import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useFlight } from '@/hooks/useFlights';
import { useSettings } from '@/hooks/useSettings';
import { updateFlight } from '@/db/repo';
import { airlineName, countryName, getAirport } from '@/data/refdata';
import { flightDurationMin } from '@/lib/duration';
import { formatDate, formatDayMonth, formatDistance, formatDuration } from '@/lib/format';
import { AirlineLogo } from '@/components/AirlineLogo';
import { formFromFlight } from '@/lib/flightForm';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { Body, Display } from '@/components/Text';
import { Button, IconButton } from '@/components/Button';
import { Divider } from '@/components/Divider';
import { EstBadge } from '@/components/EstBadge';
import { EmptyState } from '@/components/EmptyState';
import { CABIN_OPTIONS, FlightForm } from '@/components/FlightForm';
import { WorldMap } from '@/components/WorldMap';
import { flightDistanceKm } from '@/components/FlightRow';
import { confirmDelete } from '@/components/flightActions';
import { useToast } from '@/components/Toast';
import { AdSlot } from '@/ads/AdSlot';

function Fact({ label, value, est }: { label: string; value: string | null; est?: boolean }) {
  if (!value) return null;
  return (
    <>
      <View style={styles.fact}>
        <Body muted>{label}</Body>
        <View style={{ flexDirection: 'row', flexShrink: 1 }}>
          <Body variant="strong" style={{ textAlign: 'right', flexShrink: 1 }}>
            {value}
          </Body>
          {est && <EstBadge />}
        </View>
      </View>
      <Divider />
    </>
  );
}

export default function FlightDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { flight, loaded } = useFlight(id);
  const { settings } = useSettings();
  const { c } = useTheme();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const [editing, setEditing] = useState(false);

  if (!loaded) return <Screen>{null}</Screen>;
  if (!flight) {
    return (
      <Screen>
        <EmptyState
          title="Flight not found"
          body="It may have been deleted."
          action="Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  if (editing) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Edit Flight' }} />
        <FlightForm
          initial={formFromFlight(flight)}
          submitLabel="Save changes"
          onSubmit={async (fields) => {
            await updateFlight(flight.id, fields);
            toast('Flight updated');
            setEditing(false);
          }}
        />
        <Button
          label="Cancel"
          variant="ghost"
          onPress={() => setEditing(false)}
          style={{ marginTop: space.sm }}
        />
      </Screen>
    );
  }

  const from = getAirport(flight.fromIata);
  const to = getAirport(flight.toIata);
  const km = flightDistanceKm(flight);
  const dur = flightDurationMin(flight, getAirport);
  const designator = [flight.airlineIata, flight.flightNumber].filter(Boolean).join(' ');
  const airline = airlineName(flight.airlineIata);
  const times =
    flight.depLocal || flight.arrLocal
      ? `${flight.depLocal ?? '—'} → ${flight.arrLocal ?? '—'}${flight.arrDayOffset ? ` (+${flight.arrDayOffset})` : ''}`
      : null;
  const cabin = CABIN_OPTIONS.find((o) => o.value === flight.cabin)?.label ?? null;
  const mapWidth = width - space.xl * 2;

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <IconButton
              icon="trash-2"
              label="Delete flight"
              onPress={() => confirmDelete(flight, () => router.back())}
            />
          ),
        }}
      />
      <View style={styles.head}>
        <AirlineLogo iata={flight.airlineIata} size={44} />
        <View style={{ flex: 1 }}>
          <Body variant="overline" muted>
            {flight.yearUnknown ? formatDayMonth(flight.date) : formatDate(flight.date)}
            {designator ? `  ·  ${designator}` : ''}
          </Body>
          {airline ? <Body variant="label">{airline}</Body> : null}
        </View>
      </View>
      {flight.yearUnknown && (
        <View style={[styles.notice, { borderColor: c.warning }]}>
          <Body color={c.warning} style={{ flex: 1 }}>
            The boarding pass didn’t include the year.
          </Body>
          <Button label="Set date" icon="calendar" onPress={() => setEditing(true)} />
        </View>
      )}
      <View style={styles.route}>
        <View style={{ flex: 1 }}>
          <Display size="xl">{flight.fromIata}</Display>
          <Body muted numberOfLines={2}>
            {from ? `${from.city || from.name}, ${countryName(from.country)}` : 'Unknown airport'}
          </Body>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Display size="xl">{flight.toIata}</Display>
          <Body muted numberOfLines={2} style={{ textAlign: 'right' }}>
            {to ? `${to.city || to.name}, ${countryName(to.country)}` : 'Unknown airport'}
          </Body>
        </View>
      </View>

      {from && to && (
        <View style={{ marginTop: space.xl }}>
          <WorldMap
            width={mapWidth}
            height={Math.round(mapWidth * 0.55)}
            routes={[{ a: from, b: to }]}
            dots={[from, to]}
            visited={new Set([from.country, to.country])}
            fit="routes"
            animate
            strokeScale={2}
            colors={{ land: c.mapLand, visited: c.border, arc: c.mapArc, dot: c.mapDot }}
          />
        </View>
      )}

      <View style={{ marginTop: space.xl }}>
        <Divider />
        <Fact
          label="Distance"
          value={km != null ? formatDistance(km, settings.distanceUnit) : null}
        />
        <Fact
          label="Duration"
          value={dur ? formatDuration(dur.minutes) : null}
          est={dur?.estimated}
        />
        <Fact label="Local times" value={times} />
        <Fact label="Airline" value={airline} />
        <Fact label="Seat" value={flight.seat} />
        <Fact label="Cabin" value={cabin} />
        <Fact label="Aircraft" value={flight.aircraftType} />
        <Fact label="Registration" value={flight.registration} />
        <Fact label="Notes" value={flight.notes} />
      </View>

      <View style={styles.actions}>
        <Button
          label="Make story"
          variant="primary"
          icon="image"
          onPress={() =>
            router.push({
              pathname: '/story/[template]',
              params: { template: 'flight', flightId: flight.id },
            })
          }
        />
        <Button label="Edit" icon="edit-3" onPress={() => setEditing(true)} />
        <Button
          label="Duplicate as return"
          icon="repeat"
          variant="ghost"
          onPress={() => router.push({ pathname: '/add/manual', params: { returnOf: flight.id } })}
        />
      </View>
      <AdSlot style={{ marginTop: space.section }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  route: { flexDirection: 'row', marginTop: space.lg, gap: space.lg },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1,
    borderRadius: 16,
    padding: space.md,
    marginTop: space.lg,
  },
  fact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.lg,
    paddingVertical: space.md,
  },
  actions: { marginTop: space.section, gap: space.md },
});
