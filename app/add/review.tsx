import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useFlights } from '@/hooks/useFlights';
import { insertFlights } from '@/db/repo';
import { legToForm } from '@/lib/scan';
import {
  isDuplicate,
  validateFlightForm,
  type FlightFields,
  type FlightFormValues,
  type FormErrors,
} from '@/lib/flightForm';
import { clearPendingScan, takePendingScan } from '@/state/scanStore';
import { airlineName } from '@/data/refdata';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { Body, Display } from '@/components/Text';
import { Button } from '@/components/Button';
import { Divider } from '@/components/Divider';
import { Field } from '@/components/Field';
import { DateField } from '@/components/DateField';
import { AirportField } from '@/components/AirportPicker';
import { Segmented } from '@/components/Segmented';
import { CABIN_OPTIONS } from '@/components/FlightForm';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/Toast';

interface LegState {
  values: FlightFormValues;
  enabled: boolean;
  duplicate: boolean;
  errors: FormErrors;
}

function LegCard({
  index,
  total,
  leg,
  onChange,
}: {
  index: number;
  total: number;
  leg: LegState;
  onChange: (l: LegState) => void;
}) {
  const { c } = useTheme();
  const v = leg.values;
  const set = <K extends keyof FlightFormValues>(k: K, val: FlightFormValues[K]) =>
    onChange({ ...leg, values: { ...v, [k]: val } });
  return (
    <View style={{ gap: space.lg, opacity: leg.enabled ? 1 : 0.55 }}>
      <View style={styles.legHeader}>
        <View style={{ flex: 1 }}>
          <Body variant="overline" muted>
            {total > 1 ? `Leg ${index + 1} of ${total}` : 'Flight'}
          </Body>
          <Display size="md">
            {v.fromIata || '???'} → {v.toIata || '???'}
          </Display>
          {leg.duplicate && <Body color={c.warning}>Already in your log</Body>}
        </View>
        <Switch
          accessibilityLabel={`Save leg ${index + 1}`}
          value={leg.enabled}
          onValueChange={(b) => onChange({ ...leg, enabled: b })}
          trackColor={{ true: c.primary, false: c.border }}
          thumbColor={c.surface}
        />
      </View>
      {leg.enabled && (
        <>
          <DateField
            label="Date"
            value={v.date}
            yearUnknown={v.yearUnknown}
            onChange={(d) => onChange({ ...leg, values: { ...v, date: d, yearUnknown: false } })}
            error={leg.errors.date}
          />
          <View style={styles.row}>
            <AirportField
              label="From"
              value={v.fromIata}
              onChange={(x) => set('fromIata', x)}
              error={leg.errors.fromIata}
            />
            <AirportField
              label="To"
              value={v.toIata}
              onChange={(x) => set('toIata', x)}
              error={leg.errors.toIata}
            />
          </View>
          <View style={styles.row}>
            <Field
              label="Airline"
              value={v.airlineIata}
              onChangeText={(t) => set('airlineIata', t.toUpperCase())}
              maxLength={3}
              autoCapitalize="characters"
              hint={airlineName(v.airlineIata) ?? undefined}
              error={leg.errors.airlineIata}
            />
            <Field
              label="Flight number"
              value={v.flightNumber}
              onChangeText={(t) => set('flightNumber', t)}
              autoCapitalize="characters"
            />
          </View>
          <View style={styles.row}>
            <Field
              label="Seat"
              value={v.seat}
              onChangeText={(t) => set('seat', t.toUpperCase())}
              maxLength={4}
              autoCapitalize="characters"
            />
            <View style={{ flex: 1 }} />
          </View>
          <View style={{ gap: 6 }}>
            <Body variant="caption" muted>
              Cabin (best guess from the barcode)
            </Body>
            <Segmented
              accessibilityLabel="Cabin"
              options={CABIN_OPTIONS}
              value={v.cabin}
              onChange={(x) => set('cabin', x)}
            />
          </View>
          <View style={styles.row}>
            <Field
              label="Departs (optional)"
              value={v.depLocal}
              onChangeText={(t) => set('depLocal', t)}
              placeholder="HH:mm"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              error={leg.errors.depLocal}
            />
            <Field
              label="Arrives (optional)"
              value={v.arrLocal}
              onChangeText={(t) => set('arrLocal', t)}
              placeholder="HH:mm"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              error={leg.errors.arrLocal}
            />
          </View>
        </>
      )}
    </View>
  );
}

export default function ReviewScreen() {
  const { c } = useTheme();
  const toast = useToast();
  const { flights, loaded } = useFlights();
  const [pass] = useState(() => takePendingScan());
  const [edited, setLegs] = useState<LegState[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => () => clearPendingScan(), []);

  const initial = useMemo(() => {
    if (!pass) return [];
    const today = DateTime.local();
    return pass.legs.map((l) => legToForm(l, today, pass.issued));
  }, [pass]);

  // Duplicate detection runs against the log as loaded; user edits then take over.
  const computed = useMemo<LegState[] | null>(() => {
    if (!loaded) return null;
    return initial.map((values) => {
      const dup = isDuplicate(flights, {
        date: values.date,
        fromIata: values.fromIata,
        toIata: values.toIata,
        flightNumber: values.flightNumber || null,
      });
      return { values, enabled: !dup, duplicate: dup, errors: {} };
    });
  }, [loaded, initial, flights]);
  const legs = edited ?? computed;

  if (!pass) {
    return (
      <Screen>
        <EmptyState
          title="Nothing to review"
          body="Scan a boarding pass first."
          action="Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }
  if (!legs) return <Screen>{null}</Screen>;

  const enabledCount = legs.filter((l) => l.enabled).length;

  const save = async () => {
    const out: FlightFields[] = [];
    let hasErrors = false;
    const next = legs.map((l) => {
      if (!l.enabled) return { ...l, errors: {} };
      const r = validateFlightForm(l.values);
      if (!r.ok) {
        hasErrors = true;
        return { ...l, errors: r.errors };
      }
      out.push(r.value);
      return { ...l, errors: {} };
    });
    setLegs(next);
    if (hasErrors || out.length === 0) return;
    setSaving(true);
    try {
      await insertFlights(out, 'scan');
      clearPendingScan();
      toast(out.length === 1 ? 'Flight saved' : `${out.length} flights saved`);
      router.dismissTo('/flights');
    } catch (e) {
      toast(`Couldn’t save: ${String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      {pass.partial && (
        <Body color={c.warning} style={{ marginBottom: space.lg }}>
          Part of this barcode couldn’t be read. Please check the details.
        </Body>
      )}
      <View style={{ gap: space.xl }}>
        {legs.map((leg, i) => (
          <View key={i} style={{ gap: space.xl }}>
            {i > 0 && <Divider />}
            <LegCard
              index={i}
              total={legs.length}
              leg={leg}
              onChange={(l) => setLegs(legs.map((x, j) => (j === i ? l : x)))}
            />
          </View>
        ))}
      </View>
      <Button
        label={
          enabledCount === 0
            ? 'Nothing selected'
            : enabledCount === 1
              ? 'Save flight'
              : `Save ${enabledCount} flights`
        }
        variant="primary"
        disabled={enabledCount === 0}
        loading={saving}
        onPress={save}
        style={{ marginTop: space.section }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  legHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  row: { flexDirection: 'row', gap: space.md },
});
