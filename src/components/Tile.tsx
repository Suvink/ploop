import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Body, Display } from './Text';

/** Small card: icon, big value, label. Lay out with <TileGrid>. */
export function Tile({
  icon,
  value,
  label,
  detail,
  onPress,
  leading,
  accent,
  info,
}: {
  icon?: IconName;
  value: string;
  label: string;
  detail?: string;
  onPress?: () => void;
  /** Replaces the icon (e.g. an airline logo). */
  leading?: ReactNode;
  accent?: boolean;
  /** Shows an ⓘ in the corner; pair with onPress to explain the number. */
  info?: boolean;
}) {
  const { c } = useTheme();
  const body = (
    <>
      <View style={styles.top}>
        {leading ?? (
          <View style={[styles.icon, { backgroundColor: c.iconBg }]}>
            {icon && <Icon name={icon} size={18} color={accent ? c.accentText : c.text} />}
          </View>
        )}
        {onPress && <Icon name={info ? 'info' : 'arrow-up-right'} size={16} color={c.textMuted} />}
      </View>
      <View style={{ gap: 2 }}>
        <Display size="md" bold numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Display>
        <Body variant="caption" muted numberOfLines={2}>
          {label}
        </Body>
        {detail ? (
          <Body variant="caption" color={c.accentText} numberOfLines={1}>
            {detail}
          </Body>
        ) : null}
      </View>
    </>
  );
  const style = [styles.tile, { backgroundColor: c.surface, borderColor: c.border }];
  const a11y = `${label}: ${value}${detail ? `, ${detail}` : ''}`;
  if (!onPress) {
    return (
      <View style={style} accessible accessibilityLabel={a11y}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityHint={info ? 'Shows how this was calculated' : undefined}
      onPress={onPress}
      style={({ pressed }) => [...style, { opacity: pressed ? 0.7 : 1 }]}
    >
      {body}
    </Pressable>
  );
}

/** Two-column grid of tiles. */
export function TileGrid({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    flexBasis: '46%',
    flexGrow: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.lg,
    gap: space.md,
    minHeight: 128,
    justifyContent: 'space-between',
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
