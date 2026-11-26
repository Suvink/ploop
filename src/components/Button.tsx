import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { Body } from './Text';
import { Icon, type IconName } from './Icon';
import { titleCase } from '@/lib/titleCase';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
  /** Override the label colour (e.g. on top of the camera preview). */
  color?: string;
}

export function Button({
  label,
  onPress,
  variant = 'secondary',
  icon,
  disabled,
  loading,
  style,
  accessibilityHint,
  color,
}: Props) {
  const { c } = useTheme();
  const fg =
    color ?? (variant === 'primary' ? c.onPrimary : variant === 'danger' ? c.danger : c.text);
  const bg = variant === 'primary' ? c.primary : 'transparent';
  const border =
    variant === 'secondary' ? c.border : variant === 'danger' ? c.danger : 'transparent';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titleCase(label)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Icon name={icon} size={18} color={fg} />}
          <Body variant="strong" color={fg}>
            {titleCase(label)}
          </Body>
        </View>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  color,
  size = 22,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.icon, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Icon name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
