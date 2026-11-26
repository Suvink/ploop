import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, space } from '@/theme/tokens';
import { Body } from './Text';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  hintColor?: string;
}

export function Field({ label, error, hint, hintColor, style, ...rest }: Props) {
  const { c } = useTheme();
  return (
    <View style={styles.wrap}>
      <Body variant="caption" muted>
        {label}
      </Body>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.textMuted}
        selectionColor={c.primary}
        {...rest}
        style={[
          styles.input,
          { color: c.text, borderColor: error ? c.danger : c.border, backgroundColor: c.surface },
          style,
        ]}
      />
      {error ? (
        <Body variant="caption" color={c.danger} accessibilityLiveRegion="polite">
          {error}
        </Body>
      ) : hint ? (
        <Body variant="caption" color={hintColor ?? c.textMuted}>
          {hint}
        </Body>
      ) : null}
    </View>
  );
}

/** A field-looking button that opens a picker. */
export function PickerField({
  label,
  value,
  placeholder,
  onPress,
  error,
  hint,
  hintColor,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  error?: string;
  hint?: string;
  hintColor?: string;
}) {
  const { c } = useTheme();
  return (
    <View style={styles.wrap}>
      <Body variant="caption" muted>
        {label}
      </Body>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        onPress={onPress}
        style={[
          styles.input,
          styles.picker,
          { borderColor: error ? c.danger : c.border, backgroundColor: c.surface },
        ]}
      >
        <Body color={value ? c.text : c.textMuted} numberOfLines={1}>
          {value || placeholder}
        </Body>
      </Pressable>
      {error ? (
        <Body variant="caption" color={c.danger}>
          {error}
        </Body>
      ) : hint ? (
        <Body variant="caption" color={hintColor ?? c.textMuted} numberOfLines={2}>
          {hint}
        </Body>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, flex: 1 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  picker: { justifyContent: 'center' },
});
