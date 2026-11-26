import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { airports, countryName, getAirport } from '@/data/refdata';
import type { Airport } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, space } from '@/theme/tokens';
import { IconButton } from './Button';
import { PickerField } from './Field';
import { Body, Display } from './Text';
import { Divider } from './Divider';

function AirportResult({ a, onPress }: { a: Airport; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${a.iata}, ${a.name}, ${a.city}, ${countryName(a.country)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Display size="xs" style={styles.code}>
        {a.iata}
      </Display>
      <View style={{ flex: 1 }}>
        <Body numberOfLines={1}>
          {a.city || a.name}, {countryName(a.country)}
        </Body>
        <Body variant="caption" muted numberOfLines={1}>
          {a.name}
        </Body>
      </View>
    </Pressable>
  );
}

export function AirportPicker({
  visible,
  title,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSelect: (iata: string) => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const results = useMemo(() => airports.search(q, 40), [q]);
  const raw = q.trim().toUpperCase();
  const allowRaw = /^[A-Z0-9]{3}$/.test(raw) && !getAirport(raw);

  const pick = (iata: string) => {
    onSelect(iata);
    setQ('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View
        style={[styles.sheet, { backgroundColor: c.background, paddingTop: insets.top + space.sm }]}
      >
        <View style={styles.header}>
          <Display size="sm" style={{ flex: 1 }} accessibilityRole="header">
            {title}
          </Display>
          <IconButton icon="x" label="Close" onPress={onClose} />
        </View>
        <TextInput
          autoFocus
          value={q}
          onChangeText={setQ}
          placeholder="Code, city or airport name"
          placeholderTextColor={c.textMuted}
          accessibilityLabel="Search airports"
          autoCorrect={false}
          autoCapitalize="characters"
          selectionColor={c.primary}
          style={[
            styles.search,
            { color: c.text, borderColor: c.border, backgroundColor: c.surface },
          ]}
        />
        <FlatList
          data={results}
          keyExtractor={(a) => a.iata}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={Divider}
          contentContainerStyle={{ paddingBottom: insets.bottom + space.xl }}
          ListHeaderComponent={
            allowRaw ? (
              <Pressable accessibilityRole="button" onPress={() => pick(raw)} style={styles.row}>
                <Display size="xs" style={styles.code} color={c.warning}>
                  {raw}
                </Display>
                <Body muted>Use “{raw}” (not in the airport list)</Body>
              </Pressable>
            ) : undefined
          }
          renderItem={({ item }) => <AirportResult a={item} onPress={() => pick(item.iata)} />}
          ListEmptyComponent={
            q.trim() && !allowRaw ? (
              <Body muted style={{ marginTop: space.xl }}>
                No airports match “{q.trim()}”.
              </Body>
            ) : undefined
          }
        />
      </View>
    </Modal>
  );
}

/** Form field: shows "CMB · Colombo"; amber hint for unknown codes. */
export function AirportField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (iata: string) => void;
  error?: string;
}) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const a = value ? getAirport(value) : undefined;
  const hint = value
    ? a
      ? `${a.name}, ${countryName(a.country)}`
      : 'Unknown airport code'
    : undefined;
  return (
    <>
      <PickerField
        label={label}
        value={value ? `${value}${a ? ` · ${a.city || a.name}` : ''}` : ''}
        placeholder="Search"
        onPress={() => setOpen(true)}
        error={error}
        hint={hint}
        hintColor={value && !a ? c.warning : undefined}
      />
      <AirportPicker
        visible={open}
        title={label}
        onClose={() => setOpen(false)}
        onSelect={onChange}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, paddingHorizontal: space.xl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: space.md },
  search: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    fontFamily: fonts.regular,
    fontSize: 16,
    marginBottom: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: space.md,
    minHeight: 56,
  },
  code: { width: 52, fontVariant: ['tabular-nums'] },
});
