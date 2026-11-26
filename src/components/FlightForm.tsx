import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import {
  applyDesignatorSplit,
  validateFlightForm,
  type FlightFields,
  type FlightFormValues,
  type FormErrors,
} from '@/lib/flightForm';
import { airlineName } from '@/data/refdata';
import { CABIN_OPTIONS } from '@/lib/cabins';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import { AirportField } from './AirportPicker';
import { Button } from './Button';
import { DateField } from './DateField';
import { Field } from './Field';
import { Segmented } from './Segmented';
import { Body } from './Text';
import { Icon } from './Icon';

export { CABIN_OPTIONS } from '@/lib/cabins';

export function FlightForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: FlightFormValues;
  submitLabel: string;
  onSubmit: (fields: FlightFields) => Promise<void>;
}) {
  const { c } = useTheme();
  const [v, setV] = useState<FlightFormValues>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(
    Boolean(initial.aircraftType || initial.registration || initial.notes || initial.durationMin),
  );
  const set = <K extends keyof FlightFormValues>(k: K, val: FlightFormValues[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  const submit = async () => {
    const r = validateFlightForm(v);
    if (!r.ok) {
      setErrors(r.errors);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await onSubmit(r.value);
    } finally {
      setBusy(false);
    }
  };

  const airlineHint = v.airlineIata.trim()
    ? (airlineName(v.airlineIata.trim().toUpperCase()) ?? undefined)
    : undefined;

  return (
    <View style={styles.form}>
      <DateField
        label="Date"
        value={v.date}
        yearUnknown={v.yearUnknown}
        onChange={(d) => setV((p) => ({ ...p, date: d, yearUnknown: false }))}
        error={errors.date}
      />
      <View style={styles.row}>
        <AirportField
          label="From"
          value={v.fromIata}
          onChange={(x) => set('fromIata', x)}
          error={errors.fromIata}
        />
        <AirportField
          label="To"
          value={v.toIata}
          onChange={(x) => set('toIata', x)}
          error={errors.toIata}
        />
      </View>
      <View style={styles.row}>
        <Field
          label="Airline"
          value={v.airlineIata}
          onChangeText={(t) => set('airlineIata', t.toUpperCase())}
          placeholder="UL"
          autoCapitalize="characters"
          maxLength={3}
          error={errors.airlineIata}
          hint={airlineHint}
        />
        <Field
          label="Flight number"
          value={v.flightNumber}
          onChangeText={(t) => set('flightNumber', t)}
          onBlur={() => setV((p) => applyDesignatorSplit(p))}
          placeholder="504 or UL504"
          autoCapitalize="characters"
          error={errors.flightNumber}
        />
      </View>
      <View style={styles.row}>
        <Field
          label="Departs (local)"
          value={v.depLocal}
          onChangeText={(t) => set('depLocal', t)}
          placeholder="HH:mm"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          error={errors.depLocal}
        />
        <Field
          label="Arrives (local)"
          value={v.arrLocal}
          onChangeText={(t) => set('arrLocal', t)}
          placeholder="HH:mm"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          error={errors.arrLocal}
        />
      </View>
      <View style={styles.switchRow}>
        <Body variant="label">Arrives the next day (+1)</Body>
        <Switch
          accessibilityLabel="Arrives the next day"
          value={v.arrNextDay}
          onValueChange={(b) => set('arrNextDay', b)}
          trackColor={{ true: c.primary, false: c.border }}
          thumbColor={c.surface}
        />
      </View>
      <View style={styles.row}>
        <Field
          label="Seat"
          value={v.seat}
          onChangeText={(t) => set('seat', t.toUpperCase())}
          placeholder="12A"
          autoCapitalize="characters"
          maxLength={4}
        />
        <View style={{ flex: 1 }} />
      </View>
      <View style={{ gap: 6 }}>
        <Body variant="caption" muted>
          Cabin
        </Body>
        <Segmented
          accessibilityLabel="Cabin"
          options={CABIN_OPTIONS}
          value={v.cabin}
          onChange={(x) => set('cabin', x === v.cabin ? null : x)}
        />
      </View>

      <Pressable accessibilityRole="button" onPress={() => setMore((m) => !m)} style={styles.more}>
        <Body variant="label" muted>
          {more ? 'Fewer details' : 'More details'}
        </Body>
        <Icon name={more ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
      </Pressable>
      {more && (
        <>
          <View style={styles.row}>
            <Field
              label="Aircraft"
              value={v.aircraftType}
              onChangeText={(t) => set('aircraftType', t)}
              placeholder="A330-300"
            />
            <Field
              label="Registration"
              value={v.registration}
              onChangeText={(t) => set('registration', t.toUpperCase())}
              placeholder="4R-ALO"
              autoCapitalize="characters"
            />
          </View>
          <Field
            label="Duration override (minutes)"
            value={v.durationMin ?? ''}
            onChangeText={(t) => set('durationMin', t.replace(/[^0-9]/g, ''))}
            placeholder="Leave empty to calculate"
            keyboardType="number-pad"
            error={errors.durationMin}
          />
          <Field
            label="Notes"
            value={v.notes}
            onChangeText={(t) => set('notes', t)}
            multiline
            style={{ minHeight: 88, paddingTop: 12, textAlignVertical: 'top' }}
          />
        </>
      )}

      <Button
        label={submitLabel}
        variant="primary"
        onPress={submit}
        loading={busy}
        style={{ marginTop: space.lg }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
  row: { flexDirection: 'row', gap: space.md },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  more: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: space.sm },
});
