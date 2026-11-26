import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Body } from './Text';

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  accessibilityLabel: string;
}) {
  const { c } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.wrap, { borderColor: c.border }]}
    >
      {options.map((o, i) => {
        const sel = o.value === value;
        return (
          <Pressable
            key={`${String(o.value)}-${i}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: sel }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={[styles.seg, sel && { backgroundColor: c.selected }]}
          >
            <Body variant="label" color={sel ? c.onSelected : c.text} numberOfLines={1}>
              {o.label}
            </Body>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderWidth: 1, borderRadius: radius.pill, padding: 3 },
  seg: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
  },
});
